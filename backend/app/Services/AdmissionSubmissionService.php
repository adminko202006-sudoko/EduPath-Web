<?php

namespace App\Services;

use App\Models\AdmissionApplication;
use App\Models\AdmissionApplicationHistory;
use App\Models\AdmissionPeriod;
use App\Models\Applicant;
use App\Models\User;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AdmissionSubmissionService
{
    public const ACTIVE_STATUSES = ['pending', 'under_review', 'approved'];

    // Caller must hold the applicant row lock, including when reopening a rejected record.
    public function ensureNoActiveApplication(int $applicantId, ?int $periodId, ?int $except = null): void
    {
        $existing = AdmissionApplication::where('applicant_id', $applicantId)
            ->where('admission_period_id', $periodId)
            ->whereIn('status', self::ACTIVE_STATUSES)
            ->when($except !== null, fn ($q) => $q->where('id', '!=', $except))
            ->lockForUpdate()->first();

        if ($existing) {
            throw new HttpResponseException(response()->json([
                'success' => false,
                'code' => 'ADMISSION_APPLICATION_EXISTS',
                'message' => $existing->status === 'approved'
                    ? 'An admission application is already approved for this admission period. You cannot submit another application for the same period.'
                    : 'An admission application is already pending or under review for this admission period. Please check your existing application.',
            ], 409));
        }
    }

    public function submit(int $applicantId, int $programId, ?string $remarks, User $actor): AdmissionApplication
    {
        return DB::transaction(function () use ($applicantId, $programId, $remarks, $actor) {
            // All web, mobile and admin submissions serialize on the same parent row.
            Applicant::whereKey($applicantId)->lockForUpdate()->firstOrFail();
            $period = AdmissionPeriod::where('status', 'open')
                ->whereDate('start_date', '<=', now()->toDateString())
                ->whereDate('end_date', '>=', now()->toDateString())
                ->sharedLock()->first();
            if (!$period) {
                throw ValidationException::withMessages(['admission_period' => ['There is currently no open admission period.']]);
            }
            $this->ensureNoActiveApplication($applicantId, $period->id);
            $program = DB::table('academic_programs')->where('id', $programId)->sharedLock()->first();
            if (!$program || !$program->is_active) {
                throw ValidationException::withMessages(['academic_program_id' => ['Select an active academic program.']]);
            }

            $application = AdmissionApplication::create([
                'applicant_id' => $applicantId, 'academic_program_id' => $programId,
                'admission_period_id' => $period->id, 'status' => 'pending',
                'remarks' => $remarks, 'submitted_at' => now(),
            ]);
            AdmissionApplicationHistory::create([
                'admission_application_id' => $application->id, 'user_id' => $actor->id,
                'action' => 'submitted', 'old_status' => null, 'new_status' => 'pending',
                'remarks' => $actor->role === 'admin' ? 'Application created by an administrator.' : $remarks,
            ]);
            return $application;
        }, 3);
    }
}
