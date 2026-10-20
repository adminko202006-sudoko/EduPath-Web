<?php

namespace App\Http\Controllers\Concerns;

use App\Models\EntranceExam;
use Illuminate\Validation\ValidationException;

trait ValidatesEntranceExamTimes
{
    /** Compare the resulting schedule, including fields omitted in a partial update. */
    protected function validateEntranceExamTimes(array $validated, EntranceExam $exam): void
    {
        if (!array_key_exists('start_time', $validated) && !array_key_exists('end_time', $validated)) {
            return;
        }

        $start = substr((string) ($validated['start_time'] ?? $exam->start_time), 0, 5);
        $end = substr((string) ($validated['end_time'] ?? $exam->end_time), 0, 5);
        if ($start === '' || $end === '' || $end <= $start) {
            throw ValidationException::withMessages([
                'end_time' => 'The end time must be after the start time.',
            ]);
        }
    }
}
