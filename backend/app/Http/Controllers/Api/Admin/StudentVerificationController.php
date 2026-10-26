<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Applicant;
use App\Models\StudentVerification;
use App\Services\StudentVerificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class StudentVerificationController extends Controller
{
    public function index(Request $request)
    {
        $data = $request->validate(['status' => 'nullable|in:pending,verified,rejected', 'search' => 'nullable|string|max:100']);
        $query = StudentVerification::with(['applicant.user:id,name,email,email_verified_at', 'academicProgram', 'reviewer:id,name']);
        if (!empty($data['status'])) $query->where('status', $data['status']);
        if (!empty($data['search'])) {
            $search = $data['search'];
            $query->where(fn ($q) => $q->where('lrn', 'like', "%{$search}%")
                ->orWhere('tmc_student_number', 'like', "%{$search}%")
                ->orWhereHas('applicant.user', fn ($u) => $u->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%")));
        }
        return response()->json($query->latest('updated_at')->paginate(20));
    }

    public function review(Request $request, StudentVerification $verification, StudentVerificationService $service)
    {
        $data = $request->validate([
            'status' => 'required|in:verified,rejected', 'revision' => 'required|integer|min:1',
            'feedback' => 'required_if:status,rejected|nullable|string|max:2000',
            'academic_program_id' => ['nullable', 'integer', Rule::exists('academic_programs', 'id')],
            'identity_checked' => 'accepted',
            'lrn' => ['sometimes', 'required', 'string', 'regex:/^[0-9]{12}$/D', Rule::unique('student_verifications', 'lrn')->ignore($verification->id)],
        ]);
        return DB::transaction(function () use ($request, $verification, $data, $service) {
            Applicant::whereKey($verification->applicant_id)->lockForUpdate()->firstOrFail();
            $record = StudentVerification::whereKey($verification->id)->lockForUpdate()->firstOrFail();
            abort_if($record->revision !== (int) $data['revision'], 409, 'This verification changed. Refresh it before reviewing.');
            abort_if($record->status === $data['status'], 409, 'This decision is already recorded.');
            if (isset($data['lrn']) && $data['lrn'] !== $record->lrn) {
                abort_unless(!empty($data['feedback']), 422, 'Explain the LRN correction in the review feedback.');
                abort_if(Applicant::where('lrn', $data['lrn'])->whereKeyNot($record->applicant_id)->exists(), 422,
                    'This LRN belongs to another student record. Resolve the existing account instead.');
                $record->lrn = $data['lrn'];
                $record->applicant->update(['lrn' => $data['lrn']]);
            }
            if ($data['status'] === 'verified') {
                abort_unless($record->status === 'pending', 409, 'The student must resubmit a rejected identity before approval.');
                abort_unless(Storage::disk('local')->exists($record->school_id_path), 422, 'The school ID file is missing. Request resubmission.');
                if ($record->student_type === 'old') {
                    abort_unless(!empty($data['academic_program_id']), 422, 'Confirm the existing TMC program for this old student.');
                }
            }
            $record->fill(['status' => $data['status'], 'feedback' => $data['feedback'] ?? null,
                'academic_program_id' => $data['status'] === 'verified' && $record->student_type === 'old' ? $data['academic_program_id'] : null,
                'reviewed_by' => $request->user()->id, 'reviewed_at' => now(), 'revision' => $record->revision + 1])->save();
            $service->audit($record, $request->user(), $data['status']);
            \App\Models\Notification::create(['user_id' => $record->applicant->user_id,
                'title' => $data['status'] === 'verified' ? 'School identity verified' : 'School identity needs attention',
                'message' => $data['status'] === 'verified'
                    ? 'The administrator verified your school identity. Verify your email too before applying. Check Account Verification for your current eligibility.'
                    : 'Please open Account Verification to read the administrator feedback and submit your corrected school identity.',
            ]);
            return response()->json(['message' => 'Identity review saved.', 'data' => $record->load('academicProgram')]);
        });
    }

    public function file(StudentVerification $verification)
    {
        abort_unless(Storage::disk('local')->exists($verification->school_id_path), 404, 'School ID file is unavailable.');
        return Storage::disk('local')->download($verification->school_id_path, 'school-id.'.pathinfo($verification->school_id_path, PATHINFO_EXTENSION), ['Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
    }

    public function history(StudentVerification $verification)
    {
        $events = DB::table('student_verification_events')->where('student_verification_id', $verification->id)->orderByDesc('id')->get();
        return response()->json(['data' => $events->map(function ($event) {
            $snapshot = json_decode($event->snapshot, true);
            unset($snapshot['school_id_path']);
            return ['id' => $event->id, 'actor_id' => $event->actor_id, 'action' => $event->action, 'snapshot' => $snapshot, 'created_at' => \Carbon\Carbon::parse($event->created_at)->toIso8601String()];
        })]);
    }
}
