<?php

namespace Tests\Feature;

use App\Models\Applicant;
use App\Models\AcademicProgram;
use App\Models\Scholarship;
use App\Models\StudentVerification;
use App\Models\User;
use App\Notifications\EmailVerificationCodeNotification;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StudentVerificationTest extends TestCase
{
    use \Tests\Support\InstallsStudentVerificationSchema;
    use \Tests\Support\InstallsWorkflowSchema;

    private User $admin;
    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:', 'database.connections.sqlite.foreign_key_constraints' => true,
            'cache.default' => 'array', 'onboarding.enroll_new_applicants' => false]);
        DB::purge('sqlite'); DB::setDefaultConnection('sqlite');
        foreach (['0001_01_01_000000_create_users_table.php', '2026_09_17_084524_add_staff_role_to_users_table.php', '2026_08_25_091343_create_applicants_table.php',
            '2026_08_25_091344_create_academic_programs_table.php', '2026_08_25_154002_create_personal_access_tokens_table.php',
            '2026_08_25_091345_create_admission_applications_table.php', '2026_09_12_093340_create_admission_periods_table.php',
            '2026_09_23_111550_add_admission_period_id_to_admission_applications_table.php',
            '2026_09_23_144234_create_admission_application_histories_table.php',
            '2026_08_25_091351_create_notifications_table.php', '2026_10_18_000001_add_educational_background_to_applicants_table.php'] as $migration) {
            (require database_path('migrations/'.$migration))->up();
        }
        Schema::create('scholarships', function (Blueprint $t) {
            $t->id(); $t->string('name'); $t->string('category')->default('other'); $t->boolean('is_active')->default(true);
            $t->boolean('admission_approval_required')->default(true); $t->date('application_start')->nullable(); $t->date('application_end')->nullable(); $t->timestamps();
        });
        (require database_path('migrations/2026_08_25_091348_create_scholarship_applications_table.php'))->up();
        $this->installStudentVerificationSchema();
        $this->installWorkflowSchema();
        Storage::fake('local'); Storage::fake('public'); Notification::fake();
        $this->admin = User::create(['name' => 'Admin', 'email' => 'admin@example.test', 'password' => 'password-test', 'role' => 'admin']);
        AcademicProgram::create(['name' => 'Test Program', 'code' => 'TP', 'is_active' => true]);
        DB::table('admission_periods')->insert(['name' => 'Test Period', 'start_date' => now()->subDay()->toDateString(), 'end_date' => now()->addDay()->toDateString(), 'status' => 'open']);
    }

    private function signup(array $overrides = []): array
    {
        return array_merge($this->studentIdentityInput(), ['first_name' => 'Student', 'last_name' => 'Tester', 'birth_date' => '2006-01-01',
            'gender' => 'Female', 'phone' => '09123456789', 'email' => 'student@example.test', 'password' => 'password-test', 'password_confirmation' => 'password-test'], $overrides);
    }

    private function register(array $overrides = []): User
    {
        $response = $this->postJson('/api/auth/register', $this->signup($overrides))->assertCreated()->assertJsonMissingPath('user.password');
        return User::findOrFail($response->json('user.id'));
    }

    private function identity(User $user): StudentVerification { return StudentVerification::where('applicant_id', $user->applicant->id)->firstOrFail(); }

    private function approve(User $user, array $extra = []): void
    {
        $record = $this->identity($user);
        $this->actingAs($this->admin)->putJson('/api/admin/student-verifications/'.$record->id, array_merge([
            'status' => 'verified', 'revision' => $record->revision, 'identity_checked' => true,
        ], $extra))->assertOk();
    }

    private function emailCode(User $user): string
    {
        $this->actingAs($user)->postJson('/api/auth/email-verification/send')->assertOk()->assertJsonMissingPath('code');
        return Notification::sent($user, EmailVerificationCodeNotification::class)->last()->code;
    }

    public function test_new_student_browses_but_both_checks_are_required_to_apply(): void
    {
        $user = $this->register(['role' => 'admin', 'email_verified_at' => now(), 'status' => 'verified']);
        $this->assertSame('applicant', $user->role); $this->assertNull($user->email_verified_at);
        $this->actingAs($user)->getJson('/api/applicant/programs')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/applicant/verification')->assertOk()->assertJsonPath('data.can_apply', false)->assertJsonMissingPath('data.identity.school_id_path');
        $this->postJson('/api/applicant/admissions', ['academic_program_id' => 1])->assertForbidden();
        $code = $this->emailCode($user);
        $this->postJson('/api/auth/email-verification/verify', ['code' => $code])->assertOk();
        $this->postJson('/api/applicant/admissions', ['academic_program_id' => 1])->assertForbidden();
        $this->approve($user);
        $this->actingAs($user->fresh())->getJson('/api/applicant/verification')->assertOk()->assertJsonPath('data.can_apply_admission', true);
        $this->postJson('/api/applicant/admissions', ['academic_program_id' => 1])->assertCreated();
        $this->postJson('/api/applicant/admissions', ['academic_program_id' => 1])->assertConflict();
        $this->assertDatabaseCount('admission_applications', 1);
    }

    public function test_old_student_needs_tmc_number_and_admin_confirmed_program_and_can_apply_for_scholarship(): void
    {
        $this->postJson('/api/auth/register', $this->signup(['student_type' => 'old']))->assertUnprocessable()->assertJsonValidationErrors('tmc_student_number');
        $user = $this->register(['student_type' => 'old', 'tmc_student_number' => ' 2024-123 ']);
        $record = $this->identity($user); $this->assertSame('2024123', $record->tmc_student_number);
        $this->actingAs($this->admin)->putJson('/api/admin/student-verifications/'.$record->id, ['status' => 'verified', 'revision' => 1, 'identity_checked' => true])->assertUnprocessable();
        $this->approve($user, ['academic_program_id' => 1]);
        $code = $this->emailCode($user); $this->postJson('/api/auth/email-verification/verify', ['code' => $code])->assertOk();
        AcademicProgram::create(['name' => 'Other Program', 'code' => 'OTHER', 'is_active' => true]);
        $this->actingAs($user->fresh())->getJson('/api/applicant/programs')->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', 1);
        $this->getJson('/api/applicant/verification')->assertJsonPath('data.can_apply_admission', false)->assertJsonPath('data.scholarship_admission_satisfied', true);
        $this->postJson('/api/applicant/admissions', ['academic_program_id' => 2])->assertForbidden();
        $scholarship = Scholarship::create(['name' => 'Test Aid', 'is_active' => true, 'admission_approval_required' => true]);
        $this->postJson('/api/applicant/scholarships/'.$scholarship->id.'/apply')->assertCreated();
        $this->assertDatabaseCount('admission_applications', 0);
        $this->assertDatabaseCount('scholarship_applications', 1);
    }

    public function test_duplicate_lrn_and_normalized_tmc_number_cannot_create_another_account(): void
    {
        $this->register(['student_type' => 'old', 'tmc_student_number' => 'TMC-42']);
        $this->postJson('/api/auth/register', $this->signup(['email' => 'different@example.test']))->assertUnprocessable()->assertJsonValidationErrors('lrn');
        $this->postJson('/api/auth/register', $this->signup(['email' => 'different@example.test', 'lrn' => '111111111111', 'student_type' => 'old', 'tmc_student_number' => 'tmc 42']))->assertUnprocessable()->assertJsonValidationErrors('tmc_student_number');
        $this->assertDatabaseCount('users', 2); $this->assertDatabaseCount('student_verifications', 1);
        $this->assertCount(1, Storage::disk('local')->allFiles('student-identities'));
    }

    public function test_philippines_address_image_and_student_type_are_required(): void
    {
        $input = $this->signup(); $input['address_components']['country_code'] = 'US';
        $this->postJson('/api/auth/register', $input)->assertUnprocessable()->assertJsonValidationErrors('address_components.country_code');
        $input = $this->signup(); unset($input['school_id']);
        $this->postJson('/api/auth/register', $input)->assertUnprocessable()->assertJsonValidationErrors('school_id');
        $this->postJson('/api/auth/register', $this->signup(['student_type' => 'admin', 'school_id' => UploadedFile::fake()->create('script.jpg', 1, 'text/plain')]))
            ->assertUnprocessable()->assertJsonValidationErrors(['student_type', 'school_id']);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_school_id_files_and_reviews_are_protected_across_roles(): void
    {
        $owner = $this->register(); $id = $this->identity($owner)->id;
        $other = $this->register(['email' => 'other@example.test', 'lrn' => '111111111111']);
        $this->actingAs($other)->getJson('/api/admin/student-verifications/'.$id.'/file')->assertForbidden();
        $this->putJson('/api/admin/student-verifications/'.$id, ['status' => 'verified', 'revision' => 1, 'identity_checked' => true])->assertForbidden();
        $this->actingAs($owner)->get('/api/applicant/verification/file')->assertOk()->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->actingAs($this->admin)->get('/api/admin/student-verifications/'.$id.'/file')->assertOk();
        $this->getJson('/api/admin/student-verifications')->assertOk()->assertJsonMissingPath('data.0.school_id_path');
        $staff = User::create(['name' => 'Staff', 'email' => 'staff@example.test', 'password' => 'password-test', 'role' => 'staff']);
        $this->actingAs($staff)->getJson('/api/admin/student-verifications')->assertForbidden();
        $this->putJson('/api/admin/student-verifications/'.$id, ['status' => 'verified', 'revision' => 1, 'identity_checked' => true])->assertForbidden();
    }

    public function test_rejection_resubmission_and_revision_checks_preserve_history_and_id(): void
    {
        $user = $this->register(['student_type' => 'transferee', 'previous_school' => 'Previous College']);
        $record = $this->identity($user); $originalPath = $record->school_id_path;
        $this->actingAs($this->admin)->putJson('/api/admin/student-verifications/'.$record->id, ['status' => 'rejected', 'revision' => 1, 'identity_checked' => true, 'feedback' => 'Please provide a clearer image.'])->assertOk();
        $this->putJson('/api/admin/student-verifications/'.$record->id, ['status' => 'verified', 'revision' => 1, 'identity_checked' => true])->assertConflict();
        $this->actingAs($user)->postJson('/api/applicant/verification', $this->studentIdentityInput())->assertCreated();
        $this->assertSame(3, $record->fresh()->revision);
        $this->assertDatabaseCount('student_verification_events', 3);
        Storage::disk('local')->assertExists($originalPath);
        $this->postJson('/api/applicant/verification', $this->studentIdentityInput())->assertConflict();
        $this->assertCount(2, Storage::disk('local')->allFiles('student-identities'));
    }

    public function test_email_codes_are_hashed_rate_limited_expiring_and_bound_to_the_current_account(): void
    {
        $user = $this->register(); $code = $this->emailCode($user);
        $row = DB::table('email_verification_codes')->first();
        $this->assertNotSame($code, $row->code_hash); $this->assertTrue(Hash::check($code, $row->code_hash));
        $this->postJson('/api/auth/email-verification/send')->assertStatus(429);
        for ($i = 0; $i < 5; $i++) $this->postJson('/api/auth/email-verification/verify', ['code' => '000000'])->assertUnprocessable();
        $this->postJson('/api/auth/email-verification/verify', ['code' => $code])->assertUnprocessable();
        $this->assertSame(5, DB::table('email_verification_codes')->value('attempts'));
        $this->travel(61)->seconds(); $freshCode = $this->emailCode($user);
        $this->travel(11)->minutes(); $this->postJson('/api/auth/email-verification/verify', ['code' => $freshCode])->assertUnprocessable();
        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_email_delivery_failure_does_not_claim_success_or_leave_a_new_challenge(): void
    {
        $user = $this->register();
        Notification::shouldReceive('send')->once()->andThrow(new \RuntimeException('Transport unavailable'));
        $this->actingAs($user)->postJson('/api/auth/email-verification/send')->assertStatus(500);
        $this->assertDatabaseCount('email_verification_codes', 0); $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_verified_identity_cannot_be_changed_through_profile_and_revocation_blocks_applications(): void
    {
        $user = $this->register(); $code = $this->emailCode($user);
        $this->postJson('/api/auth/email-verification/verify', ['code' => $code])->assertOk(); $this->approve($user);
        $this->actingAs($user)->putJson('/api/applicant/profile', ['first_name' => 'Another Person'])->assertUnprocessable()->assertJsonValidationErrors('first_name');
        $this->putJson('/api/applicant/profile', ['lrn' => '000000000000'])->assertUnprocessable()->assertJsonValidationErrors('lrn');
        $record = $this->identity($user);
        $this->actingAs($this->admin)->putJson('/api/admin/student-verifications/'.$record->id, ['status' => 'rejected', 'revision' => $record->revision, 'identity_checked' => true, 'feedback' => 'Identity correction required.'])->assertOk();
        $this->actingAs($user)->postJson('/api/applicant/admissions', ['academic_program_id' => 1])->assertForbidden();
        $this->assertDatabaseCount('notifications', 2);
    }

    public function test_transferee_can_choose_a_program_after_verification_but_needs_admission_approval_for_scholarship(): void
    {
        $user = $this->register(['student_type' => 'transferee', 'previous_school' => 'Previous College']);
        $this->approve($user);
        $scholarship = Scholarship::create(['name' => 'Transfer Aid', 'is_active' => true, 'admission_approval_required' => true]);
        $this->actingAs($user)->postJson('/api/applicant/scholarships/'.$scholarship->id.'/apply')->assertForbidden();
        $code = $this->emailCode($user);
        $this->postJson('/api/auth/email-verification/verify', ['code' => $code])->assertOk();
        $this->actingAs($user->fresh())->postJson('/api/applicant/admissions', ['academic_program_id' => 1])->assertCreated();
        $this->postJson('/api/applicant/scholarships/'.$scholarship->id.'/apply')->assertForbidden();
        $this->assertDatabaseCount('scholarship_applications', 0);
    }

    public function test_email_code_cannot_verify_another_account_and_consumed_challenge_is_removed(): void
    {
        $this->postJson('/api/auth/email-verification/send')->assertUnauthorized();
        $this->getJson('/api/admin/student-verifications')->assertUnauthorized();
        $this->getJson('/api/applicant/verification/file')->assertUnauthorized();
        $user = $this->register();
        $other = $this->register(['email' => 'other@example.test', 'lrn' => '111111111111']);
        $code = $this->emailCode($user);
        $this->actingAs($other)->postJson('/api/auth/email-verification/verify', ['code' => $code, 'user_id' => $user->id, 'email' => $user->email])->assertUnprocessable();
        $this->assertNull($other->fresh()->email_verified_at);
        $this->actingAs($user)->postJson('/api/auth/email-verification/verify', ['code' => $code])->assertOk();
        $this->assertDatabaseCount('email_verification_codes', 0);
    }

    public function test_admin_can_correct_a_mistyped_lrn_with_a_reason_and_a_preserved_audit_trail(): void
    {
        $user = $this->register(); $record = $this->identity($user);
        $this->actingAs($this->admin)->putJson('/api/admin/student-verifications/'.$record->id, ['status' => 'verified', 'revision' => 1, 'identity_checked' => true, 'lrn' => '999999999999'])->assertUnprocessable();
        $this->approve($user, ['lrn' => '999999999999', 'feedback' => 'Corrected from the official school record.']);
        $this->assertSame('999999999999', $record->fresh()->lrn);
        $this->assertSame('999999999999', $user->applicant->fresh()->lrn);
        $original = json_decode(DB::table('student_verification_events')->orderBy('id')->value('snapshot'), true);
        $this->assertSame('123456789012', $original['lrn']);
        $this->getJson('/api/admin/student-verifications/'.$record->id.'/history')->assertOk()->assertJsonMissingPath('data.0.snapshot.school_id_path');
    }

    public function test_database_unique_index_rejects_an_identity_collision_even_without_request_validation(): void
    {
        $first = $this->register();
        $second = $this->register(['email' => 'other@example.test', 'lrn' => '111111111111']);
        try {
            DB::table('student_verifications')->where('applicant_id', $second->applicant->id)->update(['lrn' => $this->identity($first)->lrn]);
            $this->fail('Database accepted a duplicate LRN.');
        } catch (\Illuminate\Database\UniqueConstraintViolationException $expected) {
            $this->assertSame('111111111111', $this->identity($second)->lrn);
        }
        $this->assertDatabaseCount('student_verifications', 2);
    }
}
