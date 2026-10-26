<?php

namespace App\Services;

use App\Models\EntranceExam;
use App\Models\ExamAssignment;
use App\Models\Scholarship;
use App\Models\ScholarshipApplication;
use Illuminate\Validation\ValidationException;

class FheEntranceEligibilityService
{
    public function applies(?Scholarship $scholarship): bool
    {
        return $scholarship && preg_match('/\bFHE\b|free\s+higher\s+education/i',
            ($scholarship->name ?? '').' '.($scholarship->program_type ?? '')) === 1;
    }

    public function hasPassingResult(int $applicantId): bool
    {
        return ExamAssignment::where('applicant_id', $applicantId)
            ->where('status', 'completed')
            ->whereBetween('score', [EntranceExam::PASSING_SCORE, EntranceExam::MAXIMUM_SCORE])
            ->whereHas('entranceExam', fn ($query) => $query->whereNotNull('results_released_at'))
            ->exists();
    }

    public function ensureEligible(ScholarshipApplication $application): void
    {
        if ($this->applies($application->scholarship) && !$this->hasPassingResult($application->applicant_id)) {
            throw ValidationException::withMessages([
                'status' => 'FHE approval and awarding require a completed, officially released entrance-exam result of at least 40 out of 100. Keep this application pending until that result is available.',
            ]);
        }
    }
}
