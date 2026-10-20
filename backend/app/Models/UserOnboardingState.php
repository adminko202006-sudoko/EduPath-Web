<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserOnboardingState extends Model
{
    protected $fillable = ['user_id', 'tutorial_key', 'tutorial_version', 'status', 'current_step_id', 'enrollment_source', 'revision', 'started_at', 'completed_at', 'skipped_at'];

    protected function casts(): array
    {
        return ['tutorial_version' => 'integer', 'revision' => 'integer', 'started_at' => 'datetime', 'completed_at' => 'datetime', 'skipped_at' => 'datetime'];
    }

    public static function enrollNewApplicant(User $user): void
    {
        if (config('onboarding.enroll_new_applicants')) {
            static::create(['user_id' => $user->id, 'tutorial_version' => config('onboarding.version'), 'enrollment_source' => 'new_registration']);
        }
    }
}
