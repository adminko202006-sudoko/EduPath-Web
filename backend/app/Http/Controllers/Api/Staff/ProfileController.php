<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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
            'first_name' => ['required', 'string', 'max:100'],
            'middle_name' => ['nullable', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
        ]);

        $staff->update([
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'last_name' => $validated['last_name'],
        ]);

        $fullName = implode(' ', array_filter([
            $validated['first_name'],
            $validated['middle_name'] ?? null,
            $validated['last_name'],
        ]));
        
        $user->update([
            'name' => $fullName,
            'email' => $validated['email'],
        ]);

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