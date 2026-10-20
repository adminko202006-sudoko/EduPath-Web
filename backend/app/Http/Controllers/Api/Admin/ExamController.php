<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\EntranceExam;
use App\Models\Applicant;
use App\Http\Controllers\Concerns\ValidatesEntranceExamTimes;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use App\Models\ExamAssignment;
use Illuminate\Http\Request;
use App\Services\EntranceExamRosterService;

class ExamController extends Controller
{
    use ValidatesEntranceExamTimes;
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
            'roster_pdf' => EntranceExamRosterService::uploadRules(),
        ]);

        unset($validated['roster_pdf']);
        $exam = DB::transaction(function () use ($request, $validated) {
            $exam = EntranceExam::create($validated);
            if ($request->hasFile('roster_pdf')) app(EntranceExamRosterService::class)->upload($exam, $request->file('roster_pdf'), $request->user());
            return $exam;
        });

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
        return DB::transaction(function () use ($request, $exam) {
            $exam = EntranceExam::whereKey($exam->id)->lockForUpdate()->firstOrFail();
            $validated = $request->validate([
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'exam_date' => 'sometimes|required|date',
                'start_time' => 'sometimes|required|date_format:H:i',
                'end_time' => 'sometimes|required|date_format:H:i',
                'venue' => 'sometimes|required|string|max:255',
                'capacity' => 'nullable|integer|min:1',
                'is_active' => 'boolean',
                'roster_pdf' => EntranceExamRosterService::uploadRules(),
            ]);

            unset($validated['roster_pdf']);
            $this->validateEntranceExamTimes($validated, $exam);
            $exam->update($validated);
            if ($request->hasFile('roster_pdf')) app(EntranceExamRosterService::class)->upload($exam, $request->file('roster_pdf'), $request->user());

            return response()->json([
                'success' => true,
                'message' => 'Entrance exam updated successfully.',
                'data' => $exam,
            ]);
        });
    }

    /**
     * Remove the specified entrance exam.
     */
    public function destroy(EntranceExam $exam)
    {
        return DB::transaction(function () use ($exam) {
            $exam = EntranceExam::whereKey($exam->id)->lockForUpdate()->firstOrFail();
            if ($exam->results_released_at || $exam->examAssignments()->exists()) {
                return response()->json(['success' => false, 'message' => 'This examination has applicant records or released results. Deactivate it to preserve its history.'], 409);
            }
            $exam->delete();

            return response()->json([
                'success' => true,
                'message' => 'Entrance exam deleted successfully.',
            ]);
        });
    }

    /** Paginated minimal applicant data for the Admin assignment picker. */
    public function candidates(Request $request, EntranceExam $exam)
    {
        $filters = $request->validate([
            'search' => 'nullable|string|max:150',
            'program_id' => 'nullable|integer|exists:academic_programs,id',
            'page' => 'nullable|integer|min:1',
        ]);
        $query = Applicant::query()->where('is_archived', false)
            ->whereHas('user', fn ($q) => $q->where('role', 'applicant'))
            ->whereDoesntHave('examAssignments', fn ($q) => $q->where('entrance_exam_id', $exam->id))
            ->select(['id', 'user_id', 'first_name', 'middle_name', 'last_name'])
            ->with(['user:id,name,email', 'admissionApplications' => fn ($q) => $q
                ->select(['id', 'applicant_id', 'academic_program_id'])
                ->with('academicProgram:id,name,code')]);
        if (!empty($filters['search'])) {
            $search = '%' . trim($filters['search']) . '%';
            $query->where(fn ($q) => $q->where('first_name', 'like', $search)
                ->orWhere('middle_name', 'like', $search)->orWhere('last_name', 'like', $search)
                ->orWhereHas('user', fn ($user) => $user->where('name', 'like', $search)->orWhere('email', 'like', $search)));
        }
        if (!empty($filters['program_id'])) {
            $query->whereHas('admissionApplications', fn ($q) => $q->where('academic_program_id', $filters['program_id']));
        }
        return response()->json($query->orderBy('last_name')->orderBy('id')->paginate(20));
    }

    /** Add assignments without resetting existing attendance, grades or remarks. */
    public function assignApplicants(Request $request, EntranceExam $exam)
    {
        $validated = $request->validate([
            'applicant_ids' => 'required|array|min:1|max:100',
            'applicant_ids.*' => 'required|integer|distinct|exists:applicants,id',
        ]);
        return DB::transaction(function () use ($exam, $validated) {
            $exam = EntranceExam::whereKey($exam->id)->lockForUpdate()->firstOrFail();
            if (!$exam->is_active || $exam->results_released_at) {
                return response()->json(['success' => false, 'message' => 'Applicants can only be assigned to an active examination before official result release.'], 409);
            }
            $ids = $validated['applicant_ids'];
            $applicants = Applicant::whereIn('id', $ids)->where('is_archived', false)
                ->whereHas('user', fn ($q) => $q->where('role', 'applicant'))
                ->orderBy('id')->lockForUpdate()->get();
            if ($applicants->count() !== count($ids)) {
                throw ValidationException::withMessages(['applicant_ids' => 'Select current, non-archived applicant accounts.']);
            }
            $added = 0;
            foreach ($applicants as $applicant) {
                $assignment = ExamAssignment::firstOrCreate([
                    'entrance_exam_id' => $exam->id, 'applicant_id' => $applicant->id,
                ], ['status' => 'scheduled']);
                if ($assignment->wasRecentlyCreated) $added++;
            }
            return response()->json([
                'success' => true,
                'message' => $added ? "Assigned {$added} applicant(s) successfully." : 'These applicants are already assigned. Their records were preserved.',
                'assigned_count' => $added,
                'already_assigned_count' => count($ids) - $added,
                'data' => $exam->load('examAssignments.applicant.user'),
            ], $added ? 201 : 200);
        });
    }

    /** Update the score, attendance status, and remarks for an assigned applicant. */
    public function updateAssignment(
        Request $request,
        EntranceExam $exam,
        ExamAssignment $assignment
    ) {
        return DB::transaction(function () use ($request, $exam, $assignment) {
            $exam = EntranceExam::whereKey($exam->id)->lockForUpdate()->firstOrFail();
            if ((int) $assignment->entrance_exam_id !== (int) $exam->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'This applicant assignment does not belong to the selected exam.',
                ], 404);
            }

            $assignment = ExamAssignment::whereKey($assignment->id)->where('entrance_exam_id', $exam->id)->lockForUpdate()->firstOrFail();
            if ($exam->results_released_at) {
                return response()->json([
                    'success' => false,
                    'message' => 'Results have already been officially released and can no longer be edited.',
                ], 409);
            }

            $validated = $request->validate([
                'status' => 'sometimes|required|in:scheduled,completed,absent',
                'score' => 'sometimes|nullable|numeric|min:0|max:'.EntranceExam::MAXIMUM_SCORE,
                'remarks' => 'sometimes|nullable|string|max:5000',
            ]);

            $assignment->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Applicant exam result updated successfully.',
                'data' => $assignment->fresh()->load('applicant.user'),
            ]);
        });
    }

    /** Release results once, after all assigned applicants have a final status. */
    public function releaseResults(EntranceExam $exam)
    {
        return DB::transaction(function () use ($exam) {
            $exam = EntranceExam::whereKey($exam->id)->lockForUpdate()->firstOrFail();
            if ($exam->results_released_at) {
                return response()->json([
                    'success' => true,
                    'message' => 'Results for this exam have already been released.',
                    'data' => [
                        'exam_id' => $exam->id,
                        'results_released_at' => $exam->results_released_at,
                    ],
                ]);
            }

            if (!$exam->examAssignments()->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Results cannot be released because no applicants are assigned to this exam.',
                ], 422);
            }

            $hasUnfinalizedAssignments = $exam->examAssignments()
                ->where('status', 'scheduled')
                ->exists();

            if ($hasUnfinalizedAssignments) {
                return response()->json([
                    'success' => false,
                    'message' => 'Complete or mark absent every assigned applicant before releasing results.',
                ], 422);
            }

            $hasMissingScores = $exam->examAssignments()
                ->where('status', 'completed')
                ->whereNull('score')
                ->exists();

            if ($hasMissingScores) {
                return response()->json([
                    'success' => false,
                    'message' => 'Enter a score for every completed applicant before releasing results.',
                ], 422);
            }

            if ($exam->examAssignments()->whereNotNull('score')->where(fn ($query) => $query->where('score', '<', 0)->orWhere('score', '>', EntranceExam::MAXIMUM_SCORE))->exists()) {
                return response()->json(['success' => false, 'message' => 'Scores must be between 0 and 100 before official release. Review the recorded scores.'], 422);
            }

            $exam->update(['results_released_at' => now()]);
            foreach($exam->examAssignments()->with('applicant')->get() as $assignment) {
                if($assignment->applicant)app(\App\Services\ApplicantNotificationService::class)->create($assignment->applicant->user_id,'Entrance examination results released','Official results for your scheduled entrance examination are available. Open Entrance Exams to review your result.','exam');
            }
            app(\App\Services\WorkflowDecisionService::class)->event('scheduled_exam',$exam->id,'result_released',null,'released',null,request()->user());
            $exam->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Entrance exam results released successfully.',
                'data' => [
                    'exam_id' => $exam->id,
                    'results_released_at' => $exam->results_released_at,
                ],
            ]);
        });
    }
}
