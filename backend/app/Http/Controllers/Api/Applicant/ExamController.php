<?php

namespace App\Http\Controllers\Api\Applicant;

use App\Http\Controllers\Controller;
use App\Models\ExamAssignment;
use Illuminate\Http\Request;

class ExamController extends Controller
{
    /**
     * Display the applicant's assigned entrance exams.
     */
    public function index(Request $request)
    {
        $applicant = $request->user()->applicant;

        $assignments = ExamAssignment::with('entranceExam')
            ->where('applicant_id', $applicant->id)
            ->latest()
            ->get();

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

        if ($assignment->applicant_id !== $applicant->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access.',
            ], 403);
        }

        $assignment->load('entranceExam');

        return response()->json([
            'success' => true,
            'message' => 'Entrance exam assignment retrieved successfully.',
            'data' => $assignment,
        ]);
    }
}