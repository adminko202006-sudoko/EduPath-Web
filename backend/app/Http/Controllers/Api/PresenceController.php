<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OnlinePresence;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class PresenceController extends Controller
{
    public function heartbeat(Request $request, OnlinePresence $presence)
    {
        $user = $request->user();
        if ($user->role === 'staff' && $user->staff?->status !== 'active') {
            return response()->json(['message' => 'Your staff account is inactive.'], 403);
        }
        $token = $user->currentAccessToken();
        // EduPath clients use Sanctum bearer tokens. Never accept another user's ID.
        if (!$token instanceof PersonalAccessToken) {
            return response()->json(['message' => 'A signed-in device token is required.'], 403);
        }
        $presence->touch($token);

        return response()->json(['success' => true, 'expires_in' => OnlinePresence::TTL_SECONDS])->header('Cache-Control', 'no-store');
    }

    public function index(Request $request, OnlinePresence $presence)
    {
        $input = $request->validate(['user_ids' => 'required|array|min:1|max:200', 'user_ids.*' => 'required|integer|min:1|distinct']);

        return response()->json(['data' => (object) $presence->statuses($input['user_ids']), 'expires_in' => OnlinePresence::TTL_SECONDS])
            ->header('Cache-Control', 'no-store');
    }
}
