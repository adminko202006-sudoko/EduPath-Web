<?php
// Explicit CLI acceptance probe, outside PHPUnit. Only writes fictional records to
// a newly generated disposable MySQL database; never copies source records.
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Applicant;
use App\Models\User;
use App\Services\AdmissionSubmissionService;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Process\Process;

$sourceName = config('database.default');
$source = DB::connection($sourceName);
$sourceConfig = $source->getConfig();
if ($source->getDriverName() !== 'mysql') {
    fwrite(STDERR, "This probe requires MySQL/MariaDB.\n"); exit(1);
}
$quote = fn ($name) => '`'.str_replace('`', '``', $name).'`';
$configure = function (string $database) use ($sourceConfig): void {
    if (!preg_match('/^edupath_acceptance_[a-f0-9]{12}$/', $database) || $database === $sourceConfig['database']) {
        throw new RuntimeException('Refusing an unsafe acceptance database name.');
    }
    config(['database.connections.native_acceptance' => array_replace($sourceConfig, ['database' => $database, 'url' => null, 'name' => 'native_acceptance']), 'database.default' => 'native_acceptance']);
    DB::setDefaultConnection('native_acceptance');
    DB::purge('native_acceptance');
    if (DB::connection()->getName() !== 'native_acceptance'
        || DB::selectOne('SELECT DATABASE() AS current_database')->current_database !== $database
        || User::resolveConnection()->selectOne('SELECT DATABASE() AS current_database')->current_database !== $database) {
        throw new RuntimeException('Acceptance database isolation could not be verified.');
    }
};

if (($argv[1] ?? '') === '--worker') {
    $configure((string) getenv('EDUPATH_ACCEPTANCE_DB'));
    $start = (float) getenv('EDUPATH_ACCEPTANCE_START');
    while (microtime(true) < $start) usleep(10000);
    try {
        app(AdmissionSubmissionService::class)->submit((int) getenv('EDUPATH_ACCEPTANCE_APPLICANT'), (int) getenv('EDUPATH_ACCEPTANCE_PROGRAM'), 'Fictional native concurrency check', User::findOrFail((int) $argv[2]));
        echo "201\n";
    } catch (HttpResponseException $e) {
        echo $e->getResponse()->getStatusCode()."\n";
    }
    exit(0);
}

$database = 'edupath_acceptance_'.bin2hex(random_bytes(6));
$created = false;
$workers = [];
try {
    $source->statement('CREATE DATABASE '.$quote($database));
    $created = true;
    foreach (['users', 'applicants', 'academic_programs', 'admission_periods', 'admission_applications', 'admission_application_histories'] as $table) {
        $source->statement('CREATE TABLE '.$quote($database).'.'.$quote($table).' LIKE '.$quote($sourceConfig['database']).'.'.$quote($table));
    }
    $configure($database);
    if (DB::table('users')->count() !== 0) throw new RuntimeException('Acceptance fixture database is not empty.');
    $applicantUser = User::create(['name' => 'Fictional acceptance applicant', 'email' => 'native-applicant@example.test', 'password' => 'fictional-acceptance-only', 'role' => 'applicant']);
    $admin = User::create(['name' => 'Fictional acceptance admin', 'email' => 'native-admin@example.test', 'password' => 'fictional-acceptance-only', 'role' => 'admin']);
    $applicant = Applicant::create(['user_id' => $applicantUser->id, 'first_name' => 'Fictional', 'last_name' => 'Applicant']);
    $program = DB::table('academic_programs')->insertGetId(['name' => 'Fictional acceptance program', 'code' => 'NATIVE-TEST', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]);
    DB::table('admission_periods')->insert(['name' => 'Fictional acceptance period', 'academic_year' => '2026-2027', 'status' => 'open', 'start_date' => now()->subDay()->toDateString(), 'end_date' => now()->addDay()->toDateString(), 'created_at' => now(), 'updated_at' => now()]);
    $environment = [
        'EDUPATH_ACCEPTANCE_DB' => $database, 'EDUPATH_ACCEPTANCE_START' => (string) (microtime(true) + 3),
        'EDUPATH_ACCEPTANCE_APPLICANT' => (string) $applicant->id, 'EDUPATH_ACCEPTANCE_PROGRAM' => (string) $program,
    ];
    foreach ([$applicantUser->id, $admin->id] as $actorId) {
        $worker = new Process([PHP_BINARY, __FILE__, '--worker', (string) $actorId], base_path(), $environment);
        $worker->setTimeout(30); $worker->start(); $workers[] = $worker;
    }
    $statuses = [];
    foreach ($workers as $worker) {
        $worker->wait();
        if (!$worker->isSuccessful()) throw new RuntimeException('A native worker failed; inspect the local acceptance environment.');
        $statuses[] = (int) trim($worker->getOutput());
    }
    sort($statuses);
    if ($statuses !== [201, 409] || DB::table('admission_applications')->count() !== 1 || DB::table('admission_application_histories')->count() !== 1) {
        throw new RuntimeException('Concurrent admission invariant failed.');
    }
    echo "PASS: simultaneous applicant/admin submissions produced one 201, one 409, one application and one history record.\n";
} catch (Throwable $e) {
    // No database names, connection strings, credentials or record data in output.
    fwrite(STDERR, 'FAIL: '.$e::class."; inspect the acceptance probe locally.\n");
    report($e);
    $failed = true;
} finally {
    foreach ($workers as $worker) if ($worker->isRunning()) $worker->stop();
    DB::disconnect('native_acceptance');
    if ($created && preg_match('/^edupath_acceptance_[a-f0-9]{12}$/', $database) && $database !== $sourceConfig['database']) {
        $source->statement('DROP DATABASE '.$quote($database));
    }
}
exit(isset($failed) ? 1 : 0);
