<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

use App\Http\Middleware\RoleMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Only the opt-in demo process trusts the local cloudflared connector.
        // Ordinary LAN/development and hosted deployments keep their existing policy.
        if (env('EDUPATH_DEMO_MODE', false)) {
            $middleware->trustProxies(at: ['127.0.0.1', '::1'], headers:
                Request::HEADER_X_FORWARDED_FOR | Request::HEADER_X_FORWARDED_PROTO | Request::HEADER_X_FORWARDED_PORT);
        }
        // Laravel's default guest redirect targets a named `login` route. This app
        // has no such route (the React SPA owns /login), so resolving it inside the
        // Authenticate middleware crashed unauthenticated API requests with a 500
        // "Route [login] not defined." instead of returning 401.
        $middleware->redirectGuestsTo(function (Request $request) {
            return $request->is('api/*') ? null : '/login';
        });

        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'permission' => \App\Http\Middleware\StaffPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(function (Request $request, Throwable $e) {
            return $request->is('api/*') || $request->expectsJson();
        });

        // API clients that do not send `Accept: application/json` must still get a
        // 401 JSON response. Without this, Laravel redirects to the named `login`
        // route, which does not exist for the api middleware group, producing a
        // 500 "Route [login] not defined." error instead of 401.
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
        });

        // Keep development diagnostics in the server log, never in applicant API responses.
        $exceptions->render(function (\Illuminate\Database\UniqueConstraintViolationException $e, Request $request) {
            if (!$request->is('api/*')) return null;
            // A simultaneous account write can pass validation before the
            // existing database unique index rejects it. Keep that a field error.
            if (!preg_match('/users_email_unique|users\.email\b/i', $e->getMessage())) return null;
            $message = \App\Rules\UniqueAccountEmail::MESSAGE;
            return response()->json(['message' => $message, 'errors' => ['email' => [$message]]], 422);
        });

        $exceptions->render(function (Throwable $e, Request $request) {
            if (!$request->is('api/*')) return null;
            if ($e instanceof \Illuminate\Validation\ValidationException || $e instanceof AuthenticationException) return null;
            if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface && $e->getStatusCode()<500) return null;
            $http=$e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
            return response()->json(['success'=>false,'message'=>'An unexpected server error occurred. Please try again or contact the college if it continues.'],$http ? $e->getStatusCode() : 500,$http ? $e->getHeaders() : []);
        });
    })
    ->create();
