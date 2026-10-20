<?php

namespace App\Http\Controllers\Api\Applicant;

use App\Http\Controllers\Controller;
use App\Models\OnlineExamAnswer;
use App\Models\OnlineExamAttempt;
use App\Models\OnlineExamOption;
use App\Models\OnlineExamQuestion;
use App\Models\OnlineExamRetakeGrant;
use App\Models\OnlineExamSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Applicant-facing Online Examination API.
 *
 * Contract: ONLINE_EXAM_API_CONTRACT.md in the EduPath-Mobile project.
 *
 * Server-side rules enforced here:
 * - an approved admission application is required before starting;
 * - one attempt by default, extra attempts only via retake grants;
 * - the server owns the clock (started_at / expires_at per question window);
 * - the answer key never leaves this process;
 * - scores stay hidden until results_released_at is set by an administrator.
 */
class OnlineExamController extends Controller
{
    /** Default timing is 60 seconds; new attempts snapshot the administrator's configured limit. */
    public const REQUIRED_QUESTION_COUNT = 100;
    public const DEFAULT_SECONDS_PER_QUESTION = 60;
    public const DEFAULT_PASSING_SCORE = 50;
    public const SCHOLARSHIP_APPROVAL_CODE = 'ONLINE_EXAM_SCHOLARSHIP_APPROVAL_REQUIRED';
    public const SCHOLARSHIP_APPROVAL_MESSAGE = 'You cannot start or resume the online examination because your scholarship application is not currently approved for an eligible online-exam scholarship. If its status was changed to pending or under review, please wait for administrator approval or contact the college.';

    /**
     * GET /applicant/online-exam
     */
    public function index(Request $request)
    {
        $applicant = $request->user()->applicant;

        if (!$applicant) {
            return response()->json([
                'success' => false,
                'message' => 'Applicant profile not found.',
            ], 403);
        }

        $questionsCount = $this->activeQuestionCount();
        $attemptsAllowed = $this->attemptsAllowed($applicant->id);
        $attempts = OnlineExamAttempt::where('applicant_id', $applicant->id)
            ->withCount(['answers as answered_count' => fn ($q) => $q->whereNotNull('online_exam_option_id')])
            ->latest()
            ->get();

        $attemptsUsed = $attempts->count();
        $availableAttempts = max(0, $attemptsAllowed - $attemptsUsed);
        $active = $attempts->firstWhere('status', 'in_progress');


if ($active !== null) {
    $this->syncIndexFromClock($active);
    $this->expireIfNeeded($active);

    // Reload attempts and recalculate the active attempt.
    $attempts = OnlineExamAttempt::where('applicant_id', $applicant->id)
        ->withCount(['answers as answered_count' => fn ($q) => $q->whereNotNull('online_exam_option_id')])
        ->latest()
        ->get();

    $attemptsUsed = $attempts->count();
    $availableAttempts = max(0, $attemptsAllowed - $attemptsUsed);
    $active = $attempts->firstWhere('status', 'in_progress');
}


        $approvedApplication = $this->hasApprovedAdmissionApplication(
            $applicant->id
        );

        $reason = null;
        if ($active === null && $questionsCount < self::REQUIRED_QUESTION_COUNT) {
            $reason = 'The online examination is not available yet. The college must publish at least 100 active questions before applicants can begin.';
        } elseif (!$approvedApplication) {
            $reason = 'Your admission application must be approved before you can take the online examination.';
        } elseif (!$this->hasOtherScholarshipApplication($applicant->id)) {
            $reason = self::SCHOLARSHIP_APPROVAL_MESSAGE;
        } elseif ($active === null && $availableAttempts < 1) {
            $reason = 'You have already used all of your allowed attempts. A retake must be approved by the college before you can take the examination again.';
        }

        $eligible = $reason === null;

        return response()->json([
            'success' => true,
            'message' => 'Examination eligibility retrieved.',
            'data' => [
                'eligible' => $eligible,
                'reason' => $reason,
                'instructions' => $this->instructions(),
                'question_count' => self::REQUIRED_QUESTION_COUNT,
                'question_bank_count' => $questionsCount,
                'seconds_per_question' => $active?->seconds_per_question ?? OnlineExamSetting::secondsPerQuestion(),
                'attempts_allowed' => $attemptsAllowed,
                'attempts_used' => $attemptsUsed,
                'available_attempts' => $availableAttempts,
                'status' => $active !== null
                    ? 'in_progress'
                    : ($attemptsUsed > 0 ? 'completed' : 'not_started'),
                'active_attempt_id' => $active?->id,
                'results_released' => $attempts->contains(
                    fn ($attempt) => $attempt->results_released_at !== null
                ),
                'attempts' => $attempts->map(
                    fn ($attempt) => $this->attemptSummary($attempt)
                )->values(),
            ],
        ]);
    }

