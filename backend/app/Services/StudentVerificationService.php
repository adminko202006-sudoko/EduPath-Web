<?php

namespace App\Services;

use App\Models\Applicant;
use App\Models\StudentVerification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class StudentVerificationService
{
    public function validate(Request $request, ?Applicant $applicant = null): array
    {
        $number = $request->input('tmc_student_number');
        if (is_string($number)) $request->merge(['tmc_student_number' => strtoupper(preg_replace('/[\s-]+/', '', $number))]);
        $existing = $applicant ? StudentVerification::where('applicant_id', $applicant->id)->first() : null;
        $data = $request->validate([
            'student_type' => ['required', Rule::in(['new', 'old', 'transferee'])],
            'lrn' => ['required', 'string', 'regex:/^[0-9]{12}$/D', Rule::unique('student_verifications', 'lrn')->ignore($existing?->id)],
            'tmc_student_number' => ['required_if:student_type,old', 'nullable', 'string', 'max:50', 'regex:/^[A-Z0-9]+$/D', Rule::unique('student_verifications', 'tmc_student_number')->ignore($existing?->id)],
            'previous_school' => 'required|string|max:255',
            'school_id' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
        ], [
            'lrn.unique' => 'This LRN is already linked to an account. Sign in or contact the college for account recovery.',
            'tmc_student_number.unique' => 'This TMC student number is already linked to an account. Contact the college for account recovery.',
        ]);
        if ($existing && $existing->lrn !== $data['lrn']) {
            throw ValidationException::withMessages(['lrn' => ['The LRN linked to this account cannot be changed. Contact the college to correct an identity record.']]);
        }
        // Historical profile LRNs are retained; do not let a new claim take one over.
        if (Schema::hasColumn('applicants', 'lrn') && Applicant::where('lrn', $data['lrn'])
            ->when($applicant, fn ($q) => $q->whereKeyNot($applicant->id))->exists()) {
            throw ValidationException::withMessages(['lrn' => ['This LRN is already on a student record. Contact the college for account recovery.']]);
        }
        if ($data['student_type'] !== 'old') $data['tmc_student_number'] = null;
        else $data['previous_school'] = 'Trinidad Municipal College';
        return $data;
    }

    // Caller holds the applicant lock. The unique indexes also arbitrate concurrent registrations.
    public function submit(Applicant $applicant, array $data, string $path, User $actor): StudentVerification
    {
        if (!$applicant->first_name || !$applicant->last_name || !$applicant->birth_date) {
            throw ValidationException::withMessages(['profile' => ['Complete your first name, last name and birth date in My Profile before submitting your school identity.']]);
        }
        $record = StudentVerification::where('applicant_id', $applicant->id)->lockForUpdate()->first();
        abort_if($record && $record->status !== 'rejected', 409, 'Your identity is already submitted. Wait for the administrator review.');
        $record ??= new StudentVerification(['applicant_id' => $applicant->id]);
        $record->fill(collect($data)->only(['student_type', 'lrn', 'tmc_student_number', 'previous_school'])->all());
        $record->fill(['school_id_path' => $path, 'status' => 'pending', 'academic_program_id' => null,
            'reviewed_by' => null, 'reviewed_at' => null, 'feedback' => null,
            'revision' => $record->exists ? $record->revision + 1 : 1])->save();
        if (Schema::hasColumn('applicants', 'lrn')) $applicant->update(['lrn' => $record->lrn]);
        $this->audit($record, $actor, 'submitted');
        return $record;
    }

    public function audit(StudentVerification $record, User $actor, string $action): void
    {
        $applicant = $record->applicant;
        DB::table('student_verification_events')->insert([
            'student_verification_id' => $record->id, 'actor_id' => $actor->id, 'action' => $action,
            'snapshot' => json_encode(array_merge($record->getAttributes(), [
                'first_name' => $applicant->first_name, 'middle_name' => $applicant->middle_name,
                'last_name' => $applicant->last_name, 'birth_date' => $applicant->birth_date?->toDateString(),
            ]), JSON_THROW_ON_ERROR), 'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    public function ensureCanApply(Applicant $applicant, bool $admission = false): StudentVerification
    {
        $record = StudentVerification::where('applicant_id', $applicant->id)->first();
        abort_unless($record?->status === 'verified' && $applicant->user?->email_verified_at,
            403, 'Verify your email and have your school identity approved by the administrator before applying. You can continue browsing.');
        abort_if($applicant->is_archived, 403, 'This applicant record is archived. Contact the college.');
        abort_if($admission && $record->student_type === 'old', 403, 'Old students use their administrator-confirmed program and cannot submit a new program admission.');
        return $record;
    }

    public function hasScholarshipAdmission(Applicant $applicant): bool
    {
        $record = StudentVerification::where('applicant_id', $applicant->id)->first();
        return ($record?->status === 'verified' && $record->student_type === 'old' && $record->academic_program_id)
            || $applicant->admissionApplications()->where('status', 'approved')->exists();
    }

    public function protectProfileIdentity(Applicant $applicant, array $changes): void
    {
        $record = StudentVerification::where('applicant_id', $applicant->id)->first();
        if (!$record) return;
        foreach (['first_name', 'middle_name', 'last_name', 'birth_date', 'lrn'] as $field) {
            if (!array_key_exists($field, $changes)) continue;
            $current = $field === 'lrn' ? $record->lrn : ($field === 'birth_date' ? $applicant->birth_date?->toDateString() : $applicant->$field);
            if ((string) ($changes[$field] ?? '') !== (string) ($current ?? '') && ($field === 'lrn' || $record->status !== 'rejected')) {
                throw ValidationException::withMessages([$field => ['This identity field is locked for verification. Contact the college if it needs correction.']]);
            }
        }
    }
}
