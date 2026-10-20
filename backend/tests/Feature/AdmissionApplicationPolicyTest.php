<?php

namespace Tests\Feature;

use App\Models\Applicant;
use App\Models\User;
use App\Models\AdmissionApplication;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AdmissionApplicationPolicyTest extends TestCase
{
    use \Tests\Support\InstallsWorkflowSchema;
    protected User $applicantUser;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => ':memory:',
            'database.connections.sqlite.foreign_key_constraints' => false,
        ]);
        DB::purge('sqlite');
        DB::setDefaultConnection('sqlite');

        $this->createSchema();
        $this->installWorkflowSchema();
        $this->createApplicantAndAdmissionPeriod();
    }

    public function test_duplicate_submission_is_rejected_without_duplicate_records_or_history(): void
    {
        $payload = ['academic_program_id' => 1, 'remarks' => 'Mobile application'];

        $this->actingAs($this->applicantUser)
            ->postJson('/api/applicant/admissions', $payload)
            ->assertCreated()
            ->assertJsonPath('success', true);

        $this->actingAs($this->applicantUser)
            ->postJson('/api/applicant/admissions', $payload)
            ->assertConflict()
            ->assertJsonPath('code', 'ADMISSION_APPLICATION_EXISTS');

        $this->assertDatabaseCount('admission_applications', 1);
        $this->assertDatabaseCount('admission_application_histories', 1);
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('activeStatuses')]
    public function test_active_admission_blocks_both_admin_and_applicant_submissions_even_for_another_program(string $status): void
    {
        $this->createAdmissionApplicationRecord($status);
        DB::table('academic_programs')->insert(['id' => 2, 'name' => 'Another Program', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]);
        $this->actingAs($this->applicantUser)->postJson('/api/applicant/admissions', ['academic_program_id' => 2])->assertConflict();
        $admin = User::create(['name' => 'Admin', 'email' => 'duplicate-admin@example.test', 'password' => 'test-password', 'role' => 'admin']);
        $this->actingAs($admin)->postJson('/api/admin/admission-applications', ['applicant_id' => $this->applicantUser->applicant->id, 'academic_program_id' => 2])->assertConflict();
        $this->assertDatabaseCount('admission_applications', 1);
        $this->assertDatabaseCount('admission_application_histories', 0);
    }

    public static function activeStatuses(): array
    {
        return [['pending'], ['under_review'], ['approved']];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('inactiveStatuses')]
    public function test_rejected_or_withdrawn_admission_allows_resubmission_without_removing_history(string $status): void
    {
        $id = $this->createAdmissionApplicationRecord($status);
        $this->actingAs($this->applicantUser)->postJson('/api/applicant/admissions', ['academic_program_id' => 1])->assertCreated();
        $this->assertDatabaseHas('admission_applications', ['id' => $id, 'status' => $status]);
        $this->assertDatabaseCount('admission_applications', 2);
        $this->assertDatabaseCount('admission_application_histories', 1);
    }

    public static function inactiveStatuses(): array
    {
        return [['rejected'], ['withdrawn']];
    }

    public function test_an_approved_admission_in_a_previous_period_does_not_block_the_current_period(): void
    {
        $id = $this->createAdmissionApplicationRecord('approved');
        DB::table('admission_applications')->where('id', $id)->update(['admission_period_id' => 99]);
        $this->actingAs($this->applicantUser)->postJson('/api/applicant/admissions', ['academic_program_id' => 1])->assertCreated();
        $this->assertDatabaseCount('admission_applications', 2);
    }

    public function test_closed_period_and_inactive_program_fail_without_creating_records(): void
    {
        DB::table('academic_programs')->where('id', 1)->update(['is_active' => false]);
        $this->actingAs($this->applicantUser)->postJson('/api/applicant/admissions', ['academic_program_id' => 1])->assertUnprocessable();
        DB::table('academic_programs')->where('id', 1)->update(['is_active' => true]);
        DB::table('admission_periods')->where('id', 1)->update(['status' => 'closed']);
        $this->postJson('/api/applicant/admissions', ['academic_program_id' => 1])->assertUnprocessable();
        $this->assertDatabaseCount('admission_applications', 0);
        $this->assertDatabaseCount('admission_application_histories', 0);
    }

    public function test_applicant_accounts_without_a_profile_fail_closed_for_every_admission_operation(): void
    {
        $id = $this->createAdmissionApplicationRecord('pending');
        $orphan = User::create(['name' => 'Incomplete account', 'email' => 'no-profile@example.test', 'password' => 'test-password', 'role' => 'applicant']);
        $this->actingAs($orphan)->getJson('/api/applicant/admissions')->assertForbidden();
        $this->postJson('/api/applicant/admissions', ['academic_program_id' => 1])->assertForbidden();
        $this->getJson("/api/applicant/admissions/{$id}")->assertForbidden();
        $this->deleteJson("/api/applicant/admissions/{$id}")->assertForbidden();
        $this->assertDatabaseCount('admission_applications', 1);
        $this->assertDatabaseCount('admission_application_histories', 0);
    }

    public function test_failed_submission_history_rolls_back_application_creation(): void
    {
        $event = 'eloquent.creating: '.\App\Models\AdmissionApplicationHistory::class;
        \Illuminate\Support\Facades\Event::listen($event, fn () => throw new \RuntimeException('Simulated submission history failure'));
        try {
            $this->actingAs($this->applicantUser)->postJson('/api/applicant/admissions', ['academic_program_id' => 1])->assertStatus(500);
        } finally {
            \Illuminate\Support\Facades\Event::forget($event);
        }
        $this->assertDatabaseCount('admission_applications', 0);
        $this->assertDatabaseCount('admission_application_histories', 0);
    }

    public function test_reopening_a_rejected_application_cannot_bypass_a_new_active_submission(): void
    {
        $rejected = $this->createAdmissionApplicationRecord('rejected');
        $this->createAdmissionApplicationRecord('pending');
        $admin = User::create(['name' => 'Admin', 'email' => 'reopen-admin@example.test', 'password' => 'test-password', 'role' => 'admin']);
        $this->actingAs($admin)->putJson("/api/admin/admission-applications/{$rejected}/approve")->assertConflict();
        $this->assertDatabaseHas('admission_applications', ['id' => $rejected, 'status' => 'rejected']);
        $this->assertDatabaseCount('admission_application_histories', 0);
    }

    public function test_applicant_can_withdraw_a_pending_application_without_deleting_records(): void
    {
        $applicationId = $this->createAdmissionApplicationRecord('pending');
        DB::table('application_documents')->insert([
            'admission_application_id' => $applicationId,
            'document_name' => 'Birth Certificate',
            'file_path' => 'private/test/birth-certificate.pdf',
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('admission_application_histories')->insert([
            'admission_application_id' => $applicationId,
            'user_id' => $this->applicantUser->id,
            'action' => 'submitted',
            'old_status' => null,
            'new_status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($this->applicantUser)
            ->deleteJson("/api/applicant/admissions/{$applicationId}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'withdrawn');

        $this->assertDatabaseHas('admission_applications', [
            'id' => $applicationId,
            'status' => 'withdrawn',
        ]);
        $this->assertDatabaseHas('application_documents', [
            'admission_application_id' => $applicationId,
            'file_path' => 'private/test/birth-certificate.pdf',
        ]);
        $this->assertDatabaseHas('admission_application_histories', [
            'admission_application_id' => $applicationId,
            'action' => 'withdrawn',
            'old_status' => 'pending',
            'new_status' => 'withdrawn',
        ]);
        $this->assertDatabaseCount('admission_application_histories', 2);
    }

    public function test_applicant_cannot_withdraw_an_application_after_review_has_started(): void
    {
        $applicationId = $this->createAdmissionApplicationRecord('under_review');

        $this->actingAs($this->applicantUser)
            ->deleteJson("/api/applicant/admissions/{$applicationId}")
            ->assertStatus(409)
            ->assertJsonPath('success', false);

        $this->assertDatabaseHas('admission_applications', [
            'id' => $applicationId,
            'status' => 'under_review',
        ]);
        $this->assertDatabaseCount('admission_application_histories', 0);
    }

    public function test_applicant_can_withdraw_a_rejected_application(): void
    {
        $applicationId = $this->createAdmissionApplicationRecord('rejected');

        $this->actingAs($this->applicantUser)
            ->deleteJson("/api/applicant/admissions/{$applicationId}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'withdrawn');

        $this->assertDatabaseHas('admission_applications', [
            'id' => $applicationId,
            'status' => 'withdrawn',
        ]);
        $this->assertDatabaseHas('admission_application_histories', [
            'admission_application_id' => $applicationId,
            'action' => 'withdrawn',
            'old_status' => 'rejected',
            'new_status' => 'withdrawn',
        ]);
    }

    public function test_applicant_cannot_withdraw_another_applicants_application(): void
    {
        $otherUser = User::create([
            'name' => 'Other Applicant',
            'email' => 'other-admission@example.test',
            'password' => 'test-password',
            'role' => 'applicant',
        ]);
        $otherApplicant = Applicant::create([
            'user_id' => $otherUser->id,
            'first_name' => 'Other',
            'last_name' => 'Applicant',
        ]);
        $applicationId = DB::table('admission_applications')->insertGetId([
            'applicant_id' => $otherApplicant->id,
            'academic_program_id' => 1,
            'admission_period_id' => 1,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($this->applicantUser)
            ->deleteJson("/api/applicant/admissions/{$applicationId}")
            ->assertForbidden()
            ->assertJsonPath('success', false);

        $this->assertDatabaseHas('admission_applications', [
            'id' => $applicationId,
            'status' => 'pending',
        ]);
    }

    public function test_admin_can_create_application_for_open_period_with_audit_history(): void
    {
        $admin = User::create([
            'name' => 'Admission Admin',
            'email' => 'admission-admin@example.test',
            'password' => 'test-password',
            'role' => 'admin',
        ]);

        $this->actingAs($admin)
            ->postJson('/api/admin/admission-applications', [
                'applicant_id' => $this->applicantUser->applicant->id,
                'academic_program_id' => 1,
                'remarks' => 'Created through Admin workflow',
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('admission_applications', [
            'applicant_id' => $this->applicantUser->applicant->id,
            'academic_program_id' => 1,
            'admission_period_id' => 1,
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('admission_application_histories', [
            'user_id' => $admin->id,
            'action' => 'submitted',
            'new_status' => 'pending',
        ]);
    }

    public function test_admin_can_edit_and_withdraw_without_deleting_application_history_or_files(): void
    {
        $admin = User::create([
            'name' => 'Admission Admin',
            'email' => 'admission-admin@example.test',
            'password' => 'test-password',
            'role' => 'admin',
        ]);
        $applicationId = $this->createAdmissionApplicationRecord('pending');
        DB::table('application_documents')->insert([
            'admission_application_id' => $applicationId,
            'document_name' => 'Birth Certificate',
            'file_path' => 'private/test/birth-certificate.pdf',
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($admin)
            ->putJson("/api/admin/admission-applications/{$applicationId}", [
                'academic_program_id' => 1,
                'remarks' => 'Corrected by administrator',
            ])
            ->assertOk()
            ->assertJsonPath('data.remarks', 'Corrected by administrator');

        $this->actingAs($admin)
            ->deleteJson("/api/admin/admission-applications/{$applicationId}")
            ->assertOk()
            ->assertJsonPath('data.status', 'withdrawn');

        $this->assertDatabaseHas('admission_applications', [
            'id' => $applicationId,
            'status' => 'withdrawn',
            'remarks' => 'Corrected by administrator',
        ]);
        $this->assertDatabaseHas('application_documents', [
            'admission_application_id' => $applicationId,
            'file_path' => 'private/test/birth-certificate.pdf',
        ]);
        $this->assertDatabaseHas('admission_application_histories', [
            'admission_application_id' => $applicationId,
            'action' => 'application_updated',
        ]);
        $this->assertDatabaseHas('admission_application_histories', [
            'admission_application_id' => $applicationId,
            'action' => 'withdrawn',
            'new_status' => 'withdrawn',
        ]);
    }

    public function test_admin_cannot_withdraw_an_application_after_review_or_final_decision(): void
    {
        $admin = User::create([
            'name' => 'Admission Admin',
            'email' => 'admission-admin@example.test',
            'password' => 'test-password',
            'role' => 'admin',
        ]);
        $applicationId = $this->createAdmissionApplicationRecord('approved');

        $this->actingAs($admin)
            ->deleteJson("/api/admin/admission-applications/{$applicationId}")
            ->assertStatus(409);

        $this->assertDatabaseHas('admission_applications', [
            'id' => $applicationId,
            'status' => 'approved',
        ]);
        $this->assertDatabaseCount('admission_application_histories', 0);
    }

    private function createAdmissionApplicationRecord(string $status): int
    {
        return DB::table('admission_applications')->insertGetId([
            'applicant_id' => $this->applicantUser->applicant->id,
            'academic_program_id' => 1,
            'admission_period_id' => 1,
            'status' => $status,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function createSchema(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('role')->default('applicant');
            $table->timestamps();
        });
        Schema::create('applicants', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->timestamps();
        });
        Schema::create('academic_programs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
        Schema::create('admission_periods', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('status');
            $table->date('start_date');
            $table->date('end_date');
            $table->timestamps();
        });
        Schema::create('admission_applications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('applicant_id');
            $table->unsignedBigInteger('academic_program_id');
            $table->unsignedBigInteger('admission_period_id');
            $table->string('status')->default('pending');
            $table->text('remarks')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });
        Schema::create('application_documents', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('admission_application_id');
            $table->string('document_name');
            $table->string('file_path');
            $table->string('file_type')->nullable();
            $table->string('status')->default('pending');
            $table->timestamps();
        });
        Schema::create('admission_application_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('admission_application_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('action');
            $table->string('old_status')->nullable();
            $table->string('new_status')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    private function createApplicantAndAdmissionPeriod(): void
    {
        $this->applicantUser = User::create([
            'name' => 'Test Applicant',
            'email' => 'admission-policy@example.test',
            'password' => 'test-password',
            'role' => 'applicant',
        ]);
        Applicant::create([
            'user_id' => $this->applicantUser->id,
            'first_name' => 'Test',
            'last_name' => 'Applicant',
        ]);
        DB::table('academic_programs')->insert([
            'id' => 1,
            'name' => 'Test Program',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('admission_periods')->insert([
            'id' => 1,
            'name' => 'Open Period',
            'status' => 'open',
            'start_date' => today()->toDateString(),
            'end_date' => today()->addDay()->toDateString(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
