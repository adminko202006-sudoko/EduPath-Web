<?php

namespace Tests\Feature;

use App\Services\FcmService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FcmDeliveryTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['cache.default' => 'array']);
        Storage::fake('local');
        config(['services.firebase.credentials' => Storage::disk('local')->path('firebase-test.json')]);
        Http::preventStrayRequests();
    }

    private function credentials(): void
    {
        Storage::disk('local')->put('firebase-test.json', json_encode([
            'project_id' => 'test-project', 'client_email' => 'test@example.test', 'private_key' => 'test-only-no-real-key',
        ]));
        Cache::put('fcm_google_access_token', 'fake-oauth-token', 60);
    }

    public function test_missing_or_invalid_private_credentials_fail_without_contacting_provider(): void
    {
        $this->assertFalse(app(FcmService::class)->sendNotification('fake-device-token', 'Test', 'Test'));
        Storage::disk('local')->put('firebase-test.json', '{invalid');
        $this->assertFalse(app(FcmService::class)->sendNotification('fake-device-token', 'Test', 'Test'));
        Storage::disk('local')->put('firebase-test.json', json_encode(['project_id' => 'test-only']));
        $this->assertFalse(app(FcmService::class)->sendNotification('fake-device-token', 'Test', 'Test'));
        Http::assertNothingSent();
    }

    public function test_provider_rejection_is_failure_and_logs_do_not_include_device_or_response_body(): void
    {
        $this->credentials();
        Log::spy();
        Http::fake(['fcm.googleapis.com/*' => Http::response(['error' => 'sensitive-provider-data'], 400)]);
        $this->assertFalse(app(FcmService::class)->sendNotification('private-device-token', 'Private title', 'Private body'));
        Log::shouldHaveReceived('error')->once()->with('FCM push rejected by provider.', ['http_status' => 400]);
        Http::assertSentCount(1);
    }

    public function test_a_partially_failed_device_batch_does_not_report_success(): void
    {
        $this->credentials();
        Http::fake(['fcm.googleapis.com/*' => Http::sequence()->push(['name' => 'test-message'], 200)->push([], 503)]);
        $this->assertFalse(app(FcmService::class)->sendNotification(['test-device-one', 'test-device-two'], 'Test', 'Test'));
        Http::assertSentCount(2);
    }

    public function test_successful_provider_response_is_reported_as_success(): void
    {
        $this->credentials();
        Http::fake(['fcm.googleapis.com/*' => Http::response(['name' => 'test-message'], 200)]);
        $this->assertTrue(app(FcmService::class)->sendNotification('test-device', 'Test', 'Test'));
        Http::assertSentCount(1);
    }
}