    /**
     * POST /applicant/online-exam/start
     */

public function start(Request $request)
{
    $applicant = $request->user()->applicant;

    if (!$applicant) {
        return response()->json([
            'success' => false,
            'message' => 'Applicant profile not found.',
        ], 403);
    }

    $result = DB::transaction(function () use ($applicant) {
        // Serialize exam-start requests for this applicant.
        $lockedApplicant = DB::table('applicants')
            ->where('id', $applicant->id)
            ->lockForUpdate()
            ->first();

        if (!$lockedApplicant) {
            return [
                'status' => 403,
                'body' => [
                    'success' => false,
                    'message' => 'Applicant profile not found.',
                ],
            ];
        }

        // Recheck active attempts while holding the applicant lock.
        $active = OnlineExamAttempt::where(
            'applicant_id',
            $applicant->id
        )
            ->where('status', 'in_progress')
            ->latest()
            ->lockForUpdate()
            ->first();

        if ($active) {
            if ($denied = $this->scholarshipAccessDenied($applicant->id)) {
                return ['status' => 403, 'body' => $denied->getData(true)];
            }
            $this->expireIfNeeded($active);

            if ($active->status === 'in_progress') {
                return [
                    'status' => 409,
                    'body' => [
                        'success' => false,
                        'message' => 'You already have an attempt in progress.',
                        'data' => $this->attemptPayload($active),
                    ],
                ];
            }
        }

        // Verify the active question bank.
        if ($this->activeQuestionCount() < self::REQUIRED_QUESTION_COUNT) {
            return [
                'status' => 422,
                'body' => [
                    'success' => false,
                    'message' => 'At least 100 active questions must be available before an examination can start.',
                ],
            ];
        }

        // Preserve the existing admission eligibility rule.
        if (!$this->hasApprovedAdmissionApplication($applicant->id)) {
            return [
                'status' => 403,
                'body' => [
                    'success' => false,
                    'message' => 'Your admission application must be approved before you can take the online examination.',
                ],
            ];
        }

        // Preserve the existing Other Scholarship eligibility rule.
        if (!$this->hasOtherScholarshipApplication($applicant->id)) {
            return [
                'status' => 403,
                'body' => [
                    'success' => false,
                    'message' => self::SCHOLARSHIP_APPROVAL_MESSAGE,
                    'code' => self::SCHOLARSHIP_APPROVAL_CODE,
                ],
            ];
        }

        // Recheck attempt usage and authorized retake grants under the lock.
        $used = OnlineExamAttempt::where(
            'applicant_id',
            $applicant->id
        )->count();

        if ($used >= $this->attemptsAllowed($applicant->id)) {
            return [
                'status' => 403,
                'body' => [
                    'success' => false,
                    'message' => 'You have already used all of your allowed attempts.',
                ],
            ];
        }

        // Select exactly 100 random active questions.
        $questionIds = OnlineExamQuestion::eligible()
            ->inRandomOrder()
            ->limit(self::REQUIRED_QUESTION_COUNT)
            ->lockForUpdate()
            ->pluck('id')
            ->values();

        if ($questionIds->count() !== self::REQUIRED_QUESTION_COUNT) {
            return [
                'status' => 422,
                'body' => [
                    'success' => false,
                    'message' => 'The question bank changed while the attempt was being created. Please try again.',
                ],
            ];
        }

        $now = now();
        $secondsPerQuestion = OnlineExamSetting::secondsPerQuestion();

        $attempt = OnlineExamAttempt::create([
            'applicant_id' => $applicant->id,
            'status' => 'in_progress',
            'question_count' => self::REQUIRED_QUESTION_COUNT,
            'seconds_per_question' => $secondsPerQuestion,
            'started_at' => $now,
            'expires_at' => $now->copy()->addSeconds(
                self::REQUIRED_QUESTION_COUNT
                    * $secondsPerQuestion
            ),
            'current_question_index' => 0,
            'navigation_mode' => 2,
            'viewed_question_index' => 0,
            'navigation_revision' => 0,
        ]);

        $assignmentRows = $questionIds
            ->values()
            ->map(fn ($questionId, $position) => [
                'online_exam_attempt_id' => $attempt->id,
                'online_exam_question_id' => $questionId,
                'position' => $position + 1,
                'created_at' => $now,
                'updated_at' => $now,
            ])
            ->all();

        DB::table('online_exam_attempt_questions')
            ->insert($assignmentRows);

        return [
            'status' => 201,
            'body' => [
                'success' => true,
                'message' => 'Attempt started.',
                'data' => $this->attemptPayload($attempt),
            ],
        ];
    }, 3);

    return response()->json(
        $result['body'],
        $result['status']
    );
}


