<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        foreach (['auth-login' => [10, 5], 'auth-recovery' => [10, 3], 'auth-verify' => [30, 10], 'auth-register' => [10, 5]] as $name => [$ipLimit, $accountLimit]) {
            RateLimiter::for($name, function (Request $request) use ($name, $ipLimit, $accountLimit) {
                $rawEmail = $request->input('email', '');
                $email = is_string($rawEmail) ? strtolower(trim($rawEmail)) : '';
                return [
                    Limit::perMinute($ipLimit)->by($name.':ip:'.$request->ip()),
                    Limit::perMinute($accountLimit)->by($name.':account:'.hash('sha256', $email)),
                ];
            });
        }
    }
}
