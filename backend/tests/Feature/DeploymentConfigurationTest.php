<?php

namespace Tests\Feature;

use App\Notifications\ResetPasswordNotification;
use Tests\TestCase;

class DeploymentConfigurationTest extends TestCase
{
    public function test_password_reset_links_use_cached_frontend_configuration(): void
    {
        config(['app.frontend_url' => 'https://edupath.example/']);
        $account = new class {
            public function getEmailForPasswordReset(): string { return 'applicant@example.test'; }
        };
        $message = (new ResetPasswordNotification('reset-fixture'))->toMail($account);
        $this->assertSame('https://edupath.example/reset-password/reset-fixture?email=applicant%40example.test', $message->actionUrl);
        $this->get('/reset-password/reset-fixture?email=applicant%40example.test')
            ->assertRedirect($message->actionUrl);
    }

    public function test_configured_browser_origin_is_allowed_without_wildcard_access(): void
    {
        config(['cors.allowed_origins' => ['https://edupath.example'], 'cors.allowed_origins_patterns' => []]);
        $this->options('/api/applicant/admissions', [], [
            'Origin' => 'https://edupath.example',
            'Access-Control-Request-Method' => 'GET',
            'Access-Control-Request-Headers' => 'Authorization',
        ])->assertSuccessful()->assertHeader('Access-Control-Allow-Origin', 'https://edupath.example');

        $this->options('/api/applicant/admissions', [], [
            'Origin' => 'https://unrelated.example',
            'Access-Control-Request-Method' => 'GET',
        // With one allowed origin, the CORS library returns that fixed value.
        // It must never echo the unrelated origin or a wildcard.
        ])->assertHeader('Access-Control-Allow-Origin', 'https://edupath.example');

        $this->getJson('/api/applicant/admissions', ['Origin' => 'https://edupath.example'])
            ->assertUnauthorized();
    }

    public function test_production_cors_configuration_excludes_development_networks(): void
    {
        $names = ['APP_ENV', 'CORS_ALLOWED_ORIGINS'];
        $previous = [];
        foreach ($names as $name) $previous[$name] = [$_SERVER[$name] ?? null, $_ENV[$name] ?? null];
        try {
            $_SERVER['APP_ENV'] = $_ENV['APP_ENV'] = 'production';
            $_SERVER['CORS_ALLOWED_ORIGINS'] = $_ENV['CORS_ALLOWED_ORIGINS'] = 'https://edupath.example, https://staff.edupath.example';
            $cors = require config_path('cors.php');
            $this->assertSame(['https://edupath.example', 'https://staff.edupath.example'], $cors['allowed_origins']);
            $this->assertSame([], $cors['allowed_origins_patterns']);
            $this->assertFalse($cors['supports_credentials']);
        } finally {
            foreach ($previous as $name => [$server, $env]) {
                if ($server === null) unset($_SERVER[$name]); else $_SERVER[$name] = $server;
                if ($env === null) unset($_ENV[$name]); else $_ENV[$name] = $env;
            }
        }
    }
}
