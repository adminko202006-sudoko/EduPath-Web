<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\EntranceExam;
use App\Services\EntranceExamAssignmentAvailability;
use App\Http\Controllers\Concerns\ValidatesEntranceExamTimes;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExamController extends Controller
{
    use ValidatesEntranceExamTimes;
    /**
     * Get entrance exams involving applicants
     * from the staff's assigned programs.
     */
    public function index(Request $request)
    {
        $staff = $this->getActiveStaff($request);

        $programIds = $staff->academicPrograms()
            ->pluck('academic_programs.id');

        $exams = EntranceExam::with($this->scopedExamRelations($programIds))
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

        $exams->each(fn ($exam) => $this->hideUnreleasedResults($exam));

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
        $programIds = $this->ensureAssignedExam(
            $request,
            $exam
        );

        $exam->load($this->scopedExamRelations($programIds));
        $this->hideUnreleasedResults($exam);

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
        return DB::transaction(function () use ($request, $exam) {
            $exam = EntranceExam::whereKey($exam->id)->lockForUpdate()->firstOrFail();
            $programIds = $this->ensureAssignedExam(
                $request,
                $exam
            );

            $validated = $request->validate([
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'exam_date' => 'sometimes|required|date',
                'start_time' => 'sometimes|required|date_format:H:i',
                'end_time' => 'sometimes|required|date_format:H:i',
                'venue' => 'sometimes|required|string|max:255',
                'capacity' => 'nullable|integer|min:1',
                'is_active' => 'sometimes|boolean',
            ]);

            $this->validateEntranceExamTimes($validated, $exam);
            app(EntranceExamAssignmentAvailability::class)->validateDateChange($exam, $validated);
            $exam->update($validated);

            $exam->load($this->scopedExamRelations($programIds));
            $this->hideUnreleasedResults($exam);

            // Do not reload the assignments here: reloading would discard the
            // per-assignment hidden score/remarks attributes applied above and
            // could expose unreleased results in this response.
            return response()->json([
                'success' => true,
                'message' => 'Entrance exam updated successfully.',
                'data' => $exam,
            ]);
        });
    }

    /**
     * Cancel/deactivate an entrance exam.
     */
    public function destroy(
        Request $request,
        EntranceExam $exam
    ) {
        $programIds = $this->ensureAssignedExam(
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


    /** Prevent staff responses from leaking results before official release. */
    private function hideUnreleasedResults(EntranceExam $exam): void
    {
        if (!$exam->results_released_at) {
            $exam->examAssignments->each(function ($assignment) {
                $assignment->makeHidden(['score', 'remarks']);
            });
        }
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

        return $programIds;
    }

    /** Scope both assignment rows and nested admissions to authorized programs. */
    private function scopedExamRelations($programIds): array
    {
        return ['examAssignments' => function ($assignments) use ($programIds) {
            $assignments->whereHas('applicant.admissionApplications', fn ($q) => $q->whereIn('academic_program_id', $programIds))
                ->with(['applicant.user', 'applicant.admissionApplications' => fn ($q) => $q->whereIn('academic_program_id', $programIds)->with('academicProgram')]);
        }];
    }
}
