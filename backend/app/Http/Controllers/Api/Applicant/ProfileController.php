<?php

namespace App\Http\Controllers\Api\Applicant;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    /**
     * Display the applicant's profile.
     */
    public function show(Request $request)
    {
        $user = $request->user();
        $applicant = $user->applicant;

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

            'birth_date' => 'nullable|date',
            'gender' => 'nullable|string|in:Male,Female,Other',

            'phone' => 'nullable|string|max:30',
            'address' => 'nullable|string|max:500',

            'profile_photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Update Applicant Information
        |--------------------------------------------------------------------------
        */

        if ($applicant) {

            $applicantData = collect($validated)
                ->only([
                    'first_name',
                    'middle_name',
                    'last_name',
                    'birth_date',
                    'gender',
                    'phone',
                    'address',
                ])
                ->toArray();

            /*
            |--------------------------------------------------------------------------
            | Upload Profile Photo
            |--------------------------------------------------------------------------
            */

            if ($request->hasFile('profile_photo')) {

                // Delete the old profile photo
                if ($applicant->profile_photo) {
                    Storage::disk('public')->delete(
                        $applicant->profile_photo
                    );
                }

                // Store the new profile photo
                $path = $request
                    ->file('profile_photo')
                    ->store('profile_photos', 'public');

                $applicantData['profile_photo'] = $path;
            }

            $applicant->update($applicantData);

            /*
            |--------------------------------------------------------------------------
            | Keep User Name Synchronized
            |--------------------------------------------------------------------------
            */

            $updatedApplicant = $applicant->fresh();

            $fullName = implode(' ', array_filter([
                $updatedApplicant->first_name,
                $updatedApplicant->middle_name,
                $updatedApplicant->last_name,
            ]));

            $user->update([
                'name' => $fullName,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Refresh Data
        |--------------------------------------------------------------------------
        */

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