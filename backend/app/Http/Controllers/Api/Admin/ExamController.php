<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\EntranceExam;
use Illuminate\Http\Request;

class ExamController extends Controller
{
    /**
     * Display a listing of entrance exams.
     */
    public function index()
    {
        $exams = EntranceExam::with('examAssignments.applicant.user')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Entrance exams retrieved successfully.',
            'data' => $exams,
        ]);
    }

    /**
     * Store a newly created entrance exam.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'exam_date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'venue' => 'required|string|max:255',
            'capacity' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
        ]);

        $exam = EntranceExam::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Entrance exam created successfully.',
            'data' => $exam,
        ], 201);
    }

    /**
     * Display the specified entrance exam.
     */
    public function show(EntranceExam $exam)
    {
        $exam->load('examAssignments.applicant.user');

        return response()->json([
            'success' => true,
            'message' => 'Entrance exam retrieved successfully.',
            'data' => $exam,
        ]);
    }

    /**
     * Update the specified entrance exam.
     */
    public function update(Request $request, EntranceExam $exam)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'exam_date' => 'sometimes|required|date',
            'start_time' => 'sometimes|required|date_format:H:i',
            'end_time' => 'sometimes|required|date_format:H:i',
            'venue' => 'sometimes|required|string|max:255',
            'capacity' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
        ]);

        $exam->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Entrance exam updated successfully.',
            'data' => $exam,
        ]);
    }

    /**
     * Remove the specified entrance exam.
     */
    public function destroy(EntranceExam $exam)
    {
        $exam->delete();

        return response()->json([
            'success' => true,
            'message' => 'Entrance exam deleted successfully.',
        ]);
    }
}