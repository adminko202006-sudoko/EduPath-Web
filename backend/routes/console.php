<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('edupath:notifications-dispatch {--limit=100}', function () {
    $counts=app(\App\Services\NotificationDispatchService::class)->dispatch(max(1,min(1000,(int)$this->option('limit'))));
    $this->info(json_encode($counts));
})->purpose('Dispatch due announcements and retry durable applicant push deliveries');

Schedule::command('edupath:notifications-dispatch')->everyMinute()->withoutOverlapping();

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
