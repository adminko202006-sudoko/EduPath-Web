<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(
        Request $request,
        Closure $next,
        string $role
    ): Response {
        if (!$request->user()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if ($request->user()->role !== $role) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access.',
            ], 403);
        }

        if ($role === 'staff') {
            $staff = $request->user()->staff;
            if (!$staff || $staff->status !== 'active') {
                return response()->json([
                    'success' => false,
                    'message' => $staff ? 'Your staff account is inactive.' : 'Staff profile not found.',
                ], 403);
            }
        }

        return $next($request);
    }
}
