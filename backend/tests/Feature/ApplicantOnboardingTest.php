<?php

namespace Tests\Feature;

use App\Models\Applicant;
use App\Models\User;
use App\Models\UserOnboardingState;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ApplicantOnboardingTest extends TestCase
{
    use \Tests\Support\InstallsStudentVerificationSchema;
    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        // Never migrate, truncate, or reset the configured application database.
        config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:', 'database.connections.sqlite.foreign_key_constraints' => true]);
        DB::purge('sqlite');
        DB::setDefaultConnection('sqlite');
        // Final users role schema; the historical ALTER ENUM migration is MySQL-specific.
        Schema::create('users', function (Blueprint $table) {
            $table->id(); $table->string('name'); $table->string('email')->unique(); $table->string('password'); $table->enum('role', ['admin', 'staff', 'applicant']); $table->rememberToken(); $table->timestamps();
        });
        foreach (['2026_08_25_091343_create_applicants_table.php', '2026_08_25_154002_create_personal_access_tokens_table.php'] as $migration) {
            (require database_path('migrations/'.$migration))->up();
        }
        Schema::create('online_exam_attempts', function (Blueprint $table) {
            $table->id(); $table->unsignedBigInteger('applicant_id'); $table->string('status'); $table->timestamp('expires_at')->nullable(); $table->integer('current_question_index')->default(0);
        });
        $this->owner = User::create(['name' => 'Existing applicant', 'email' => 'existing@example.test', 'password' => 'password-example', 'role' => 'applicant']);
        Applicant::create(['user_id' => $this->owner->id, 'first_name' => 'Existing', 'last_name' => 'Applicant']);
        (require database_path('migrations/2026_10_18_000002_create_user_onboarding_states_table.php'))->up();
        $this->installStudentVerificationSchema();
        \Illuminate\Support\Facades\Storage::fake('local');
    }

    private function input(int $revision = 0, array $extra = []): array
    {
        return array_merge(['tutorial_version' => 1, 'revision' => $revision], $extra);
    }

    public function test_existing_accounts_are_not_enrolled_by_migration_or_read(): void
    {
        $this->actingAs($this->owner)->getJson('/api/applicant/onboarding')->assertOk()->assertJsonPath('data.state', null)->assertJsonPath('data.exam_active', false);
        $this->assertDatabaseCount('user_onboarding_states', 0);
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('applicants', 1);
    }

    public function test_new_registration_is_enrolled_without_starting_and_preserves_response_contract(): void
    {
        $this->postJson('/api/auth/register', $this->studentIdentityInput() + ['first_name' => 'New', 'last_name' => 'Applicant', 'birth_date' => '2006-01-01', 'gender' => 'Female', 'phone' => '09000000000', 'address' => 'Test address', 'email' => 'new@example.test', 'password' => 'password-example', 'password_confirmation' => 'password-example'])
            ->assertCreated()->assertJsonPath('user.role', 'applicant')->assertJsonStructure(['token', 'user' => ['applicant']]);
        $newUser = User::where('email', 'new@example.test')->firstOrFail();
        $this->assertDatabaseHas('user_onboarding_states', ['user_id' => $newUser->id, 'status' => 'not_started', 'current_step_id' => 'welcome', 'enrollment_source' => 'new_registration']);
        $this->assertDatabaseMissing('user_onboarding_states', ['user_id' => $this->owner->id]);
    }

    public function test_rollout_switch_disables_new_enrollment(): void
    {
        config(['onboarding.enroll_new_applicants' => false]);
        UserOnboardingState::enrollNewApplicant($this->owner);
        $this->assertDatabaseCount('user_onboarding_states', 0);
    }

    public function test_skipping_the_invitation_does_not_record_a_tour_start(): void
    {
        UserOnboardingState::enrollNewApplicant($this->owner);
        $response = $this->actingAs($this->owner)->patchJson('/api/applicant/onboarding', $this->input(1, ['status' => 'skipped', 'current_step_id' => 'welcome']))
            ->assertOk()->assertJsonPath('data.state.started_at', null)->assertJsonPath('data.state.status', 'skipped');
        $this->assertNotNull($response->json('data.state.skipped_at'));
    }

    public function test_failed_enrollment_rolls_back_registration_without_partial_accounts(): void
    {
        // Only this test's in-memory table is removed to simulate a deployment failure.
        Schema::drop('user_onboarding_states');
        $this->postJson('/api/auth/register', $this->studentIdentityInput() + ['first_name' => 'New', 'last_name' => 'Applicant', 'birth_date' => '2006-01-01', 'gender' => 'Female', 'phone' => '09000000000', 'address' => 'Test address', 'email' => 'failed@example.test', 'password' => 'password-example', 'password_confirmation' => 'password-example'])->assertStatus(500);
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('applicants', 1);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_anonymous_admin_and_staff_cannot_access_applicant_state(): void
    {
        $this->getJson('/api/applicant/onboarding')->assertUnauthorized();
        foreach (['admin', 'staff'] as $role) {
            $user = User::create(['name' => $role, 'email' => $role.'@example.test', 'password' => 'password-example', 'role' => $role]);
            $this->actingAs($user)->getJson('/api/applicant/onboarding')->assertForbidden();
            $this->postJson('/api/applicant/onboarding/restart', $this->input())->assertForbidden();
            $this->patchJson('/api/applicant/onboarding', $this->input(0, ['status' => 'skipped', 'current_step_id' => 'welcome']))->assertForbidden();
        }
    }

    public function test_manual_start_progress_skip_and_restart_persist_per_account(): void
    {
        $this->actingAs($this->owner)->postJson('/api/applicant/onboarding/restart', $this->input())->assertOk()->assertJsonPath('data.state.enrollment_source', 'manual')->assertJsonPath('data.state.revision', 1);
        $this->patchJson('/api/applicant/onboarding', $this->input(1, ['status' => 'in_progress', 'current_step_id' => 'documents']))->assertOk()->assertJsonPath('data.state.revision', 2);
        $this->getJson('/api/applicant/onboarding')->assertOk()->assertJsonPath('data.state.current_step_id', 'documents');
        $this->patchJson('/api/applicant/onboarding', $this->input(2, ['status' => 'skipped', 'current_step_id' => 'documents']))->assertOk()->assertJsonPath('data.state.status', 'skipped');
        $this->postJson('/api/applicant/onboarding/restart', $this->input(3))->assertOk()->assertJsonPath('data.state.current_step_id', 'welcome')->assertJsonPath('data.state.skipped_at', null);
        $this->assertDatabaseCount('user_onboarding_states', 1);
    }

    public function test_stale_tabs_cannot_overwrite_progress_or_restart(): void
    {
        $this->actingAs($this->owner)->postJson('/api/applicant/onboarding/restart', $this->input())->assertOk();
        $this->postJson('/api/applicant/onboarding/restart', $this->input())->assertConflict()->assertJsonPath('code', 'stale_onboarding');
        $this->patchJson('/api/applicant/onboarding', $this->input(1, ['status' => 'in_progress', 'current_step_id' => 'profile']))->assertOk();
        $this->patchJson('/api/applicant/onboarding', $this->input(1, ['status' => 'skipped', 'current_step_id' => 'welcome']))->assertConflict();
        $this->getJson('/api/applicant/onboarding')->assertJsonPath('data.state.current_step_id', 'profile');
    }

    public function test_completion_requires_final_step_and_cannot_be_overwritten_by_delayed_progress(): void
    {
        $this->actingAs($this->owner)->postJson('/api/applicant/onboarding/restart', $this->input())->assertOk();
        $this->patchJson('/api/applicant/onboarding', $this->input(1, ['status' => 'completed', 'current_step_id' => 'finish']))->assertUnprocessable();
        $this->patchJson('/api/applicant/onboarding', $this->input(1, ['status' => 'in_progress', 'current_step_id' => 'finish']))->assertOk();
        $response = $this->patchJson('/api/applicant/onboarding', $this->input(2, ['status' => 'completed', 'current_step_id' => 'finish']))->assertOk()->assertJsonPath('data.state.status', 'completed');
        $this->assertNotNull($response->json('data.state.completed_at'));
        $this->patchJson('/api/applicant/onboarding', $this->input(3, ['status' => 'in_progress', 'current_step_id' => 'profile']))->assertConflict();
    }

    public function test_arbitrary_ids_statuses_versions_and_revisions_are_rejected(): void
    {
        $this->actingAs($this->owner)->postJson('/api/applicant/onboarding/restart', $this->input())->assertOk();
        foreach ([['current_step_id' => 'submit-application'], ['status' => 'approved'], ['tutorial_version' => 99], ['revision' => -1]] as $invalid) {
            $this->patchJson('/api/applicant/onboarding', array_merge($this->input(1, ['status' => 'in_progress', 'current_step_id' => 'profile']), $invalid))->assertUnprocessable();
        }
        $this->assertDatabaseHas('user_onboarding_states', ['revision' => 1, 'current_step_id' => 'welcome']);
    }

    public function test_user_ids_in_payload_cannot_change_another_accounts_state(): void
    {
        $other = User::create(['name' => 'Other', 'email' => 'other@example.test', 'password' => 'password-example', 'role' => 'applicant']);
        $this->actingAs($this->owner)->postJson('/api/applicant/onboarding/restart', $this->input(0, ['user_id' => $other->id]))->assertOk()->assertJsonPath('data.state.user_id', $this->owner->id);
        $this->actingAs($other)->getJson('/api/applicant/onboarding')->assertOk()->assertJsonPath('data.state', null);
    }

    public function test_exam_guard_reads_without_advancing_timing_and_blocks_all_writes(): void
    {
        $this->actingAs($this->owner)->postJson('/api/applicant/onboarding/restart', $this->input())->assertOk();
        $attemptId = DB::table('online_exam_attempts')->insertGetId(['applicant_id' => $this->owner->applicant->id, 'status' => 'in_progress', 'current_question_index' => 7]);
        $this->getJson('/api/applicant/onboarding')->assertOk()->assertJsonPath('data.exam_active', true);
        $this->postJson('/api/applicant/onboarding/restart', $this->input(1))->assertConflict()->assertJsonPath('code', 'exam_active');
        $this->patchJson('/api/applicant/onboarding', $this->input(1, ['status' => 'skipped', 'current_step_id' => 'welcome']))->assertConflict()->assertJsonPath('code', 'exam_active');
        $this->assertDatabaseHas('online_exam_attempts', ['id' => $attemptId, 'current_question_index' => 7, 'status' => 'in_progress']);
        $this->assertDatabaseHas('user_onboarding_states', ['revision' => 1]);
    }

    public function test_other_accounts_attempts_do_not_block_this_account(): void
    {
        DB::table('online_exam_attempts')->insert(['applicant_id' => 99999, 'status' => 'in_progress']);
        $this->actingAs($this->owner)->getJson('/api/applicant/onboarding')->assertOk()->assertJsonPath('data.exam_active', false);
    }

    public function test_an_elapsed_exam_deadline_does_not_block_onboarding_or_mutate_the_attempt(): void
    {
        $attemptId = DB::table('online_exam_attempts')->insertGetId(['applicant_id' => $this->owner->applicant->id, 'status' => 'in_progress', 'expires_at' => now()->subMinute(), 'current_question_index' => 99]);
        $this->actingAs($this->owner)->getJson('/api/applicant/onboarding')->assertOk()->assertJsonPath('data.exam_active', false);
        $this->assertDatabaseHas('online_exam_attempts', ['id' => $attemptId, 'status' => 'in_progress', 'current_question_index' => 99]);
    }

    public function test_a_new_version_does_not_automatically_enroll_an_existing_account(): void
    {
        UserOnboardingState::enrollNewApplicant($this->owner);
        config(['onboarding.version' => 2]);
        $this->actingAs($this->owner)->getJson('/api/applicant/onboarding')->assertOk()->assertJsonPath('data.state', null)->assertJsonPath('data.tutorial_version', 2);
        $this->assertDatabaseCount('user_onboarding_states', 1);
    }
}
