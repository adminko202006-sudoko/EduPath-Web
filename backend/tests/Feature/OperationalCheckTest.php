<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class OperationalCheckTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:',
            'app.key' => 'private-test-marker-never-output', 'app.debug' => true, 'mail.default' => 'log',
            'services.firebase.credentials' => storage_path('framework/testing/no-such-service-account.json')]);
        DB::purge('sqlite');
        DB::setDefaultConnection('sqlite');
        Schema::create('notification_deliveries', fn (Blueprint $table) => $table->string('status'));
        Http::preventStrayRequests();
    }

    public function test_incomplete_deployment_fails_closed_without_printing_secrets_or_sql(): void
    {
        $this->assertSame(1, Artisan::call('edupath:operations-check', ['--production' => true]));
        $output = Artisan::output();
        $this->assertStringContainsString('Applied migrations:', $output);
        $this->assertStringContainsString('Private Firebase credentials:', $output);
        $this->assertStringContainsString('Disable APP_DEBUG', $output);
        $this->assertStringNotContainsString('private-test-marker-never-output', $output);
        $this->assertStringNotContainsString('SQLSTATE', $output);
        Http::assertNothingSent();
    }

    public function test_public_document_probe_detects_an_exposed_file_and_removes_only_its_canary(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('requirements/existing-test-form.txt', 'Public form fixture');
        Http::fake(['https://example.test/*' => Http::response('Unexpected public access', 200)]);
        $this->assertSame(1, Artisan::call('edupath:operations-check', ['--url' => 'https://example.test']));
        $this->assertStringContainsString('Raw document access probe: FAILED (HTTP 200)', Artisan::output());
        Storage::disk('public')->assertExists('requirements/existing-test-form.txt');
        $this->assertSame([], Storage::disk('public')->allFiles('documents'));
        Http::assertSentCount(1);
    }
}