    /**
     * GET /applicant/online-exam/attempt
     */
    public function activeAttempt(Request $request)
    {
        $attempt = $this->activeAttemptFor($request);

        if (!$attempt) {
            return response()->json([
                'success' => false,
                'message' => 'No active attempt.',
            ], 404);
        }

        if ($denied = $this->scholarshipAccessDenied($attempt->applicant_id)) {
            return $denied;
        }
        $this->syncIndexFromClock($attempt);
        $this->expireIfNeeded($attempt);

        return response()->json([
            'success' => true,
            'message' => 'Active attempt retrieved.',
            'data' => $this->attemptPayload($attempt),
        ]);
    }

    /**
     * GET /applicant/online-exam/attempts/{attempt}
     */
    public function attempt(Request $request, OnlineExamAttempt $attempt)
    {
        if (!$this->owns($request, $attempt)) {
            return $this->unauthorized();
        }

    if ($attempt->status === 'in_progress' && ($denied = $this->scholarshipAccessDenied($attempt->applicant_id))) {
        return $denied;
    }

        $this->syncIndexFromClock($attempt);
        $this->expireIfNeeded($attempt);

        return response()->json([
            'success' => true,
            'message' => 'Attempt retrieved.',
            'data' => $this->attemptPayload($attempt),
        ]);
    }

/**
 * GET /applicant/online-exam/attempts/{attempt}/questions
 *
 * Returns only the question currently authorized by the server.
 * Correct-answer information is never included in this response.
 */
public function questions(Request $request, OnlineExamAttempt $attempt)
{
    if (!$this->owns($request, $attempt)) {
        return $this->unauthorized();
    }
    if ($attempt->status === 'in_progress' && ($denied = $this->scholarshipAccessDenied($attempt->applicant_id))) {
        return $denied;
    }

    // Synchronize the question index with the server's official clock.
    $this->syncIndexFromClock($attempt);
    $this->expireIfNeeded($attempt);
    $attempt->refresh();

    if ($attempt->status !== 'in_progress') {
        return response()->json([
            'success' => false,
            'message' => 'This examination is no longer in progress.',
        ], 422);
    }

    $currentIndex = max(
        0,
        app(\App\Services\OnlineExamNavigationService::class)->viewedIndex($attempt)
    );

    // Assignment positions are one-based; the attempt index is zero-based.
    $assignment = DB::table('online_exam_attempt_questions')
        ->where('online_exam_attempt_id', $attempt->id)
        ->where('position', $currentIndex + 1)
        ->first();

    if (!$assignment) {
        return response()->json([
            'success' => false,
            'message' => 'The current question assignment could not be found. Please contact the college examination administrator.',
        ], 422);
    }

    $question = OnlineExamQuestion::query()
        ->whereKey($assignment->online_exam_question_id)
        ->with([
            'options' => function ($query) {
                // Never expose is_correct to an applicant.
                $query->select(
                    'id',
                    'online_exam_question_id',
                    'text',
                    'position'
                )->orderBy('position');
            },
        ])
        ->first();

    if (!$question) {
        return response()->json([
            'success' => false,
            'message' => 'The assigned question could not be found. Please contact the college examination administrator.',
        ], 422);
    }

    $selectedOptionId = DB::table('online_exam_answers')
        ->where('online_exam_attempt_id', $attempt->id)
        ->where('online_exam_question_id', $question->id)
        ->value('online_exam_option_id');

    $payload = [[
        'id' => $question->id,
        'question_number' => $currentIndex + 1,
        'question' => $question->question,
        'options' => $question->options->values(),
        'selected_option_id' => $selectedOptionId,
    ]];

    return response()->json([
        'success' => true,
        'message' => 'Current question retrieved.',
        'data' => [
            'attempt' => $this->attemptPayload($attempt),
            'questions' => $payload,
        ],
    ]);
}

