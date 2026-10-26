<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Rules\UniqueAccountEmail;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => $this->profileData($request->user()),
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => [
                'bail',
                'sometimes',
                'required',
                'email',
                'max:255',
                new UniqueAccountEmail($user->id),
            ],
            'profile_photo' => 'sometimes|required|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);

        $oldPhoto = $user->profile_photo;
        $newPhoto = null;

        if ($request->hasFile('profile_photo')) {
            $newPhoto = $request->file('profile_photo')->store('admin_profile_photos', 'public');
            if (!$newPhoto) {
                return response()->json([
                    'success' => false,
                    'message' => 'The profile photo could not be stored. Please try again.',
                ], 500);
            }
            $validated['profile_photo'] = $newPhoto;
        }

        try {
            $user->update($validated);
        } catch (\Throwable $exception) {
            if ($newPhoto) {
                Storage::disk('public')->delete($newPhoto);
            }
            throw $exception;
        }

        if ($newPhoto && $oldPhoto && $oldPhoto !== $newPhoto) {
            Storage::disk('public')->delete($oldPhoto);
        }

        return response()->json([
            'success' => true,
            'message' => 'Administrator profile updated successfully.',
            'data' => $this->profileData($user->fresh()),
        ]);
    }

    private function profileData($user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'created_at' => $user->created_at,
            'profile_photo' => $user->profile_photo,
            'profile_photo_url' => $user->profile_photo
                ? Storage::disk('public')->url($user->profile_photo)
                : null,
        ];
    }
}
