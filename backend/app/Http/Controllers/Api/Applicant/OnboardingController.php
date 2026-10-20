<?php

namespace App\Http\Controllers\Api\Applicant;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateApplicantOnboardingRequest;
use App\Models\User;
use App\Models\UserOnboardingState;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OnboardingController extends Controller
{
    private function state(int $userId)
    {
        return UserOnboardingState::where('user_id', $userId)
            ->where('tutorial_key', 'applicant')->where('tutorial_version', config('onboarding.version'));
    }

    private function examActive(int $userId): bool
    {
        // Read only: do not call the examination overview, which advances its clock.
        return DB::table('online_exam_attempts')->join('applicants', 'applicants.id', '=', 'online_exam_attempts.applicant_id')
            ->where('applicants.user_id', $userId)->where('online_exam_attempts.status', 'in_progress')
            ->where(function ($query) {
                $query->whereNull('online_exam_attempts.expires_at')->orWhere('online_exam_attempts.expires_at', '>', now());
            })->exists();
    }

    private function payload(int $userId): array
    {
        return ['tutorial_version' => config('onboarding.version'), 'state' => $this->state($userId)->first(), 'exam_active' => $this->examActive($userId)];
    }

    public function show(Request $request)
    {
        return response()->json(['success' => true, 'data' => $this->payload($request->user()->id)])->header('Cache-Control', 'no-store');
    }

    public function update(UpdateApplicantOnboardingRequest $request)
    {
        return $this->save($request, false);
    }

    public function restart(UpdateApplicantOnboardingRequest $request)
    {
        return $this->save($request, true);
    }

    private function save(UpdateApplicantOnboardingRequest $request, bool $restart)
    {
        $data = $request->validated();
        $userId = $request->user()->id;
        return DB::transaction(function () use ($userId, $data, $restart) {
            // Also serializes the first manual enrollment and simultaneous restarts.
            User::whereKey($userId)->lockForUpdate()->firstOrFail();
            if ($this->examActive($userId)) {
                return response()->json(['success' => false, 'code' => 'exam_active', 'message' => 'The tutorial is unavailable during an active examination.'], 409);
            }
            $state = $this->state($userId)->lockForUpdate()->first();
            if (($state?->revision ?? 0) !== (int) $data['revision']) {
                return response()->json(['success' => false, 'code' => 'stale_onboarding', 'message' => 'Tutorial progress changed in another tab. Reload its latest progress before continuing.'], 409);
            }
            if (!$restart && (!$state || in_array($state->status, ['completed', 'skipped'], true))) {
                return response()->json(['success' => false, 'message' => 'Start or restart the tutorial from Settings first.'], 409);
            }
            if (!$restart && $data['status'] === 'completed' && ($data['current_step_id'] !== 'finish' || $state->current_step_id !== 'finish')) {
                return response()->json(['success' => false, 'message' => 'Visit the final tutorial step before finishing.'], 422);
            }
            $state ??= new UserOnboardingState(['user_id' => $userId, 'tutorial_key' => 'applicant', 'tutorial_version' => config('onboarding.version'), 'enrollment_source' => 'manual']);
            $state->status = $restart ? 'in_progress' : $data['status'];
            $state->current_step_id = $restart ? 'welcome' : $data['current_step_id'];
            $state->revision = ($state->revision ?? 0) + 1;
            $state->started_at = $restart ? now() : ($state->started_at ?? ($state->status === 'in_progress' ? now() : null));
            $state->completed_at = $state->status === 'completed' ? now() : null;
            $state->skipped_at = $state->status === 'skipped' ? now() : null;
            $state->save();
            return response()->json(['success' => true, 'message' => 'Tutorial progress saved.', 'data' => $this->payload($userId)]);
        });
    }
}
