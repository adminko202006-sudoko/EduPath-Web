<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StaffPermissionMiddleware
{
    public function handle(
        Request $request,
        Closure $next,
        string $permission
    ): Response {
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
            ], 403);
        }

        if ($staff->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Your staff account is inactive.',
            ], 403);
        }

        $permissions = $staff->permissions;

        if (!$permissions || !$permissions->{$permission}) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to perform this action.',
            ], 403);
        }

        return $next($request);
    }
}