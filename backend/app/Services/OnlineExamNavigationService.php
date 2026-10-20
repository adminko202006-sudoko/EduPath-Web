<?php

namespace App\Services;

use App\Models\OnlineExamAttempt;

class OnlineExamNavigationService
{
    public const REVIEW_CUTOFF = 25;

    public function enabled(OnlineExamAttempt $attempt): bool
    {
        return (int) $attempt->navigation_mode === 2;
    }

    public function deadline(OnlineExamAttempt $attempt): ?\Illuminate\Support\Carbon
    {
        if (!$attempt->started_at) return null;
        $deadline = $attempt->started_at->copy()->addSeconds(((int) $attempt->current_question_index + 1) * max(1, $attempt->seconds_per_question));
        if ($attempt->expires_at && $attempt->expires_at->lessThan($deadline)) $deadline = $attempt->expires_at->copy();
        return $deadline;
    }

    public function remaining(OnlineExamAttempt $attempt): float
    {
        $deadline = $this->deadline($attempt);
        return $deadline ? max(0, now()->diffInSeconds($deadline, false)) : 0;
    }

    /** Caller holds the attempt row lock. No client timer values are accepted. */
    public function synchronize(OnlineExamAttempt $attempt): void
    {
        if (!$this->enabled($attempt) || $attempt->status !== 'in_progress' || !$attempt->started_at) return;
        $elapsed = max(0, $attempt->started_at->diffInSeconds(now(), false));
        $clockIndex = min((int) floor($elapsed / max(1, $attempt->seconds_per_question)), max(0, $attempt->question_count - 1));
        $active = max((int) $attempt->current_question_index, $clockIndex);
        $view = min((int) $attempt->viewed_question_index, $active);
        if ($active !== (int) $attempt->current_question_index) $view = $active;
        $attempt->current_question_index = $active;
        if ($this->remaining($attempt) <= self::REVIEW_CUTOFF) $view = $active;
        if ($attempt->isDirty('current_question_index') || $view !== (int) $attempt->viewed_question_index) {
            $attempt->viewed_question_index = $view;
            $attempt->navigation_revision = (int) $attempt->navigation_revision + 1;
            $attempt->save();
        }
    }

    public function viewedIndex(OnlineExamAttempt $attempt): int
    {
        return $this->enabled($attempt) ? (int) $attempt->viewed_question_index : (int) $attempt->current_question_index;
    }
}