    public function navigate(Request $request, OnlineExamAttempt $attempt)
    {
        if (!$this->owns($request, $attempt)) return $this->unauthorized();
        $values = $request->validate([
            'direction' => 'required|in:next,previous',
            'question_id' => 'required|integer',
            'expected_revision' => 'required|integer|min:0',
        ]);
        return DB::transaction(function () use ($request, $attempt, $values) {
            $locked = OnlineExamAttempt::whereKey($attempt->id)->lockForUpdate()->firstOrFail();
            if (!$this->owns($request, $locked)) return $this->unauthorized();
            if ($denied = $this->scholarshipAccessDenied($locked->applicant_id)) return $denied;
            if (!$this->hasApprovedAdmissionApplication($locked->applicant_id)) {
                return response()->json(['success' => false, 'message' => 'An approved admission is required to access this examination.'], 403);
            }
            $navigation = app(\App\Services\OnlineExamNavigationService::class);
            if (!$navigation->enabled($locked)) return response()->json(['success' => false, 'message' => 'This attempt retains its original fixed-question timing rules.'], 422);
            $navigation->synchronize($locked);
            $this->expireIfNeeded($locked);
            if ($locked->status !== 'in_progress') return response()->json(['success' => false, 'message' => 'This attempt is already finished.'], 422);
            if ((int) $values['expected_revision'] !== (int) $locked->navigation_revision) {
                return response()->json(['success' => false, 'code' => 'EXAM_POSITION_CHANGED', 'message' => 'The examination position changed. Reload the current question.'], 409);
            }
            $active = (int) $locked->current_question_index;
            $view = (int) $locked->viewed_question_index;
            $questionId = DB::table('online_exam_attempt_questions')->where('online_exam_attempt_id', $locked->id)->where('position', $view + 1)->value('online_exam_question_id');
            if ((int) $questionId !== (int) $values['question_id']) return response()->json(['success' => false, 'message' => 'Only the displayed question can be navigated.'], 409);
            if ($values['direction'] === 'previous') {
                if ($view < 1 || $navigation->remaining($locked) <= $navigation::REVIEW_CUTOFF) {
                    return response()->json(['success' => false, 'message' => 'Previous is available only while more than 25 seconds remain on the active question.'], 422);
                }
                $view--;
            } elseif ($view < $active) {
                $view++;
            } else {
                if ($active >= $locked->question_count - 1) return response()->json(['success' => false, 'message' => 'This is the final question. Submit the examination when finished.'], 422);
                if (!$locked->answers()->where('online_exam_question_id', $questionId)->exists()) {
                    return response()->json(['success' => false, 'message' => 'Save an answer before moving to the next question.'], 422);
                }
                // The next deadline is start + (new active index + 1) * base time.
                // Thus unused time carries forward once, without extending expires_at.
                $active++;
                $view = $active;
            }
            $locked->update(['current_question_index' => $active, 'viewed_question_index' => $view, 'navigation_revision' => $locked->navigation_revision + 1]);
            return $this->questions($request, $locked);
        }, 3);
    }

