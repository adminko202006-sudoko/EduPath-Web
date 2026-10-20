<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\OnlineExamAttempt;
use App\Models\OnlineExamReview;
use App\Services\WorkflowDecisionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OnlineExamReviewController extends Controller
{
    private function scoped(Request $request)
    {
        $programs = $request->user()->staff->academicPrograms()->pluck('academic_programs.id');

        return OnlineExamAttempt::query()->whereHas('applicant.admissionApplications',
            fn ($query) => $query->whereIn('academic_program_id', $programs)->where('status', 'approved'));
    }

    public function index(Request $request)
    {
        $filters = $request->validate([
            'search' => 'nullable|string|max:255',
            'status' => 'nullable|in:in_progress,completed,expired',
            'page' => 'nullable|integer|min:1',
        ]);
        $attempts = $this->scoped($request)
            ->with(['applicant:id,first_name,last_name', 'reviews'])
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when(trim($filters['search'] ?? ''), function ($q, $search) {
                $q->whereHas('applicant', fn ($a) => $a->where(fn ($names) =>
                    $names->where('first_name', 'like', "%{$search}%")->orWhere('last_name', 'like', "%{$search}%")));
            })
            ->latest('id')->paginate(25);
        // Explicit allowlist: no answer keys, options, answers, private contact data or admin remarks.
        $attempts->through(fn ($attempt) => $this->summary($attempt));

        return response()->json(['success' => true, 'data' => $attempts]);
    }

    public function review(Request $request, OnlineExamAttempt $attempt)
    {
        abort_unless($this->scoped($request)->whereKey($attempt->id)->exists(), 403, 'This attempt is outside your assigned programs.');
        $values = $request->validate([
            'recommendation' => 'required|in:ready_for_admin_review,needs_attention',
            'remarks' => 'required|string|min:5|max:2000',
        ]);

        return DB::transaction(function () use ($request, $attempt, $values) {
            $locked = OnlineExamAttempt::whereKey($attempt->id)->lockForUpdate()->firstOrFail();
            abort_unless($this->scoped($request)->whereKey($locked->id)->exists(), 403, 'This attempt is outside your assigned programs.');
            abort_unless(in_array($locked->status, ['completed', 'expired'], true), 409, 'Only a submitted or expired attempt can be reviewed.');
            abort_if($locked->results_released_at !== null, 409, 'An officially released result cannot receive further review changes.');
            $review = OnlineExamReview::firstOrNew(['online_exam_attempt_id' => $locked->id, 'reviewed_by' => $request->user()->id]);
            $old = $review->recommendation;
            $review->fill($values);
            if (!$review->exists || $review->isDirty()) {
                $review->save();
                app(WorkflowDecisionService::class)->event('online_exam', $locked->id, 'staff_review', $old, $review->recommendation, $review->remarks, $request->user());
            }

            return response()->json(['success' => true, 'message' => 'Recommendation recorded for administrator review.', 'data' => $this->summary($locked->load(['applicant:id,first_name,last_name', 'reviews']))]);
        }, 3);
    }

    private function summary(OnlineExamAttempt $attempt): array
    {
        return [
            'id' => $attempt->id,
            'applicant' => $attempt->applicant,
            'status' => $attempt->status,
            'started_at' => $attempt->started_at,
            'completed_at' => $attempt->completed_at,
            'question_count' => $attempt->question_count,
            'current_question_index' => $attempt->current_question_index,
            'score' => $attempt->status === 'in_progress' ? null : $attempt->score,
            'results_released_at' => $attempt->results_released_at,
            'reviews' => $attempt->reviews,
        ];
    }
}
