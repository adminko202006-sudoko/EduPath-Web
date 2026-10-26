<?php
// Read-only deployment check. Never print credentials, email addresses, LRNs or file paths.
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$mailer = config('mail.default');
$config = config('mail.mailers.'.$mailer, []);
$counts = [];
foreach (['users', 'applicants', 'admission_applications', 'scholarship_applications'] as $table) {
    $counts[$table] = Illuminate\Support\Facades\DB::table($table)->count();
}
$duplicateLrns = Illuminate\Support\Facades\DB::table('applicants')->select('lrn')->whereNotNull('lrn')->where('lrn', '<>', '')->groupBy('lrn')->havingRaw('COUNT(*) > 1')->get()->count();
echo json_encode([
    'verification_tables_present' => Illuminate\Support\Facades\Schema::hasTable('student_verifications'),
    'mailer' => $mailer, 'transport' => $config['transport'] ?? null,
    'smtp_host_configured' => !empty($config['host']), 'smtp_credentials_configured' => !empty($config['username']) && !empty($config['password']),
    'sender_configured' => !empty(config('mail.from.address')),
    'email_delivery_tested' => false, 'existing_duplicate_lrn_groups' => $duplicateLrns, 'preserved_record_counts' => $counts,
    'upload_max_filesize' => ini_get('upload_max_filesize'), 'post_max_size' => ini_get('post_max_size'),
], JSON_PRETTY_PRINT).PHP_EOL;
