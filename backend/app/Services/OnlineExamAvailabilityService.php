<?php

namespace App\Services;

use App\Models\Applicant;
use App\Models\OnlineExamAttempt;
use App\Models\OnlineExamQuestion;
use App\Models\OnlineExamRetakeGrant;
use App\Models\ScholarshipApplication;
use Illuminate\Support\Facades\DB;

class OnlineExamAvailabilityService
{
    public function notifyIfEligible(int $applicantId): void
    {
        DB::transaction(function () use ($applicantId) {
            $applicant = Applicant::whereKey($applicantId)->lockForUpdate()->firstOrFail();
            if (!$applicant->admissionApplications()->where('status', 'approved')->exists()) return;
            if (!app(ExamDocumentEligibility::class)->eligible($applicantId, true)) return;
            $scholarships = ScholarshipApplication::where('applicant_id', $applicantId)->where('status', 'approved')->with('scholarship')->get();
            if (!$scholarships->contains(fn ($application) => $application->scholarship?->is_active
                && $application->scholarship?->category === 'other' && $application->scholarship?->requires_online_exam)) return;
            if (OnlineExamQuestion::eligible()->count() < \App\Models\OnlineExamSetting::requiredQuestionCount()) return;
            if (OnlineExamAttempt::where('applicant_id', $applicantId)->where('status', 'in_progress')->exists()) return;
            $used = OnlineExamAttempt::where('applicant_id', $applicantId)->count();
            $allowed = 1 + OnlineExamRetakeGrant::where('applicant_id', $applicantId)->count();
            if ($used >= $allowed) return;
            $next = $used + 1;
            if (DB::table('online_exam_availability_notices')->where('applicant_id', $applicantId)->where('attempt_number', $next)->lockForUpdate()->first()) return;

            $notification = app(ApplicantNotificationService::class)->create($applicant->user_id,
                'Online scholarship examination available',
                'You are currently eligible to start online examination attempt '.$next.'. Open Online Scholarship Examination for instructions. Eligibility is checked again when you start; examination completion is separate from the final scholarship award.', 'exam');
            DB::table('online_exam_availability_notices')->insert([
                'applicant_id' => $applicantId, 'attempt_number' => $next, 'notification_id' => $notification->id,
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }, 3);
    }

    public function notifyEligibleApplicants(): void
    {
        // Durable per-attempt notice keys make repeat publication/retries safe.
        Applicant::whereHas('admissionApplications', fn ($q) => $q->where('status', 'approved'))
            ->whereHas('scholarshipApplications', fn ($q) => $q->where('status', 'approved'))
            ->chunkById(100, function ($applicants) {
                foreach ($applicants as $applicant) $this->notifyIfEligible($applicant->id);
            });
    }
}
