<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateApplicantOnboardingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'applicant';
    }

    public function rules(): array
    {
        $rules = [
            'tutorial_version' => ['required', 'integer', Rule::in([config('onboarding.version')])],
            'revision' => ['required', 'integer', 'min:0'],
        ];
        if (!$this->routeIs('applicant.onboarding.restart')) {
            $rules['status'] = ['required', Rule::in(['in_progress', 'completed', 'skipped'])];
            $rules['current_step_id'] = ['required', Rule::in(config('onboarding.steps'))];
        }
        return $rules;
    }
}
