<?php

namespace App\Http\Controllers\Api\Applicant;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class ProfileController extends Controller
{
    /**
     * Display the applicant's profile.
     */
    public function show(Request $request)
    {
        $user = $request->user();
        $applicant = $user->applicant()->first();

        if ($applicant) {
            $identity = \App\Models\StudentVerification::where('applicant_id', $applicant->id)->first();
            if ($identity) $applicant->setAttribute('lrn', $identity->lrn);
        }

        return response()->json([
            'success' => true,
            'message' => 'Profile retrieved successfully.',
            'data' => [
                'user' => $user,
                'applicant' => $applicant,
                'profile_photo_url' => $applicant?->profile_photo
                    ? asset('storage/' . $applicant->profile_photo)
                    : null,
            ],
        ]);
    }

    /**
     * Update the applicant's profile.
     */
    public function update(Request $request)
    {
        $user = $request->user();
        $applicant = $user->applicant;

        $validated = $request->validate([
            'first_name' => 'sometimes|required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'sometimes|required|string|max:255',

            'birth_date' => 'nullable|date|before_or_equal:today',
            'gender' => 'nullable|string|in:Male,Female,Other',

            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string|max:500',

            'primary_school' => 'sometimes|nullable|string|max:255',
            'primary_school_year' => ['sometimes', 'nullable', 'string', 'regex:/^[0-9]{4}$/'],
            'junior_high_school' => 'sometimes|nullable|string|max:255',
            'senior_high_school' => 'sometimes|nullable|string|max:255',
            'shs_strand' => 'sometimes|nullable|string|max:100',
            'lrn' => ['sometimes', 'nullable', 'string', 'regex:/^[0-9]{12}$/'],
            'previous_college_university' => 'sometimes|nullable|string|max:255',

            'profile_photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        if (!$applicant) {
            return response()->json(['success' => false, 'message' => 'Applicant profile not found.'], 403);
        }
        $applicantData = collect($validated)->except('profile_photo')->toArray();
        $newPhoto = null;
        if ($request->hasFile('profile_photo')) {
            $newPhoto = $request->file('profile_photo')->store('profile_photos', 'public');
            if (!$newPhoto) {
                return response()->json(['success' => false, 'message' => 'The profile picture could not be stored. Please try again.'], 503);
            }
            $applicantData['profile_photo'] = $newPhoto;
        }
        try {
            DB::transaction(function () use ($applicant, $user, $applicantData) {
                $applicant = \App\Models\Applicant::whereKey($applicant->id)->lockForUpdate()->firstOrFail();
                app(\App\Services\StudentVerificationService::class)->protectProfileIdentity($applicant, $applicantData);
                $applicant->update($applicantData);
                $fullName = implode(' ', array_filter([$applicant->first_name, $applicant->middle_name, $applicant->last_name]));
                if ($fullName !== '') $user->update(['name' => $fullName]);
            });
        } catch (\Throwable $error) {
            if ($newPhoto) {
                try { Storage::disk('public')->delete($newPhoto); }
                catch (\Throwable $cleanupError) { report($cleanupError); }
            }
            throw $error;
        }
        // Preserve existing uploads when replacing the profile picture.

        $user = $user->fresh();
        $applicant = $user->applicant?->fresh();

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data' => [
                'user' => $user,
                'applicant' => $applicant,
                'profile_photo_url' => $applicant?->profile_photo
                    ? asset('storage/' . $applicant->profile_photo)
                    : null,
            ],
        ]);
    }
}
