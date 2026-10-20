<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Rules\UniqueAccountEmail;

class ProfileController extends Controller
{
    /**
     * Display the authenticated staff profile.
     */
    public function show(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'staff') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $staff = $user->staff;

        if (!$staff) {
            return response()->json([
                'success' => false,
                'message' => 'Staff profile not found.',
            ], 404);
        }

        $staff->load([
            'user',
            'permissions',
            'academicPrograms',
        ]);

        return response()->json([
            'success' => true,
            'data' => $staff,
        ]);
    }

    /**
     * Update the authenticated staff's personal information.
     */
    public function update(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'staff') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $staff = $user->staff;

        if (!$staff) {
            return response()->json([
                'success' => false,
                'message' => 'Staff profile not found.',
            ], 404);
        }

        $validated = $request->validate([
            'profile_photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'first_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => [
                'bail',
                'required',
                'email',
                'max:255',
                new UniqueAccountEmail($user->id),
            ],
        ]);

        $newPhoto = null;
        if ($request->hasFile('profile_photo')) {
            $newPhoto = $request->file('profile_photo')->store('staff_profile_photos', 'public');
            if (!$newPhoto) {
                return response()->json(['success' => false, 'message' => 'The profile picture could not be stored. Please try again.'], 503);
            }
        }

        try {
            DB::transaction(function () use ($staff, $user, $validated, $newPhoto) {
                $staff->update([
                    'first_name' => $validated['first_name'],
                    'middle_name' => $validated['middle_name'] ?? null,
                    'last_name' => $validated['last_name'],
                ]);
                $userData = [
                    'name' => implode(' ', array_filter([$validated['first_name'], $validated['middle_name'] ?? null, $validated['last_name']])),
                    'email' => $validated['email'],
                ];
                if ($newPhoto) $userData['profile_photo'] = $newPhoto;
                $user->update($userData);
            });
        } catch (\Throwable $error) {
            if ($newPhoto) {
                try { Storage::disk('public')->delete($newPhoto); }
                catch (\Throwable $cleanupError) { report($cleanupError); }
            }
            throw $error;
        }
        // Retain the prior image; do not remove existing uploads during replacement.

        $staff->load([
            'user',
            'permissions',
            'academicPrograms',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data' => $staff,
        ]);
    }
}
