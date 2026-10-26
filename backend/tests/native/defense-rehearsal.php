<?php
// Rehearse actual API routes with fictional data and a disposable MySQL schema.
// No source records, credentials, email deliveries or exam settings are changed.
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\OnlineExamAttempt;
use App\Models\OnlineExamOption;
use App\Models\OnlineExamQuestion;
use App\Models\User;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

$source = DB::connection();
$sourceConfig = $source->getConfig();
if ($source->getDriverName() !== 'mysql') { fwrite(STDERR, "MySQL/MariaDB is required.\n"); exit(1); }
$database = 'edupath_defense_'.bin2hex(random_bytes(6));
$created = false;
$directory = storage_path('framework/testing/'.$database);
$stage = 'initialize isolation';
$failed = false;
$quote = fn ($name) => '`'.str_replace('`', '``', $name).'`';
$assert = function (bool $condition, string $message): void { if (!$condition) throw new RuntimeException($message); };

try {
    $source->statement('CREATE DATABASE '.$quote($database).' CHARACTER SET utf8mb4');
    $created = true;
    foreach ($source->select('SHOW TABLES') as $row) {
        $table = array_values((array) $row)[0];
        $source->statement('CREATE TABLE '.$quote($database).'.'.$quote($table).' LIKE '.$quote($sourceConfig['database']).'.'.$quote($table));
    }
    config([
        'database.connections.defense_rehearsal' => array_replace($sourceConfig, ['database' => $database, 'url' => null, 'name' => 'defense_rehearsal']),
        'database.default' => 'defense_rehearsal', 'cache.default' => 'array',
        'session.driver' => 'array', 'mail.default' => 'array', 'queue.default' => 'sync',
        'onboarding.enroll_new_applicants' => false,
        'filesystems.disks.local.root' => $directory.'/private',
        'filesystems.disks.public.root' => $directory.'/public',
        'logging.default' => 'single',
    ]);
    Illuminate\Support\Facades\Storage::forgetDisk(['local', 'public']);
    $assert(rtrim(str_replace('\\', '/', Illuminate\Support\Facades\Storage::disk('local')->path('')), '/') === str_replace('\\', '/', $directory.'/private'), 'File storage is not isolated');
    DB::setDefaultConnection('defense_rehearsal'); DB::purge('defense_rehearsal');
    $checkIsolation = function () use ($assert, $database, $sourceConfig): void {
        $assert($database !== $sourceConfig['database'] && preg_match('/^edupath_defense_[a-f0-9]{12}$/', $database) === 1, 'Unsafe target name');
        $assert(DB::selectOne('SELECT DATABASE() AS current_database')->current_database === $database, 'Query connection is not isolated');
        $assert(User::resolveConnection()->selectOne('SELECT DATABASE() AS current_database')->current_database === $database, 'Model connection is not isolated');
    };
    $checkIsolation();
    $assert(User::count() === 0, 'Fixture database must start empty');
    // This process is an isolated test; no notification reaches a real inbox.
    $app->instance('env', 'testing');
    Illuminate\Support\Facades\Notification::fake();
    $kernel = app(Kernel::class);
    $call = function (string $label, string $method, string $uri, array $payload, ?string $token, int $expected, array $files = []) use ($kernel, $checkIsolation, $assert, &$stage): array {
        $stage = $label; $checkIsolation(); app('auth')->forgetGuards();
        $server = ['HTTP_ACCEPT' => 'application/json', 'REMOTE_ADDR' => '127.0.0.1'];
        if ($token) $server['HTTP_AUTHORIZATION'] = 'Bearer '.$token;
        if ($files) $request = Request::create($uri, $method, $payload, [], $files, $server);
        else {
            $server['CONTENT_TYPE'] = 'application/json';
            $request = Request::create($uri, $method, [], [], [], $server, json_encode($payload));
        }
        $response = $kernel->handle($request);
        $body = json_decode($response->getContent(), true) ?? [];
        $assert($response->getStatusCode() === $expected, "$label: expected HTTP $expected; received ".$response->getStatusCode());
        $kernel->terminate($request, $response);
        echo 'PASS: '.$label.PHP_EOL;
        return $body;
    };
    $password = bin2hex(random_bytes(12));
    User::create(['name' => 'Fictional defense administrator', 'email' => 'defense-admin@example.test', 'password' => $password, 'role' => 'admin']);
    $program = DB::table('academic_programs')->insertGetId(['name' => 'Fictional defense program', 'code' => 'DEFENSE-TEST', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]);
    DB::table('admission_periods')->insert(['name' => 'Fictional defense period', 'academic_year' => '2026-2027', 'status' => 'open', 'start_date' => now()->subDay()->toDateString(), 'end_date' => now()->addDay()->toDateString(), 'created_at' => now(), 'updated_at' => now()]);
    $scholarship = App\Models\Scholarship::create(['name' => 'Fictional defense scholarship', 'category' => 'other', 'requires_online_exam' => true, 'requires_face_to_face_exam' => false, 'is_active' => true, 'admission_approval_required' => true]);
    App\Models\OnlineExamSetting::create(['id' => 1, 'seconds_per_question' => 15]);
    for ($index = 1; $index <= 100; $index++) {
        $question = OnlineExamQuestion::create(['question' => 'Fictional rehearsal question '.$index, 'is_active' => true, 'source' => 'defense_rehearsal']);
        $question->options()->create(['text' => 'Fictional correct choice', 'is_correct' => true, 'position' => 1]);
        $question->options()->create(['text' => 'Fictional other choice', 'is_correct' => false, 'position' => 2]);
    }

    $admin = $call('Administrator login', 'POST', '/api/auth/login', ['email' => 'defense-admin@example.test', 'password' => $password], null, 200)['token'];
    $call('Administrator configures a required admission document', 'POST', '/api/admin/requirements', ['name' => 'Fictional academic record', 'is_required' => true, 'is_active' => true, 'program_ids' => [$program]], $admin, 201);
    $scheduledExam = $call('Administrator creates scheduled entrance examination', 'POST', '/api/admin/exams', ['title' => 'Fictional document-clearance examination', 'exam_date' => now()->addDay()->toDateString(), 'start_time' => '09:00', 'end_time' => '10:00', 'venue' => 'Fictional test room', 'is_active' => true], $admin, 201)['data']['id'];
    $locations = $call('Public Philippine city lookup', 'GET', '/api/locations/countries/PH/cities?province_id=0701200000', [], null, 200);
    $assert(count($locations['data']) === 48 && collect($locations['data'])->contains('id', '0701244000'), 'Bohol lookup must contain its 48 cities/municipalities including Trinidad');
    $registration = $call('Applicant registration with selected address', 'POST', '/api/auth/register', ['student_type' => 'new', 'lrn' => '123456789012', 'previous_school' => 'Fictional School', 'first_name' => 'Fictional', 'last_name' => 'Defense Applicant', 'birth_date' => '2006-01-01', 'gender' => 'Female', 'phone' => '09123456789', 'address_components' => ['country_code' => 'PH', 'province_id' => '0701200000', 'city_id' => '0701244000', 'street' => 'Fictional test address'], 'email' => 'defense-applicant@example.test', 'password' => $password, 'password_confirmation' => $password], null, 201, ['school_id' => UploadedFile::fake()->createWithContent('id.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3ioAAAAASUVORK5CYII='))]);
    $assert($registration['user']['applicant']['address'] === 'Fictional test address, Trinidad, Bohol, Philippines', 'Selected address must be stored using canonical location names');
    $applicant = $registration['token'];
    $call('Unverified account may browse programs', 'GET', '/api/applicant/programs', [], $applicant, 200);
    $call('Unverified admission submission blocked', 'POST', '/api/applicant/admissions', ['academic_program_id' => $program], $applicant, 403);
    $call('Unverified scholarship submission blocked', 'POST', '/api/applicant/scholarships/'.$scholarship->id.'/apply', [], $applicant, 403);
    $call('Email code sent to isolated notification fake', 'POST', '/api/auth/email-verification/send', [], $applicant, 200);
    $fixtureUser = User::findOrFail($registration['user']['id']);
    $code = Illuminate\Support\Facades\Notification::sent($fixtureUser, App\Notifications\EmailVerificationCodeNotification::class)->last()->code;
    $call('Email code verified', 'POST', '/api/auth/email-verification/verify', ['code' => $code], $applicant, 200);
    $identityId = App\Models\StudentVerification::where('applicant_id', $registration['user']['applicant']['id'])->value('id');
    $call('Administrator verifies school identity', 'PUT', '/api/admin/student-verifications/'.$identityId, ['status' => 'verified', 'revision' => 1, 'identity_checked' => true], $admin, 200);
    $call('Applicant login', 'POST', '/api/auth/login', ['email' => 'defense-applicant@example.test', 'password' => $password], null, 200);
    $staffResult = $call('Administrator creates staff without Position', 'POST', '/api/admin/staff', ['name' => 'Fictional defense staff', 'first_name' => 'Fictional', 'last_name' => 'Staff', 'email' => 'defense-staff@example.test', 'employee_id' => 'DEFENSE-STAFF', 'staff_role' => 'Admission Staff', 'password' => $password, 'program_ids' => [$program]], $admin, 201);
    $call('Administrator assigns staff permissions', 'PUT', '/api/admin/staff/'.$staffResult['data']['id'], ['verify_documents' => true, 'manage_admissions' => true, 'manage_scholarships' => true, 'program_ids' => [$program]], $admin, 200);
    $staff = $call('Staff login', 'POST', '/api/auth/login', ['email' => 'defense-staff@example.test', 'password' => $password], null, 200)['token'];
    $call('Anonymous access rejected', 'GET', '/api/applicant/admissions', [], null, 401);
    $admission = $call('Applicant submits admission', 'POST', '/api/applicant/admissions', ['academic_program_id' => $program], $applicant, 201)['data']['id'];
    $call('Duplicate admission rejected', 'POST', '/api/applicant/admissions', ['academic_program_id' => $program], $applicant, 409);
    $applicantId = $registration['user']['applicant']['id'];
    $candidates = $call('Missing documents exclude entrance-exam candidates', 'GET', '/api/admin/exams/'.$scheduledExam.'/candidates', [], $admin, 200);
    $assert($candidates['total'] === 0, 'Missing required document must block candidate listing');
    $call('Missing documents block entrance-exam assignment', 'POST', '/api/admin/exams/'.$scheduledExam.'/assignments', ['applicant_ids' => [$applicantId]], $admin, 422);
    $doc = $call('Applicant uploads admission document', 'POST', '/api/applicant/documents', ['admission_application_id' => $admission, 'document_name' => 'Fictional academic record'], $applicant, 201, ['document' => UploadedFile::fake()->create('record.pdf', 30, 'application/pdf')])['data']['id'];
    $call('Assigned staff rejects document with feedback', 'PUT', '/api/staff/documents/'.$doc, ['status' => 'rejected', 'remarks' => 'Fictional rehearsal: provide a clearer copy.'], $staff, 200);
    $call('Applicant re-uploads rejected document', 'POST', '/api/applicant/documents/'.$doc.'/replace', [], $applicant, 200, ['document' => UploadedFile::fake()->create('clear-record.pdf', 30, 'application/pdf')]);
    $call('Assigned staff verifies corrected document', 'PUT', '/api/staff/documents/'.$doc, ['status' => 'verified', 'remarks' => 'Fictional rehearsal: readable.'], $staff, 200);
    $call('Verified required documents allow entrance-exam assignment', 'POST', '/api/admin/exams/'.$scheduledExam.'/assignments', ['applicant_ids' => [$applicantId]], $admin, 201);
    $call('Verified document deletion rejected', 'DELETE', '/api/applicant/documents/'.$doc, [], $applicant, 422);
    $call('Administrator approves admission', 'PUT', '/api/admin/admission-applications/'.$admission.'/approve', [], $admin, 200);
    $application = $call('Applicant submits structured scholarship form and attachment', 'POST', '/api/applicant/scholarships/'.$scholarship->id.'/apply', ['application_details' => ['academic_average' => '92.5', 'grading_scale' => 'percentage', 'year_level' => '1st Year', 'income_range' => 'under_100000', 'household_size' => '4', 'motivation' => 'Fictional scholarship defense rehearsal.', 'additional_notes' => 'No real applicant information.']], $applicant, 201, ['supporting_document' => UploadedFile::fake()->create('scholarship-record.pdf', 30, 'application/pdf')])['data']['id'];
    $call('Assigned staff reviews scholarship', 'GET', '/api/staff/scholarship-applications/'.$application, [], $staff, 200);
    $call('Administrator approves examination eligibility', 'PUT', '/api/admin/scholarship-applications/'.$application, ['status' => 'approved', 'remarks' => 'Fictional rehearsal approval, not a final award.'], $admin, 200);
    $call('Staff returns required document to review', 'PUT', '/api/staff/documents/'.$doc, ['status' => 'pending', 'remarks' => 'Fictional recheck of document clearance.'], $staff, 200);
    $blocked = $call('Document review blocks online-exam eligibility', 'GET', '/api/applicant/online-exam', [], $applicant, 200);
    $assert($blocked['data']['eligible'] === false, 'Pending document must block online-exam eligibility');
    $call('Pending document blocks online-exam start despite application approvals', 'POST', '/api/applicant/online-exam/start', [], $applicant, 403);
    $scheduled = $call('Existing entrance-exam assignment shows document warning', 'GET', '/api/applicant/exams', [], $applicant, 200);
    $assert($scheduled['data'][0]['documents_verified'] === false, 'Existing schedule must show incomplete verification');
    $call('Staff verifies required document again', 'PUT', '/api/staff/documents/'.$doc, ['status' => 'verified', 'remarks' => 'Fictional verification complete.'], $staff, 200);
    $eligibility = $call('Applicant examination eligibility', 'GET', '/api/applicant/online-exam', [], $applicant, 200);
    $assert($eligibility['data']['eligible'] === true, 'Approved applicant should be eligible');
    $start = $call('Applicant starts online examination', 'POST', '/api/applicant/online-exam/start', [], $applicant, 201);
    $attempt = $start['data']['id'];
    $order = DB::table('online_exam_attempt_questions')->where('online_exam_attempt_id', $attempt)->orderBy('position')->pluck('online_exam_question_id')->all();
    $assert(count($order) === 100 && count(array_unique($order)) === 100, 'Attempt must have exactly 100 distinct questions');
    $questions = $call('Applicant loads current question', 'GET', '/api/applicant/online-exam/attempts/'.$attempt.'/questions', [], $applicant, 200);
    $question = $questions['data']['questions'][0];
    foreach ($question['options'] as $option) $assert(!array_key_exists('is_correct', $option), 'Applicant must not receive answer keys');
    $correct = OnlineExamOption::where('online_exam_question_id', $question['id'])->where('is_correct', true)->value('id');
    $call('Applicant saves answer', 'POST', '/api/applicant/online-exam/attempts/'.$attempt.'/answers', ['question_id' => $question['id'], 'option_id' => $correct, 'expected_revision' => $questions['data']['attempt']['navigation_revision']], $applicant, 200);
    $resumed = $call('Refresh preserves answer and question order', 'GET', '/api/applicant/online-exam/attempts/'.$attempt.'/questions', [], $applicant, 200);
    $assert((int) $resumed['data']['questions'][0]['selected_option_id'] === (int) $correct, 'Saved answer must survive refresh');
    $assert($order === DB::table('online_exam_attempt_questions')->where('online_exam_attempt_id', $attempt)->orderBy('position')->pluck('online_exam_question_id')->all(), 'Question order changed');
    $call('Applicant submits examination early with unanswered questions', 'POST', '/api/applicant/online-exam/attempts/'.$attempt.'/submit', [], $applicant, 200);
    $unreleased = $call('Applicant receives only unreleased status before official release', 'GET', '/api/applicant/online-exam/attempts/'.$attempt.'/result', [], $applicant, 200);
    $assert($unreleased['data']['released'] === false && $unreleased['data']['score'] === null && $unreleased['data']['remarks'] === null && $unreleased['data']['passed'] === null, 'Unreleased grading information must stay hidden');
    $call('Administrator officially releases result', 'POST', '/api/admin/online-exams/attempts/'.$attempt.'/release', [], $admin, 200);
    $result = $call('Applicant views officially released result', 'GET', '/api/applicant/online-exam/attempts/'.$attempt.'/result', [], $applicant, 200);
    $assert((float) $result['data']['score'] === 1.0 && (int) $result['data']['answered_count'] === 1, 'Server scoring mismatch');
    $notices = $call('Applicant receives in-app notifications', 'GET', '/api/applicant/notifications', [], $applicant, 200);
    $assert(count($notices['data']) > 0, 'Expected workflow notifications');
    $assert(App\Models\ScholarshipApplication::findOrFail($application)->award_status === 'undecided', 'Exam completion must not award a scholarship');
    $call('Administrator explicitly authorizes a retake', 'POST', '/api/admin/online-exams/retake-grants', ['applicant_id' => OnlineExamAttempt::findOrFail($attempt)->applicant_id, 'reason' => 'Fictional defense rehearsal authorization'], $admin, 201);
    $second = $call('Applicant uses authorized retake', 'POST', '/api/applicant/online-exam/start', [], $applicant, 201)['data']['id'];
    Illuminate\Support\Carbon::setTestNow(OnlineExamAttempt::findOrFail($second)->expires_at->copy()->addSecond());
    $call('Server expires overdue attempt on next access', 'GET', '/api/applicant/online-exam', [], $applicant, 200);
    $assert(OnlineExamAttempt::findOrFail($second)->status === 'expired', 'Server must enforce expiration');
    Illuminate\Support\Carbon::setTestNow();
    echo "PASS: full API sequence completed using isolated fictional records; no messages sent to external recipients.\n";
} catch (Throwable $error) {
    fwrite(STDERR, 'FAIL at '.$stage.': '.$error::class.'; inspect the private server log.'.PHP_EOL);
    report($error); $failed = true;
} finally {
    Illuminate\Support\Carbon::setTestNow();
    DB::disconnect('defense_rehearsal');
    if ($created && preg_match('/^edupath_defense_[a-f0-9]{12}$/', $database) && $database !== $sourceConfig['database']) $source->statement('DROP DATABASE '.$quote($database));
    $resolved = realpath($directory);
    $testingRoot = realpath(storage_path('framework/testing'));
    if ($resolved && $testingRoot && str_starts_with($resolved, $testingRoot.DIRECTORY_SEPARATOR) && preg_match('/^edupath_defense_[a-f0-9]{12}$/', basename($resolved))) {
        Illuminate\Support\Facades\File::deleteDirectory($resolved);
    }
}
exit($failed ? 1 : 0);
