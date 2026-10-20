<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Applicant;
use App\Models\OnlineExamAttempt;
use App\Models\OnlineExamOption;
use App\Models\OnlineExamQuestion;
use App\Models\OnlineExamRetakeGrant;
use App\Models\OnlineExamSetting;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/** Admin APIs for question-bank management, attempts, retakes and result release. */
class OnlineExamController extends Controller
{
    public function questions()
    {
        return response()->json([
            'success' => true,
            'message' => 'Online examination question bank retrieved.',
            'data' => [
                'required_question_count' => 100,
                'seconds_per_question' => OnlineExamSetting::secondsPerQuestion(),
                'passing_score' => 50,
                'active_question_count' => OnlineExamQuestion::eligible()->count(),
                'questions' => OnlineExamQuestion::with(['options' => fn ($q) => $q->orderBy('position')->orderBy('id')])
                    ->withCount('attempts')->orderByDesc('created_at')->orderByDesc('id')->get(),
            ],
        ]);
    }

    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'seconds_per_question' => 'required|integer|min:1|max:' . OnlineExamSetting::MAX_SECONDS,
        ]);
        $setting = DB::transaction(function () use ($request, $validated) {
            $setting = OnlineExamSetting::whereKey(1)->lockForUpdate()->firstOrFail();
            $old = (int) $setting->seconds_per_question;
            $setting->update($validated + ['updated_by' => $request->user()->id]);
            if ($old !== (int) $setting->seconds_per_question) {
                app(\App\Services\WorkflowDecisionService::class)->event('online_exam_settings', 1, 'timing_updated', (string) $old, (string) $setting->seconds_per_question, 'New attempts use the updated timing; existing attempts keep their original limit.', $request->user());
            }
            return $setting;
        });

        return response()->json([
            'success' => true,
            'message' => 'Examination timing saved. Existing attempts keep their original time limit.',
            'data' => ['seconds_per_question' => (int) $setting->seconds_per_question],
        ]);
    }

    public function storeQuestion(Request $request)
    {
        $validated = $request->validate([
            'question' => 'required|string|min:5',
            'source' => 'nullable|string|max:255',
            'is_active' => 'sometimes|boolean',
            'options' => 'required|array|min:2|max:6',
            'options.*.text' => 'required|string|max:500',
            'options.*.is_correct' => 'required|boolean',
        ]);
        $this->ensureExactlyOneCorrectOption($validated['options']);

        $question = DB::transaction(function () use ($validated) {
            $question = OnlineExamQuestion::create([
                'question' => $validated['question'],
                'source' => $validated['source'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
            ]);
            foreach (array_values($validated['options']) as $index => $option) {
                $question->options()->create([
                    'text' => $option['text'],
                    'is_correct' => $option['is_correct'],
                    'position' => $index + 1,
                ]);
            }
            return $question->load('options');
        });

        return response()->json(['success' => true, 'message' => 'Question added to the bank.', 'data' => $question], 201);
    }

    public function updateQuestion(Request $request, OnlineExamQuestion $question)
    {
        $validated = $request->validate([
            'question' => 'sometimes|required|string|min:5',
            'source' => 'nullable|string|max:255',
            'is_active' => 'sometimes|boolean',
            'options' => 'sometimes|required|array|min:2|max:6',
            'options.*.text' => 'required_with:options|string|max:500',
            'options.*.is_correct' => 'required_with:options|boolean',
        ]);

        if (array_key_exists('options', $validated)) {
            $this->ensureExactlyOneCorrectOption($validated['options']);
        }
        if ($question->attempts()->exists() && (array_key_exists('question', $validated) || array_key_exists('options', $validated))) {
            return response()->json([
                'success' => false,
                'message' => 'This question is already assigned to an exam attempt. Its wording and answer options are locked to protect existing scores. You may deactivate it for future attempts.',
            ], 422);
        }

        DB::transaction(function () use ($question, $validated) {
            $question = OnlineExamQuestion::whereKey($question->id)->lockForUpdate()->firstOrFail();
            if ($question->attempts()->exists() && (array_key_exists('question', $validated) || array_key_exists('options', $validated))) {
                throw ValidationException::withMessages(['question' => ['Assigned questions cannot be edited. Deactivate this question and create a new one.']]);
            }
            $question->update(collect($validated)->except('options')->all());
            if (array_key_exists('options', $validated)) {
                $question->options()->delete();
                foreach (array_values($validated['options']) as $index => $option) {
                    $question->options()->create([
                        'text' => $option['text'],
                        'is_correct' => $option['is_correct'],
                        'position' => $index + 1,
                    ]);
                }
            }
        });

        return response()->json(['success' => true, 'message' => 'Question updated.', 'data' => $question->fresh()->load('options')]);
    }

    public function destroyQuestion(OnlineExamQuestion $question)
    {
        return DB::transaction(function () use ($question) {
            $question = OnlineExamQuestion::whereKey($question->id)->lockForUpdate()->firstOrFail();
            if ($question->attempts()->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'This question is part of an existing attempt and cannot be deleted. Deactivate it to keep historical results intact.',
                ], 422);
            }
            $question->delete();
            return response()->json(['success' => true, 'message' => 'Question deleted.']);
        }, 3);
    }

    public function attempts(Request $request)
    {
        $filters = $request->validate([
            'search' => 'nullable|string|max:255',
            'status' => 'nullable|in:in_progress,completed,expired',
            'release' => 'nullable|in:released,unreleased',
            'page' => 'nullable|integer|min:1',
            'group_by' => 'nullable|in:applicant',
        ]);
        $query = OnlineExamAttempt::query()
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($filters['release'] ?? null, function ($q, $release) {
                $release === 'released' ? $q->whereNotNull('results_released_at') : $q->whereNull('results_released_at');
            })
            ->when(trim($filters['search'] ?? ''), function ($q, $search) {
                $q->where(function ($query) use ($search) {
                    if (ctype_digit($search)) $query->where('id', (int) $search);
                    $query->orWhereHas('applicant', function ($applicant) use ($search) {
                        $applicant->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhereHas('user', fn ($user) => $user->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
                    });
                });
            });

        if (($filters['group_by'] ?? null) === 'applicant') {
            // Paginate applicants so one person's matching attempts never split across pages.
            $attempts = (clone $query)->select('applicant_id')
                ->selectRaw('MAX(id) as latest_attempt_id')->groupBy('applicant_id')
                ->orderByDesc('latest_attempt_id')->paginate(25)->withQueryString();
            $groups = (clone $query)->with(['applicant.user', 'assignedQuestions', 'reviews'])
                ->whereIn('applicant_id', $attempts->getCollection()->pluck('applicant_id'))
                ->latest()->orderByDesc('id')->get()->groupBy('applicant_id');
            $attempts->through(fn ($row) => [
                'applicant_id' => $row->applicant_id,
                'applicant' => $groups[$row->applicant_id]->first()->applicant,
                'attempts' => $groups[$row->applicant_id]->values(),
            ]);
        } else {
            $attempts = $query->with(['applicant.user', 'assignedQuestions', 'reviews'])
                ->latest()->orderByDesc('id')->paginate(25)->withQueryString();
        }

        return response()->json([
            'success' => true,
            'message' => 'Online examination attempts retrieved.',
            'data' => $attempts,
        ]);
    }

 public function grantRetake(Request $request)
{
    $validated = $request->validate([
        'applicant_id' => 'required|integer|exists:applicants,id',
        'reason' => 'required|string|min:5|max:1000',
    ]);

    return DB::transaction(function () use ($request, $validated) {
        $applicant = Applicant::whereKey($validated['applicant_id'])
            ->lockForUpdate()
            ->first();

        if (!$applicant) {
            return response()->json([
                'success' => false,
                'message' => 'Applicant not found.',
            ], 404);
        }

        $attemptCount = OnlineExamAttempt::where(
            'applicant_id',
            $applicant->id
        )->count();

        if ($attemptCount === 0) {
            return response()->json([
                'success' => false,
                'message' => 'A retake can only be granted after an applicant has used an attempt.',
            ], 422);
        }

        $hasInProgressAttempt = OnlineExamAttempt::where(
            'applicant_id',
            $applicant->id
        )->where('status', 'in_progress')->exists();

        if ($hasInProgressAttempt) {
            return response()->json([
                'success' => false,
                'message' => 'This applicant already has an examination in progress.',
            ], 422);
        }

        $grantCount = OnlineExamRetakeGrant::where(
            'applicant_id',
            $applicant->id
        )->count();

        if ($grantCount >= $attemptCount) {
            return response()->json([
                'success' => false,
                'message' => 'This applicant already has an unused retake authorization.',
            ], 422);
        }

        $grant = OnlineExamRetakeGrant::create([
            'applicant_id' => $applicant->id,
            'reason' => $validated['reason'],
            'granted_by' => $request->user()->id,
        ]);
        app(\App\Services\OnlineExamAvailabilityService::class)->notifyIfEligible($applicant->id);

        return response()->json([
            'success' => true,
            'message' => 'Retake authorized.',
            'data' => $grant,
        ], 201);
    }, 3);
}


/** POST /admin/online-exams/attempts/{attempt}/release */
public function release(Request $request, OnlineExamAttempt $attempt)
{
    return DB::transaction(function () use ($request, $attempt) {
        $lockedAttempt = OnlineExamAttempt::whereKey($attempt->id)
            ->lockForUpdate()
            ->first();

        if (!$lockedAttempt) {
            return response()->json([
                'success' => false,
                'message' => 'Examination attempt not found.',
            ], 404);
        }

        if ($lockedAttempt->status === 'in_progress') {
            return response()->json([
                'success' => false,
                'message' => 'This attempt has not been submitted yet.',
            ], 422);
        }

        $wasReleased = $lockedAttempt->results_released_at !== null;

        if (!$wasReleased) {
            if (
                !in_array(
                    $lockedAttempt->status,
                    ['completed', 'expired'],
                    true
                ) ||
                !$this->hasValidRecordedScore($lockedAttempt)
            ) {
                return response()->json([
                    'success' => false,
                    'message' => 'This result cannot be released because the attempt, assigned questions, answers, or recorded score failed integrity validation.',
                ], 422);
            }

            $lockedAttempt->update([
                'results_released_at' => now(),
                'results_released_by' => $request->user()->id,
            ]);
            // The locked release transition creates one in-app notification.
            // Retries skip this block; no score is copied into notification text.
            app(\App\Services\ApplicantNotificationService::class)->create($lockedAttempt->applicant->user_id,
                'Online examination result released',
                "The college has officially released your result for online examination attempt #{$lockedAttempt->id}. Open the Online Examination page to view your score, pass status, answer summary, completion time, release date and remarks. This examination result is separate from the final scholarship decision.", 'exam');
            app(\App\Services\WorkflowDecisionService::class)->event('online_exam',$lockedAttempt->id,'result_released',null,'released',null,$request->user());
        }

        $lockedAttempt->refresh();

        return response()->json([
            'success' => true,
            'message' => $wasReleased
                ? 'Result has already been released.'
                : 'Result released.',
            'data' => [
                'id' => $lockedAttempt->id,
                'status' => $lockedAttempt->status,
                'score' => $lockedAttempt->score,
                'passed' => $lockedAttempt->passed,
                'results_released_at' => $lockedAttempt->results_released_at
                    ?->toIso8601String(),
                'results_released_by' => $lockedAttempt->results_released_by,
            ],
        ]);
    }, 3);
}


/**
 * Independently verify assignments, answer ownership, and the stored score
 * before publishing an online scholarship examination result.
 */
private function hasValidRecordedScore(OnlineExamAttempt $attempt): bool
{
    $total = 100;

    if (
        (int) $attempt->question_count !== $total ||
        $attempt->score === null ||
        $attempt->passed === null
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

    $expectedScore = round(($correct / $total) * 100, 2);
    $expectedPassed = $expectedScore >= 50;

    return abs((float) $attempt->score - $expectedScore) < 0.005
        && (bool) $attempt->passed === $expectedPassed;
}
    private function ensureExactlyOneCorrectOption(array $options): void
    {
        $correctCount = collect($options)->filter(fn ($option) => (bool) ($option['is_correct'] ?? false))->count();
        if ($correctCount !== 1) {
            throw ValidationException::withMessages([
                'options' => ['Each question must have exactly one correct answer.'],
            ]);
        }
    }
}
