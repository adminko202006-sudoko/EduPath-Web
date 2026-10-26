<?php

namespace App\Services;

use App\Models\Applicant;
use App\Models\EntranceExam;
use App\Models\ExamAssignment;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class EntranceExamAssignmentAvailability
{
    /** Call inside a transaction. Applicant locks serialize different sessions. */
    public function assertAvailable(EntranceExam $exam, array $applicantIds, string $date, string $field = 'applicant_ids'): void
    {
        if (!$applicantIds) return;

        Applicant::whereIn('id', $applicantIds)->orderBy('id')->lockForUpdate()->get(['id']);
        $conflict = ExamAssignment::whereIn('applicant_id', $applicantIds)
            ->where('entrance_exam_id', '!=', $exam->id)
            ->whereHas('entranceExam', fn ($query) => $query->whereDate('exam_date', $date))
            ->lockForUpdate()->first(['id']);

        if ($conflict) {
            throw ValidationException::withMessages([
                $field => 'One or more selected applicants are already assigned to another entrance exam on '.$date.'. Each applicant can only be assigned once per exam date, regardless of the session time. No changes were saved.',
            ]);
        }
    }

    public function validateDateChange(EntranceExam $exam, array $validated): void
    {
        if (!isset($validated['exam_date'])) return;
        $date = Carbon::parse($validated['exam_date'])->toDateString();
        if ($date === $exam->exam_date->toDateString()) return;

        $this->assertAvailable($exam, $exam->examAssignments()->pluck('applicant_id')->all(), $date, 'exam_date');
    }
}