    /**
     * POST /applicant/online-exam/attempts/{attempt}/answers
     */
public function saveAnswer(Request $request, OnlineExamAttempt $attempt)
{
    if (!$this->owns($request, $attempt)) {
        return $this->unauthorized();
    }
    if ($attempt->status === 'in_progress' && ($denied = $this->scholarshipAccessDenied($attempt->applicant_id))) {
        return $denied;
    }

    $validated = $request->validate([
        'question_id' => 'required|integer|exists:online_exam_questions,id',
        'option_id' => 'required|integer|exists:online_exam_options,id',
        'expected_revision' => 'sometimes|integer|min:0',
    ]);

    return DB::transaction(function () use ($request, $attempt, $validated) {
        $lockedAttempt = OnlineExamAttempt::whereKey($attempt->id)
            ->lockForUpdate()
            ->first();

        if (
            !$lockedAttempt ||
            (int) $lockedAttempt->applicant_id !==
                (int) $request->user()->applicant?->id
        ) {
            return $this->unauthorized();
        }

        if ($lockedAttempt->status !== 'in_progress') {
            return response()->json([
                'success' => false,
                'message' => 'This attempt is already finished.',
            ], 422);
        }

        if ($denied = $this->scholarshipAccessDenied($lockedAttempt->applicant_id)) {
            return $denied;
        }
        $navigation = app(\App\Services\OnlineExamNavigationService::class);
        $navigation->synchronize($lockedAttempt);
        $now = now();

        if (
            !$lockedAttempt->started_at ||
            ($lockedAttempt->expires_at &&
                $now->greaterThanOrEqualTo($lockedAttempt->expires_at)) ||
            $now->diffInSeconds($lockedAttempt->started_at, true) >=
                $lockedAttempt->question_count *
                max(1, $lockedAttempt->seconds_per_question)
        ) {

            if (!$this->score($lockedAttempt)) {
                return response()->json([
                    'success' => false,
                    'message' => 'This attempt cannot be finalized because it does not have exactly 100 assigned questions and a valid score. Please contact the college administrator.',
                ], 422);
            }

            $lockedAttempt->update([
                'status' => 'expired',
                'completed_at' => $now,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'The examination time has expired.',
            ], 422);

        }
	$assignedCount = DB::table('online_exam_attempt_questions')
    ->where('online_exam_attempt_id', $lockedAttempt->id)
    ->count();

if (
    (int) $lockedAttempt->question_count !== self::REQUIRED_QUESTION_COUNT ||
    $assignedCount !== self::REQUIRED_QUESTION_COUNT
) {
    return response()->json([
        'success' => false,
        'message' => 'This attempt does not have exactly 100 assigned questions. Please contact the college examination administrator.',
    ], 422);
}

        $questions = DB::table('online_exam_attempt_questions')
            ->where('online_exam_attempt_id', $lockedAttempt->id)
            ->orderBy('position')
            ->pluck('online_exam_question_id')
            ->values();

        if ($questions->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'This attempt has no assigned questions. Please contact the college examination administrator.',
            ], 422);
        }

        $questionId = (int) $validated['question_id'];

        $position = $questions->search(
            fn ($id) => (int) $id === $questionId
        );

        if ($position === false) {
            return response()->json([
                'success' => false,
                'message' => 'That question is not part of this attempt.',
            ], 422);
        }

        $optionExists = OnlineExamOption::where(
            'id',
            $validated['option_id']
        )
            ->where('online_exam_question_id', $questionId)
            ->exists();

        if (!$optionExists) {
            return response()->json([
                'success' => false,
                'message' => 'That answer option does not belong to the question.',
            ], 422);
        }

        $seconds = max(1, $lockedAttempt->seconds_per_question);

        $elapsed = $now->diffInSeconds(
            $lockedAttempt->started_at,
            true
        );

        $current = $navigation->enabled($lockedAttempt) ? $navigation->viewedIndex($lockedAttempt) : min(
            (int) floor($elapsed / $seconds),
            max(0, $lockedAttempt->question_count - 1)
        );

if ((int) $position !== $current) {
    return response()->json([
        'success' => false,
        'message' => (int) $position > $current
            ? 'This question 	has not been opened yet.'
            : 'The time for this question has passed. Answers can no longer be changed.',
    ], 422);
}

        if ($navigation->enabled($lockedAttempt) && (!array_key_exists('expected_revision', $validated) || (int) $validated['expected_revision'] !== (int) $lockedAttempt->navigation_revision)) {
            return response()->json(['success' => false, 'message' => 'The examination position changed. Refresh the current question before answering.', 'code' => 'EXAM_POSITION_CHANGED'], 409);
        }

        if (!$navigation->enabled($lockedAttempt) && $elapsed >= ($position + 1) * $seconds) {
            return response()->json([
                'success' => false,
                'message' => 'The time for this question has passed. Answers can no longer be changed.',
            ], 422);
        }

        OnlineExamAnswer::updateOrCreate(
            [
                'online_exam_attempt_id' => $lockedAttempt->id,
                'online_exam_question_id' => $questionId,
            ],
            [
                'online_exam_option_id' => (int) $validated['option_id'],
                'answered_at' => $now,
            ]
        );

        if ((int) $position >= (int) $lockedAttempt->current_question_index) {
            $lockedAttempt->update([
                'current_question_index' => (int) $position,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Answer saved.',
            'data' => [
                'question_id' => $questionId,
                'option_id' => (int) $validated['option_id'],
                'answered_count' => $lockedAttempt->answers()->count(),
                'attempt' => $this->attemptPayload($lockedAttempt),
            ],
        ]);
    }, 3);
}


    /**
     * POST /applicant/online-exam/attempts/{attempt}/submit
     */


