<?php

namespace App\Services;

use App\Models\OnlineExamQuestion;
use App\Models\OnlineExamSetting;
use Illuminate\Support\Facades\DB;

class ReadinessService
{
    /** Configuration/data checks only: no sends, data corrections or external requests. */
    public function checks(bool $production = false): array
    {
        $checks = [];
        $check = function (string $name, callable $inspect, string $failure) use (&$checks): void {
            try {
                $ok = (bool) $inspect();
                $checks[] = ['name' => $name, 'ok' => $ok, 'message' => $ok ? 'OK' : $failure];
            } catch (\Throwable) {
                $checks[] = ['name' => $name, 'ok' => false, 'message' => 'Unable to inspect; check schema, database connection and private server logs.'];
            }
        };
        $check('Database connection', fn () => DB::select('SELECT 1'), 'Database unavailable.');
        $check('Application key', fn () => config('app.key'), 'Application key missing.');
        $check('Applied migrations', function () {
            $applied = DB::table('migrations')->pluck('migration')->all();
            $files = array_map(fn ($path) => pathinfo($path, PATHINFO_FILENAME), glob(database_path('migrations/*.php')));
            return count(array_diff($files, $applied)) === 0;
        }, 'Pending migrations; review and apply them before release.');
        $check('Online exam question bank', fn () => OnlineExamQuestion::eligible()->count() >= 100, 'Publish at least 100 valid active questions.');
        $check('Online exam timing', fn () => OnlineExamSetting::secondsPerQuestion() === 60, 'New attempts must use the approved 60-second limit for standard acceptance.');
        $check('Duplicate active admissions', fn () => DB::table('admission_applications')
            ->select('applicant_id', 'admission_period_id')->whereIn('status', AdmissionSubmissionService::ACTIVE_STATUSES)
            ->groupBy('applicant_id', 'admission_period_id')->havingRaw('COUNT(*) > 1')->get()->isEmpty(),
            'Existing duplicate active admissions need an authorized case-by-case resolution; no records changed.');

        if ($production) {
            $check('Official question content', fn () => !OnlineExamQuestion::where('is_active', true)->whereIn('source', ['sample', 'test', 'workflow_test'])->exists(), 'Active sample/test questions must be replaced with institution-approved content before production.');
            $check('Production environment', fn () => app()->environment('production'), 'Set APP_ENV=production in the deployment environment.');
            $check('Debug disabled', fn () => !config('app.debug'), 'Disable APP_DEBUG in the deployment environment.');
            $check('HTTPS application URL', fn () => parse_url(config('app.url', ''), PHP_URL_SCHEME) === 'https', 'Configure the HTTPS backend APP_URL.');
            $check('Delivery mail transport', fn () => !in_array(config('mail.default'), ['log', 'array', null], true), 'Configure a real delivery mail transport.');
            $check('Private Firebase credentials', function () {
                $path = config('services.firebase.credentials') ?: storage_path('app/firebase-credentials.json');
                if (!is_file($path) || !is_readable($path)) return false;
                $credentials = json_decode(file_get_contents($path), true);
                return !empty($credentials['project_id']) && !empty($credentials['client_email']) && !empty($credentials['private_key']);
            }, 'Configure readable private Firebase service-account credentials.');
        }
        return $checks;
    }
}
