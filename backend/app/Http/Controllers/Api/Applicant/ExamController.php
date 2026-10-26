<?php

namespace App\Http\Controllers\Api\Applicant;

use App\Http\Controllers\Controller;
use App\Models\ExamAssignment;
use Illuminate\Http\Request;
use App\Models\EntranceExam;
use App\Services\EntranceExamRosterService;

class ExamController extends Controller
{
    /**
     * Display the applicant's assigned entrance exams.
     */
    public function index(Request $request)
    {
        $applicant = $request->user()->applicant;

        if (!$applicant) {
            return response()->json(['success' => false, 'message' => 'Applicant profile not found.'], 403);
        }

        $assignments = ExamAssignment::with('entranceExam')
            ->where('applicant_id', $applicant->id)
            ->latest()
            ->get();

        $assignments->each(function ($assignment) {
            $this->documentEligibility($assignment);
            if (!$assignment->entranceExam?->results_released_at) {
                $assignment->makeHidden(['score', 'remarks']);
            } else {
                $assignment->setAttribute('passed', $this->passed($assignment));
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Your entrance exams retrieved successfully.',
            'data' => $assignments,
        ]);
    }

    /**
     * Display a specific exam assignment.
     */
    public function show(Request $request, ExamAssignment $assignment)
    {
        $applicant = $request->user()->applicant;

        if (!$applicant) {
            return response()->json(['success' => false, 'message' => 'Applicant profile not found.'], 403);
        }

        if ((int) $assignment->applicant_id !== (int) $applicant->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access.',
            ], 403);
        }

        $assignment->load('entranceExam');
        $this->documentEligibility($assignment);

        if (!$assignment->entranceExam?->results_released_at) {
            $assignment->makeHidden(['score', 'remarks']);
        } else {
            $assignment->setAttribute('passed', $this->passed($assignment));
        }

        return response()->json([
            'success' => true,
            'message' => 'Entrance exam assignment retrieved successfully.',
            'data' => $assignment,
        ]);
    }

    private function documentEligibility(ExamAssignment $assignment): void
    {
        $eligible = $assignment->status !== 'scheduled'
            || app(\App\Services\ExamDocumentEligibility::class)->eligible($assignment->applicant_id);
        $assignment->setAttribute('documents_verified', $assignment->status === 'scheduled' ? $eligible : null);
        $assignment->setAttribute('eligibility_reason', $eligible ? null : \App\Services\ExamDocumentEligibility::MESSAGE);
    }

    private function passed(ExamAssignment $assignment): bool
    {
        return $assignment->status === 'completed' && $assignment->score !== null
            && $assignment->score >= EntranceExam::PASSING_SCORE && $assignment->score <= EntranceExam::MAXIMUM_SCORE;
    }

    public function roster(Request $request, ExamAssignment $assignment, EntranceExamRosterService $rosters)
    {
        abort_unless($request->user()->applicant && (int) $assignment->applicant_id === (int) $request->user()->applicant->id, 403, 'Unauthorized access.');
        if ($assignment->status === 'scheduled') {
            app(\App\Services\ExamDocumentEligibility::class)->ensureEligible($assignment->applicant_id);
        }
        $values = $request->validate(['source' => 'sometimes|in:uploaded,generated']);
        return $rosters->download($assignment->entranceExam, $values['source'] ?? 'generated');
    }
}