public function submit(Request $request, int $attemptId)
{
    $applicant = $request->user()->applicant;

    if (!$applicant) {
        return response()->json([
            'success' => false,
            'message' => 'Applicant profile not found.',
        ], 403);
    }

    $attempt = OnlineExamAttempt::whereKey($attemptId)
        ->where('applicant_id', $applicant->id)
        ->firstOrFail();

    return DB::transaction(function () use ($attempt, $applicant) {
        $lockedAttempt = OnlineExamAttempt::whereKey($attempt->id)
            ->where('applicant_id', $applicant->id)
            ->lockForUpdate()
            ->firstOrFail();

        if ($lockedAttempt->status !== 'in_progress') {
            return response()->json([
                'success' => false,
                'message' => 'This attempt has already been submitted or is no longer active.',
            ], 422);
        }

        if ($denied = $this->scholarshipAccessDenied($lockedAttempt->applicant_id)) {
            return $denied;
        }
        $now = now();

        $expired = !$lockedAttempt->started_at ||
            ($lockedAttempt->expires_at &&
                $now->greaterThanOrEqualTo($lockedAttempt->expires_at)) ||
            $now->diffInSeconds(
                $lockedAttempt->started_at,
                true
            ) >= $lockedAttempt->question_count *
                max(1, $lockedAttempt->seconds_per_question);

        if (!$this->score($lockedAttempt)) {
            return response()->json([
                'success' => false,
                'message' => 'This attempt cannot be finalized because it does not have exactly 100 assigned questions and a valid score. Please contact the college administrator.',
            ], 422);
        }

        $lockedAttempt->update([
            'status' => $expired ? 'expired' : 'completed',
            'completed_at' => $now,
        ]);

        $lockedAttempt->refresh();

        return response()->json([
            'success' => true,
            'message' => $expired
                ? 'The examination time expired. Your attempt was automatically scored.'
                : 'Attempt submitted.',
            'data' => $this->attemptPayload($lockedAttempt),
        ]);
    }, 3);
}

    /**
     * GET /applicant/online-exam/attempts/{attempt}/result
     */
    public function result(Request $request, OnlineExamAttempt $attempt)
    {
        if (!$this->owns($request, $attempt)) {
            return $this->unauthorized();
        }

        $this->expireIfNeeded($attempt);

        if ($attempt->status === 'in_progress') {
            return response()->json([
                'success' => false,
                'message' => 'This attempt has not been submitted yet.',
            ], 404);
        }

        if (!$attempt->results_released_at) {
            return response()->json([
                'success' => true,
                'message' => 'Results are not released yet.',
                'data' => [
                    'released' => false,
                    'results_released_at' => null,
                    'score' => null,
                    'remarks' => null,
                    'passed' => null,
                    'status' => $attempt->status,
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Result retrieved.',
            'data' => [
                'released' => true,
                'results_released_at' => $attempt->results_released_at->toIso8601String(),
                'score' => $attempt->score,
                'remarks' => $attempt->remarks,
                'passed' => $attempt->passed,
                'status' => $attempt->status,
                ...$this->releasedResultDetails($attempt),
            ],
        ]);
    }

    /*
    |----------------------------------------------------------------------
    | Helpers
    |----------------------------------------------------------------------
    */

    private function owns(Request $request, OnlineExamAttempt $attempt): bool
    {
        $applicant = $request->user()->applicant;

        return $applicant !== null &&
            (int) $attempt->applicant_id === (int) $applicant->id;
    }

    private function unauthorized()
    {
        return response()->json([
            'success' => false,
            'message' => 'Unauthorized access.',
        ], 403);
    }

    private function activeAttemptFor(Request $request): ?OnlineExamAttempt
    {
        $applicant = $request->user()->applicant;

        if (!$applicant) {
            return null;
        }

        return OnlineExamAttempt::where('applicant_id', $applicant->id)
            ->where('status', 'in_progress')
            ->latest()
            ->first();
    }

    private function activeQuestionCount(): int
    {
        return OnlineExamQuestion::eligible()->count();
    }

    private function attemptsAllowed(int $applicantId): int
    {
        return 1 + OnlineExamRetakeGrant::where(
            'applicant_id',
            $applicantId
        )->count();
    }

    private function hasApprovedAdmissionApplication(int $applicantId): bool
    {
        return DB::table('admission_applications')
            ->where('applicant_id', $applicantId)
            ->where('status', 'approved')
            ->exists();
    }

    private function scholarshipAccessDenied(int $applicantId)
    {
        if ($this->hasOtherScholarshipApplication($applicantId)) return null;
        return response()->json([
            'success' => false,
            'code' => self::SCHOLARSHIP_APPROVAL_CODE,
            'message' => self::SCHOLARSHIP_APPROVAL_MESSAGE,
        ], 403);
    }

private function hasOtherScholarshipApplication(int $applicantId): bool
{
    $query = DB::table('scholarship_applications')
        ->join(
            'scholarships',
            'scholarship_applications.scholarship_id',
            '=',
            'scholarships.id'
        )
        ->where('scholarship_applications.applicant_id', $applicantId)
        ->where('scholarship_applications.status', 'approved')
        ->where('scholarships.category', 'other')
        ->where('scholarships.is_active', true)
        ->where('scholarships.requires_online_exam', true);
    if (DB::transactionLevel() > 0) $query->sharedLock();
    return $query->first(['scholarship_applications.id']) !== null;
}

    /** Keeps current_question_index aligned with the server clock. */
   /** Keeps current_question_index aligned with the server clock. */
private function syncIndexFromClock(OnlineExamAttempt $attempt): void
{
    DB::transaction(function () use ($attempt) {
        $lockedAttempt = OnlineExamAttempt::whereKey($attempt->id)
            ->lockForUpdate()
            ->first();

        if (
            !$lockedAttempt ||
            $lockedAttempt->status !== 'in_progress' ||
            !$lockedAttempt->started_at ||
            $lockedAttempt->question_count < 1
        ) {
            if ($lockedAttempt) {
                $attempt->refresh();
            }

            return;
        }

        $navigation = app(\App\Services\OnlineExamNavigationService::class);
        if ($navigation->enabled($lockedAttempt)) {
            $navigation->synchronize($lockedAttempt);
            $attempt->refresh();
            return;
        }

        $seconds = max(1, $lockedAttempt->seconds_per_question);
        $elapsed = now()->diffInSeconds(
            $lockedAttempt->started_at,
            true
        );

        $index = min(
            (int) floor($elapsed / $seconds),
            max(0, $lockedAttempt->question_count - 1)
        );

        if ((int) $lockedAttempt->current_question_index !== $index) {
            $lockedAttempt->update([
                'current_question_index' => $index,
            ]);
        }

        $attempt->refresh();
    }, 3);
}

    /** Marks the attempt expired and scores it once the window has passed. */
/** Marks an attempt expired and scores it once the window has passed. */

private function expireIfNeeded(OnlineExamAttempt $attempt): void
{
    DB::transaction(function () use ($attempt) {
        $lockedAttempt = OnlineExamAttempt::whereKey($attempt->id)
            ->lockForUpdate()
            ->first();

        if (!$lockedAttempt) {
            return;
        }

        if ($lockedAttempt->status === 'in_progress') {
            $now = now();

            $deadlineReached = $lockedAttempt->expires_at &&
                $now->greaterThanOrEqualTo($lockedAttempt->expires_at);

            $durationReached = $lockedAttempt->started_at &&
                $lockedAttempt->question_count > 0 &&
                $now->diffInSeconds(
                    $lockedAttempt->started_at,
                    true
                ) >= $lockedAttempt->question_count *
                    max(1, $lockedAttempt->seconds_per_question);

            if ($deadlineReached || $durationReached) {
                if (!$this->score($lockedAttempt)) {
                    // Keep the attempt unfinalized if it cannot be validly scored.
                    return;
                }

                $lockedAttempt->update([
                    'status' => 'expired',
                    'completed_at' => $now,
                ]);
            }
        }

        // Keep the caller's model synchronized with the database.
        $attempt->refresh();
    }, 3);
}




/**
 * Server-side grading. Unanswered questions count as incorrect.
 * Returns true only when a valid score and pass status are recorded.
 */
private function score(OnlineExamAttempt $attempt): bool
{
    $total = self::REQUIRED_QUESTION_COUNT;

    if (
        (int) $attempt->question_count !== $total ||
        !$attempt->started_at
    ) {
        return false;
    }

    $assignments = DB::table('online_exam_attempt_questions')
        ->where('online_exam_attempt_id', $attempt->id)
        ->orderBy('position')
        ->get(['online_exam_question_id', 'position']);

    if ($assignments->count() !== $total) {
        return false;
    }

    $positions = $assignments->pluck('position')
        ->map(fn ($position) => (int) $position)
        ->all();

    $questionIds = $assignments->pluck('online_exam_question_id')
        ->map(fn ($id) => (int) $id)
        ->all();

    if (
        $positions !== range(1, $total) ||
        count(array_unique($questionIds)) !== $total
    ) {
        return false;
    }

    $assignedIds = array_fill_keys($questionIds, true);

    $answers = DB::table('online_exam_answers as a')
        ->leftJoin(
            'online_exam_options as o',
            'o.id',
            '=',
            'a.online_exam_option_id'
        )
        ->where('a.online_exam_attempt_id', $attempt->id)
        ->get([
            'a.online_exam_question_id',
            'a.online_exam_option_id',
            'o.online_exam_question_id as option_question_id',
            'o.is_correct',
        ]);

    $correct = 0;

    foreach ($answers as $answer) {
        $questionId = (int) $answer->online_exam_question_id;

        if (!isset($assignedIds[$questionId])) {
            return false;
        }

        // A null option is treated as unanswered, not correct.
        if ($answer->online_exam_option_id === null) {
            continue;
        }

        if (
            $answer->option_question_id === null ||
            (int) $answer->option_question_id !== $questionId
        ) {
            return false;
        }

        if ((bool) $answer->is_correct) {
            $correct++;
        }
    }

    $percentage = round(($correct / $total) * 100, 2);
    $passed = $percentage >= self::DEFAULT_PASSING_SCORE;

    // Never silently overwrite an existing official score.
    if ($attempt->score !== null) {
        return abs((float) $attempt->score - $percentage) < 0.005
            && $attempt->passed !== null
            && (bool) $attempt->passed === $passed;
    }

    $attempt->update([
        'score' => $percentage,
        'passed' => $passed,
        'remarks' => sprintf(
            'Answered %d of %d questions correctly.',
            $correct,
            $total
        ),
    ]);

    $attempt->refresh();

    return $attempt->score !== null
        && $attempt->passed !== null
        && abs((float) $attempt->score - $percentage) < 0.005
        && (bool) $attempt->passed === $passed;
}

    /** Safe summary: the score is only included after an official release. */
    private function attemptSummary(OnlineExamAttempt $attempt): array
    {
        $released = $attempt->results_released_at !== null;

        return [
            'id' => $attempt->id,
            'status' => $attempt->status,
            'started_at' => $attempt->started_at?->toIso8601String(),
            'completed_at' => $attempt->completed_at?->toIso8601String(),
            'results_released_at' => $attempt->results_released_at
                ? $attempt->results_released_at->toIso8601String()
                : null,
            'score' => $released ? $attempt->score : null,
            'remarks' => $released ? $attempt->remarks : null,
            'passed' => $released ? $attempt->passed : null,
            ...($released ? $this->releasedResultDetails($attempt) : []),
        ];
    }

    /** Aggregate details only; never include questions, answer keys or selected options. */
    private function releasedResultDetails(OnlineExamAttempt $attempt): array
    {
        if (!$attempt->results_released_at) return [];
        $total = (int) $attempt->question_count;
        $answered = min($total, (int) ($attempt->answered_count ?? $attempt->answers()->whereNotNull('online_exam_option_id')->count()));
        $correct = $attempt->score === null ? null : (int) round((float) $attempt->score * $total / 100);
        $end = $attempt->completed_at;
        if ($end && $attempt->expires_at && $end->greaterThan($attempt->expires_at)) $end = $attempt->expires_at;
        return [
            'attempt_id' => $attempt->id,
            'question_count' => $total,
            'answered_count' => $answered,
            'unanswered_count' => max(0, $total - $answered),
            'correct_count' => $correct,
            'incorrect_count' => $correct === null ? null : max(0, $answered - $correct),
            'passing_score' => self::DEFAULT_PASSING_SCORE,
            'started_at' => $attempt->started_at?->toIso8601String(),
            'completed_at' => $attempt->completed_at?->toIso8601String(),
            'duration_seconds' => $end && $attempt->started_at ? (int) max(0, $attempt->started_at->diffInSeconds($end, false)) : null,
            'decision_note' => 'This examination result is separate from the final scholarship decision.',
        ];
    }

    /** Attempt payload for the runner: timing plus remaining question time. */
    private function attemptPayload(OnlineExamAttempt $attempt): array
    {
        $navigation = app(\App\Services\OnlineExamNavigationService::class);
        $seconds = max(1, $attempt->seconds_per_question);
        $remaining = null;

        if ($attempt->status === 'in_progress' && $attempt->started_at) {
            $elapsed = now()->diffInSeconds($attempt->started_at, true);
            $index = $navigation->enabled($attempt) ? (int) $attempt->current_question_index : min(
                (int) floor($elapsed / $seconds),
                max(0, $attempt->question_count - 1)
            );
$questionEndsAt = $attempt->started_at->copy()
    ->addSeconds(($index + 1) * $seconds);

$deadline = $questionEndsAt;

if (
    $attempt->expires_at &&
    $attempt->expires_at->lessThan($deadline)
) {
    $deadline = $attempt->expires_at;
}

$now = now();

$remaining = $deadline->greaterThan($now)
    ? (int) ceil($now->diffInSeconds($deadline))
    : 0;
        }

        return [
            'id' => $attempt->id,
            'status' => $attempt->status,
            'started_at' => $attempt->started_at?->toIso8601String(),
            'expires_at' => $attempt->expires_at?->toIso8601String(),
            'completed_at' => $attempt->completed_at?->toIso8601String(),
            'question_count' => $attempt->question_count,
            'seconds_per_question' => $attempt->seconds_per_question,
            'current_question_index' => $navigation->viewedIndex($attempt),
            'active_question_index' => (int) $attempt->current_question_index,
            'navigation_enabled' => $navigation->enabled($attempt),
            'navigation_revision' => (int) $attempt->navigation_revision,
            'is_reviewing' => $navigation->enabled($attempt) && $navigation->viewedIndex($attempt) < (int) $attempt->current_question_index,
            'can_previous' => $navigation->enabled($attempt) && $attempt->status === 'in_progress' && $navigation->viewedIndex($attempt) > 0 && $navigation->remaining($attempt) > $navigation::REVIEW_CUTOFF,
            'server_time' => now()->toISOString(),
            'question_deadline_at' => isset($deadline) ? $deadline->toISOString() : null,
            'answered_count' => $attempt->answers()->count(),
            'remaining_seconds' => $remaining,
            'results_released' => $attempt->results_released_at !== null,
        ];
    }

    private function instructions(): string
    {
        return 'For new attempts, Next saves your progress and carries unused time to the next question. Previous lets you review and change earlier answers only while more than 25 seconds remain on the active question. At 25 seconds you automatically return to that active question. Reviewing does not pause the timer or grant additional time. The total attempt limit stays unchanged. Answer every question within the allotted time. Each question '
            . 'advances automatically once its timer expires and the time '
            . 'cannot be paused or extended from your device. Your answers are '
            . 'saved as you go. Submit the examination when you are finished; '
            . 'results are shown only after they are officially released by '
            . 'the college.';
    }
}
