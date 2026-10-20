<?php

namespace Tests\Feature;

use App\Models\Staff;
use App\Models\StaffPermission;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class StaffAccessTest extends TestCase
{
    use \Tests\Support\InstallsWorkflowSchema;

    private User $admin;
    private User $user;
    private Staff $staff;

    private const FEATURES = [
        'manage_admissions' => '/admission-applications',
        'verify_documents' => '/documents',
        'manage_exams' => '/exams',
        'manage_scholarships' => '/scholarship-applications',
        'manage_announcements' => '/announcements',
        'send_notifications' => '/notifications',
        'view_reports' => '/reports',
    ];

    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:', 'database.connections.sqlite.foreign_key_constraints' => false, 'cache.default' => 'array']);
        DB::purge('sqlite'); DB::setDefaultConnection('sqlite');
        Schema::create('users', function (Blueprint $t) { $t->id(); $t->string('name'); $t->string('email')->unique(); $t->string('password'); $t->string('role'); $t->string('profile_photo')->nullable(); $t->timestamps(); });
        (require database_path('migrations/2026_09_17_084737_create_staff_table.php'))->up();
        Schema::table('staff', fn (Blueprint $t) => $t->string('staff_role')->nullable());
        (require database_path('migrations/2026_09_17_103417_create_staff_permissions_table.php'))->up();
        (require database_path('migrations/2026_10_20_000003_add_online_exam_review_permission.php'))->up();
        Schema::create('academic_programs', function (Blueprint $t) { $t->id(); $t->string('name'); $t->string('code'); $t->timestamps(); });
        Schema::create('staff_programs', function (Blueprint $t) { $t->unsignedBigInteger('staff_id'); $t->unsignedBigInteger('academic_program_id'); });
        Schema::create('applicants', function (Blueprint $t) { $t->id(); $t->unsignedBigInteger('user_id'); $t->string('first_name'); $t->string('middle_name')->nullable(); $t->string('last_name'); $t->timestamps(); });
        Schema::create('admission_applications', function (Blueprint $t) { $t->id(); $t->unsignedBigInteger('applicant_id'); $t->unsignedBigInteger('academic_program_id'); $t->string('status'); $t->timestamps(); });
        Schema::create('admission_application_histories', function (Blueprint $t) { $t->id(); $t->unsignedBigInteger('admission_application_id'); $t->unsignedBigInteger('user_id'); $t->string('action'); $t->timestamps(); });
        Schema::create('application_documents', function (Blueprint $t) { $t->id(); $t->unsignedBigInteger('admission_application_id'); $t->string('document_name'); $t->string('status'); $t->timestamps(); });
        Schema::create('scholarships', function (Blueprint $t) { $t->id(); $t->string('name'); $t->timestamps(); });
        Schema::create('scholarship_applications', function (Blueprint $t) { $t->id(); $t->unsignedBigInteger('applicant_id'); $t->unsignedBigInteger('scholarship_id'); $t->string('status'); $t->timestamps(); });
        Schema::create('entrance_exams', function (Blueprint $t) { $t->id(); $t->string('title'); $t->date('exam_date'); $t->boolean('is_active'); $t->timestamps(); });
        Schema::create('exam_assignments', function (Blueprint $t) { $t->id(); $t->unsignedBigInteger('entrance_exam_id'); $t->unsignedBigInteger('applicant_id'); $t->string('status'); $t->timestamps(); });
        $this->installWorkflowSchema();
        $this->admin = User::create(['name' => 'Admin', 'email' => 'admin@example.test', 'password' => 'safe-test-password', 'role' => 'admin']);
        $this->user = User::create(['name' => 'Staff', 'email' => 'staff@example.test', 'password' => 'safe-test-password', 'role' => 'staff']);
        $this->staff = Staff::create(['user_id' => $this->user->id, 'employee_id' => 'STAFF-TEST', 'staff_role' => 'Admission Staff', 'first_name' => 'Staff', 'last_name' => 'Tester', 'status' => 'active']);
        StaffPermission::create(['staff_id' => $this->staff->id] + array_fill_keys(array_keys(self::FEATURES), false));
        DB::table('academic_programs')->insert([['id' => 1, 'name' => 'Assigned', 'code' => 'A'], ['id' => 2, 'name' => 'Other', 'code' => 'B']]);
        $this->staff->academicPrograms()->sync([1]);
    }

    private function asFreshStaff(): void
    {
        $this->actingAs($this->user->fresh());
    }

    public function test_online_exam_review_permission_defaults_off_and_only_admin_can_grant_or_revoke_it(): void
    {
        $this->assertFalse($this->staff->permissions->review_online_exams);
        $this->asFreshStaff();
        $this->getJson('/api/staff/online-exams/attempts')->assertForbidden();
        $this->putJson('/api/admin/staff/'.$this->staff->id, ['review_online_exams' => true])->assertForbidden();
        $this->actingAs($this->admin)->putJson('/api/admin/staff/'.$this->staff->id, ['review_online_exams' => true])->assertOk()->assertJsonPath('data.permissions.review_online_exams', true);
        $this->putJson('/api/admin/staff/'.$this->staff->id, ['review_online_exams' => false])->assertOk()->assertJsonPath('data.permissions.review_online_exams', false);
        $this->asFreshStaff();
        $this->getJson('/api/staff/online-exams/attempts')->assertForbidden();
    }

    public function test_admin_permissions_enable_exactly_the_corresponding_staff_endpoints_and_can_be_revoked(): void
    {
        foreach (self::FEATURES as $permission => $path) {
            $this->actingAs($this->admin)->putJson('/api/admin/staff/'.$this->staff->id, array_fill_keys(array_keys(self::FEATURES), false) + [])->assertOk();
            $this->putJson('/api/admin/staff/'.$this->staff->id, [$permission => true])->assertOk()->assertJsonPath('data.permissions.'.$permission, true);
            $this->asFreshStaff();
            foreach (self::FEATURES as $other => $otherPath) {
                $response = $this->getJson('/api/staff'.$otherPath);
                $other === $permission ? $response->assertOk() : $response->assertForbidden();
            }
            $this->actingAs($this->admin)->putJson('/api/admin/staff/'.$this->staff->id, [$permission => false])->assertOk();
            $this->asFreshStaff(); $this->getJson('/api/staff'.$path)->assertForbidden();
        }
    }

    public function test_missing_permissions_inactive_and_missing_profiles_fail_closed(): void
    {
        $this->staff->permissions()->delete(); $this->asFreshStaff();
        foreach (self::FEATURES as $path) $this->getJson('/api/staff'.$path)->assertForbidden();
        $this->staff->update(['status' => 'inactive']); $this->asFreshStaff();
        foreach (['/dashboard', '/profile', ...array_values(self::FEATURES)] as $path) $this->getJson('/api/staff'.$path)->assertForbidden();
        $this->putJson('/api/staff/profile', ['first_name' => 'Attempt', 'last_name' => 'Change', 'email' => 'staff@example.test'])->assertForbidden();
        $this->staff->delete(); $this->asFreshStaff(); $this->getJson('/api/staff/profile')->assertForbidden();
    }

    public function test_other_roles_and_unauthenticated_requests_cannot_access_staff_features(): void
    {
        $this->getJson('/api/staff/dashboard')->assertUnauthorized();
        foreach (['admin', 'applicant'] as $role) {
            $user = User::create(['name' => $role, 'email' => $role.'-denied@example.test', 'password' => 'safe-test-password', 'role' => $role]);
            $this->actingAs($user);
            foreach (['/dashboard', '/profile', ...array_values(self::FEATURES)] as $path) $this->getJson('/api/staff'.$path)->assertForbidden();
            $this->putJson('/api/admin/staff/'.$this->staff->id, ['manage_admissions' => true])->assertStatus($role === 'admin' ? 200 : 403);
        }
        $this->asFreshStaff();
        $this->putJson('/api/admin/staff/'.$this->staff->id, ['manage_admissions' => true])->assertForbidden();
    }

    private function records(): void
    {
        $person = User::create(['name' => 'Applicant', 'email' => 'person@example.test', 'password' => 'safe-test-password', 'role' => 'applicant']);
        DB::table('applicants')->insert(['id' => 1, 'user_id' => $person->id, 'first_name' => 'Applicant', 'last_name' => 'One']);
        DB::table('admission_applications')->insert([['id' => 1, 'applicant_id' => 1, 'academic_program_id' => 1, 'status' => 'pending'], ['id' => 2, 'applicant_id' => 1, 'academic_program_id' => 2, 'status' => 'pending']]);
        DB::table('scholarships')->insert(['id' => 1, 'name' => 'Scholarship']);
        DB::table('scholarship_applications')->insert(['id' => 1, 'applicant_id' => 1, 'scholarship_id' => 1, 'status' => 'pending']);
        DB::table('application_documents')->insert([['id' => 1, 'admission_application_id' => 1, 'document_name' => 'Assigned document', 'status' => 'pending'], ['id' => 2, 'admission_application_id' => 2, 'document_name' => 'Other document', 'status' => 'pending']]);
    }

    public function test_lists_details_and_nested_admissions_remain_program_scoped(): void
    {
        $this->records();
        $this->staff->permissions()->update(['manage_admissions' => true, 'verify_documents' => true, 'manage_scholarships' => true, 'view_reports' => true]);
        $this->asFreshStaff();
        $this->getJson('/api/staff/admission-applications')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', 1);
        $this->getJson('/api/staff/admission-applications/2')->assertForbidden();
        $this->putJson('/api/staff/admission-applications/2/approve')->assertForbidden();
        $this->getJson('/api/staff/documents')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/staff/documents/2')->assertForbidden();
        $this->getJson('/api/staff/documents/2/file')->assertForbidden();
        $this->putJson('/api/staff/documents/2', ['status' => 'verified'])->assertForbidden();
        $this->getJson('/api/staff/scholarship-applications')->assertOk()->assertJsonCount(1, 'data.0.applicant.admission_applications')->assertJsonPath('data.0.applicant.admission_applications.0.academic_program_id', 1);
        $this->getJson('/api/staff/scholarship-applications/1')->assertOk()->assertJsonCount(1, 'data.applicant.admission_applications');
        $this->getJson('/api/staff/dashboard')->assertOk()->assertJsonPath('data.pending_applications', 1)->assertJsonCount(1, 'data.recent_applicants.0.admission_applications');
        $this->getJson('/api/staff/reports')->assertOk()->assertJsonPath('data.summary.pending_applications', 1);
        $this->staff->academicPrograms()->sync([]); $this->asFreshStaff();
        foreach (['/admission-applications', '/documents', '/scholarship-applications'] as $path) $this->getJson('/api/staff'.$path)->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/staff/scholarship-applications/1')->assertForbidden();
    }

    public function test_pending_scholarship_badge_respects_permissions_programs_and_review_status(): void
    {
        $this->records();
        $this->asFreshStaff();
        $this->getJson('/api/staff/dashboard')->assertOk()->assertJsonPath('data.pending_scholarship_applications', 0);

        $this->staff->permissions()->update(['manage_scholarships' => true]);
        $this->asFreshStaff();
        $this->getJson('/api/staff/dashboard')->assertOk()->assertJsonPath('data.pending_scholarship_applications', 1);
        DB::table('scholarship_applications')->insert(['id' => 2, 'applicant_id' => 1, 'scholarship_id' => 1, 'status' => 'pending']);
        $this->getJson('/api/staff/dashboard')->assertOk()->assertJsonPath('data.pending_scholarship_applications', 2);

        DB::table('scholarship_applications')->where('id', 1)->update(['status' => 'under_review']);
        $this->getJson('/api/staff/dashboard')->assertOk()->assertJsonPath('data.pending_scholarship_applications', 1);
        $this->staff->academicPrograms()->sync([2]);
        DB::table('admission_applications')->where('academic_program_id', 2)->delete();
        $this->asFreshStaff();
        $this->getJson('/api/staff/dashboard')->assertOk()->assertJsonPath('data.pending_scholarship_applications', 0);
    }

    public function test_lightweight_application_counts_are_role_permission_and_program_scoped(): void
    {
        $this->records();
        $this->getJson('/api/admin/application-counts')->assertUnauthorized();
        $this->getJson('/api/staff/application-counts')->assertUnauthorized();
        $this->actingAs($this->admin)->getJson('/api/admin/application-counts')->assertOk()
            ->assertExactJson(['success' => true, 'data' => ['pending_applications' => 2, 'pending_scholarship_applications' => 1]]);
        $this->getJson('/api/staff/application-counts')->assertForbidden();
        $this->asFreshStaff();
        $this->getJson('/api/admin/application-counts')->assertForbidden();
        $this->getJson('/api/staff/application-counts')->assertOk()->assertJsonPath('data.pending_applications', 0)->assertJsonPath('data.pending_scholarship_applications', 0);
        $this->staff->permissions()->update(['manage_admissions' => true, 'manage_scholarships' => true]);
        $this->asFreshStaff();
        $this->getJson('/api/staff/application-counts')->assertOk()->assertJsonPath('data.pending_applications', 1)->assertJsonPath('data.pending_scholarship_applications', 1);
        DB::table('scholarship_applications')->update(['status' => 'approved']);
        $this->getJson('/api/staff/application-counts')->assertOk()->assertJsonPath('data.pending_scholarship_applications', 0);
        $this->staff->academicPrograms()->sync([]);
        $this->asFreshStaff();
        $this->getJson('/api/staff/application-counts')->assertOk()->assertJsonPath('data.pending_applications', 0);
        $this->staff->update(['status' => 'inactive']);
        $this->asFreshStaff();
        $this->getJson('/api/staff/application-counts')->assertForbidden();
        $applicant = User::where('role', 'applicant')->firstOrFail();
        $this->actingAs($applicant)->getJson('/api/admin/application-counts')->assertForbidden();
        $this->getJson('/api/staff/application-counts')->assertForbidden();
    }

    public function test_dashboard_does_not_bypass_feature_permissions_and_ignores_future_announcements(): void
    {
        $this->records(); $this->asFreshStaff();
        $this->getJson('/api/staff/dashboard')->assertOk()->assertJsonPath('data.total_applicants', 0)->assertJsonCount(0, 'data.recent_applicants');
        $this->staff->permissions()->update(['manage_announcements' => true]); $this->asFreshStaff();
        DB::table('announcements')->insert([['title' => 'Now', 'status' => 'published', 'published_at' => now()->subHour()], ['title' => 'Later', 'status' => 'published', 'published_at' => now()->addDay()]]);
        $this->getJson('/api/staff/dashboard')->assertOk()->assertJsonPath('data.published_announcements', 1)->assertJsonPath('data.total_applicants', 0);
    }

    public function test_staff_roles_match_backend_validation_and_invalid_updates_leave_permissions_unchanged(): void
    {
        $this->actingAs($this->admin)->putJson('/api/admin/staff/'.$this->staff->id, ['staff_role' => 'Exam Staff', 'manage_exams' => true])->assertOk()->assertJsonPath('data.staff_role', 'Exam Staff');
        $this->putJson('/api/admin/staff/'.$this->staff->id, ['staff_role' => 'Clinic Staff', 'manage_exams' => false])->assertUnprocessable();
        $this->assertTrue($this->staff->permissions()->first()->manage_exams);
    }

    public function test_admin_staff_lifecycle_preserves_defaults_and_applies_assignments_without_role_escalation(): void
    {
        $payload = ['name' => 'New Staff', 'email' => 'new@example.test', 'password' => 'safe-test-password', 'employee_id' => 'NEW-TEST', 'staff_role' => 'Exam Staff', 'first_name' => 'New', 'last_name' => 'Staff', 'program_ids' => [1, 2], 'role' => 'admin'];
        $created = $this->actingAs($this->admin)->postJson('/api/admin/staff', $payload)->assertCreated()->assertJsonPath('data.user.role', 'staff')->assertJsonPath('data.permissions.manage_admissions', true)->assertJsonPath('data.permissions.manage_exams', false)->assertJsonCount(2, 'data.academic_programs');
        $id = $created->json('data.id');
        $userId = $created->json('data.user.id');
        $this->postJson('/api/admin/staff', $payload)->assertUnprocessable();
        $this->putJson('/api/admin/staff/'.$id, ['program_ids' => [1], 'manage_exams' => true, 'role' => 'admin'])->assertOk()->assertJsonPath('data.user.role', 'staff')->assertJsonPath('data.permissions.manage_admissions', true)->assertJsonPath('data.permissions.manage_exams', true)->assertJsonCount(1, 'data.academic_programs');
        $this->getJson('/api/admin/staff/'.$id)->assertOk()->assertJsonMissingPath('data.user.password');
        $this->deleteJson('/api/admin/staff/'.$id)->assertOk();
        $this->assertDatabaseMissing('staff', ['id' => $id]);
        $this->assertDatabaseMissing('users', ['id' => $userId]);
        $this->assertDatabaseHas('workflow_events', ['subject_type' => 'staff', 'subject_id' => $id, 'action' => 'staff_deleted']);
    }

    public function test_disabled_features_reject_writes_before_any_records_are_changed(): void
    {
        $this->records(); $this->asFreshStaff();
        DB::table('entrance_exams')->insert(['id' => 1, 'title' => 'Existing exam', 'exam_date' => '2026-11-01', 'is_active' => true]);
        DB::table('announcements')->insert(['id' => 1, 'title' => 'Existing notice', 'status' => 'draft']);
        DB::table('notifications')->insert(['id' => 1, 'user_id' => $this->user->id, 'title' => 'Existing notification', 'message' => 'Retain']);
        foreach ([['PUT', '/admission-applications/1/approve'], ['PUT', '/admission-applications/1/reject'], ['PUT', '/documents/1'], ['PUT', '/exams/1'], ['DELETE', '/exams/1'], ['PUT', '/scholarship-applications/1'], ['POST', '/announcements'], ['PUT', '/announcements/1'], ['DELETE', '/announcements/1'], ['POST', '/notifications'], ['DELETE', '/notifications/1']] as [$method, $path]) {
            $this->json($method, '/api/staff'.$path, ['status' => 'approved'])->assertForbidden();
        }
        $this->assertDatabaseHas('admission_applications', ['id' => 1, 'status' => 'pending']);
        $this->assertDatabaseHas('application_documents', ['id' => 1, 'status' => 'pending']);
        $this->assertDatabaseCount('notifications', 1);
    }

    public function test_profile_accepts_post_and_cannot_change_admin_controlled_fields(): void
    {
        $this->asFreshStaff();
        $this->postJson('/api/staff/profile', ['first_name' => 'Updated', 'last_name' => 'Staff', 'email' => 'staff@example.test', 'manage_exams' => true, 'role' => 'admin', 'status' => 'inactive', 'program_ids' => [2]])->assertOk()->assertJsonPath('data.user.role', 'staff')->assertJsonPath('data.status', 'active')->assertJsonPath('data.permissions.manage_exams', false)->assertJsonPath('data.academic_programs.0.id', 1);
    }
}
