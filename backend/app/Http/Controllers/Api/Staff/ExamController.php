<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\EntranceExam;
use Illuminate\Http\Request;

class ExamController extends Controller
{
    /**
     * Get entrance exams involving applicants
     * from the staff's assigned programs.
     */
    public function index(Request $request)
    {
        $staff = $this->getActiveStaff($request);

        $programIds = $staff->academicPrograms()
            ->pluck('academic_programs.id');

        $exams = EntranceExam::with([
            'examAssignments.applicant.user',
            'examAssignments.applicant.admissionApplications.academicProgram',
        ])
            ->whereHas(
                'examAssignments.applicant.admissionApplications',
                function ($query) use ($programIds) {
                    $query->whereIn(
                        'academic_program_id',
                        $programIds
                    );
                }
            )
            ->latest('exam_date')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Entrance exams retrieved successfully.',
            'data' => $exams,
        ]);
    }

    /**
     * View a specific entrance exam.
     */
    public function show(
        Request $request,
        EntranceExam $exam
    ) {
        $this->ensureAssignedExam(
            $request,
            $exam
        );

        $exam->load([
            'examAssignments.applicant.user',
            'examAssignments.applicant.admissionApplications.academicProgram',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Entrance exam retrieved successfully.',
            'data' => $exam,
        ]);
    }

    /**
     * Update an entrance exam schedule.
     */
    public function update(
        Request $request,
        EntranceExam $exam
    ) {
        $this->ensureAssignedExam(
            $request,
            $exam
        );

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'exam_date' => 'sometimes|required|date',
            'start_time' => 'sometimes|required|date_format:H:i',
            'end_time' => 'sometimes|required|date_format:H:i|after:start_time',
            'venue' => 'sometimes|required|string|max:255',
            'capacity' => 'nullable|integer|min:1',
            'is_active' => 'sometimes|boolean',
        ]);

        $exam->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Entrance exam updated successfully.',
            'data' => $exam->load([
                'examAssignments.applicant.user',
                'examAssignments.applicant.admissionApplications.academicProgram',
            ]),
        ]);
    }

    /**
     * Cancel/deactivate an entrance exam.
     */
    public function destroy(
        Request $request,
        EntranceExam $exam
    ) {
        $this->ensureAssignedExam(
            $request,
            $exam
        );

        $exam->update([
            'is_active' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Entrance exam cancelled successfully.',
        ]);
    }

    /**
     * Get the active staff profile.
     */
    private function getActiveStaff(Request $request)
    {
        $staff = $request->user()->staff;

        if (!$staff) {
            abort(response()->json([
                'success' => false,
                'message' => 'Staff profile not found.',
            ], 403));
        }

        if ($staff->status !== 'active') {
            abort(response()->json([
                'success' => false,
                'message' => 'Your staff account is inactive.',
            ], 403));
        }

        return $staff;
    }

    /**
     * Ensure the exam has applicants belonging
     * to one of the staff's assigned programs.
     */
    private function ensureAssignedExam(
        Request $request,
        EntranceExam $exam
    ) {
        $staff = $this->getActiveStaff($request);

        $programIds = $staff->academicPrograms()
            ->pluck('academic_programs.id');

        $belongsToAssignedProgram = $exam
            ->examAssignments()
            ->whereHas(
                'applicant.admissionApplications',
                function ($query) use ($programIds) {
                    $query->whereIn(
                        'academic_program_id',
                        $programIds
                    );
                }
            )
            ->exists();

        if (!$belongsToAssignedProgram) {
            abort(response()->json([
                'success' => false,
                'message' =>
                    'You are not authorized to access this exam.',
            ], 403));
        }
    }
}