<?php

namespace Tests\Feature;

use App\Models\Applicant;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ApplicantEducationTest extends TestCase
{
    use \Tests\Support\InstallsStudentVerificationSchema;
    private User $owner;
    private Applicant $applicant;
    private const FIELDS = [
        'primary_school' => 'Example Elementary School',
        'primary_school_year' => '2018',
        'junior_high_school' => 'Example Junior High',
        'senior_high_school' => 'Example Senior High',
        'shs_strand' => 'STEM',
        'lrn' => '001234567890',
        'previous_college_university' => 'Example College',
    ];

    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:']);
        DB::purge('sqlite'); DB::setDefaultConnection('sqlite');
        Schema::create('users', function (Blueprint $t) { $t->id(); $t->string('name'); $t->string('email')->unique(); $t->string('password'); $t->string('role'); $t->string('profile_photo')->nullable(); $t->timestamps(); });
        Schema::create('applicants', function (Blueprint $t) { $t->id(); $t->unsignedBigInteger('user_id'); $t->string('first_name'); $t->string('middle_name')->nullable(); $t->string('last_name'); $t->date('birth_date')->nullable(); $t->string('gender')->nullable(); $t->string('phone')->nullable(); $t->text('address')->nullable(); $t->string('profile_photo')->nullable(); $t->boolean('is_archived')->default(false); $t->timestamps(); });
        Schema::create('staff', function (Blueprint $t) { $t->id(); $t->unsignedBigInteger('user_id'); });
        $this->owner = User::create(['name' => 'Original Applicant', 'email' => 'owner@example.test', 'password' => 'test-password', 'role' => 'applicant']);
        $this->applicant = Applicant::create(['user_id' => $this->owner->id, 'first_name' => 'Original', 'last_name' => 'Applicant', 'phone' => 'Existing contact']);
        // Execute the actual additive migration on an existing isolated applicant record.
        (require database_path('migrations/2026_10_18_000001_add_educational_background_to_applicants_table.php'))->up();
        Storage::fake('public');
        $this->installStudentVerificationSchema();
    }

    public function test_migration_preserves_existing_records_and_makes_education_optional(): void
    {
        $this->assertDatabaseCount('applicants', 1);
        $this->assertSame('Existing contact', $this->applicant->fresh()->phone);
        $response = $this->actingAs($this->owner)->getJson('/api/applicant/profile')->assertOk();
        foreach (array_keys(self::FIELDS) as $field) $response->assertJsonPath('data.applicant.' . $field, null);
    }

    public function test_mobile_multipart_save_persists_every_field_and_survives_fresh_identity_lookup(): void
    {
        $this->actingAs($this->owner)->postJson('/api/applicant/profile', self::FIELDS + ['_method' => 'PUT'])->assertOk();
        $this->applicant->refresh();
        $profile = $this->getJson('/api/applicant/profile')->assertOk();
        $identity = $this->getJson('/api/auth/user')->assertOk();
        foreach (self::FIELDS as $field => $value) {
            $this->assertSame($value, $this->applicant->$field);
            $profile->assertJsonPath('data.applicant.' . $field, $value);
            $identity->assertJsonPath('data.applicant.' . $field, $value);
        }
        $this->assertSame('Existing contact', $this->applicant->phone);
    }

    public function test_partial_and_existing_web_profile_updates_preserve_omitted_education(): void
    {
        $this->applicant->update(self::FIELDS);
        $this->actingAs($this->owner)->putJson('/api/applicant/profile', ['first_name' => 'Updated', 'phone' => 'New contact'])->assertOk();
        $this->putJson('/api/applicant/profile', ['junior_high_school' => 'New JHS'])->assertOk();
        $this->assertSame('Example Elementary School', $this->applicant->fresh()->primary_school);
        $this->assertSame('001234567890', $this->applicant->fresh()->lrn);
        $this->assertSame('New JHS', $this->applicant->fresh()->junior_high_school);
        $this->assertSame('Updated Applicant', $this->owner->fresh()->name);
        $this->postJson('/api/applicant/profile', ['_method' => 'PUT', 'profile_photo' => UploadedFile::fake()->create('profile.png', 10, 'image/png')])->assertOk();
        $this->assertSame('New JHS', $this->applicant->fresh()->junior_high_school);
    }

    public function test_optional_values_can_be_explicitly_cleared_without_clearing_other_fields(): void
    {
        $this->applicant->update(self::FIELDS);
        $this->actingAs($this->owner)->putJson('/api/applicant/profile', ['primary_school_year' => '', 'lrn' => null, 'previous_college_university' => ''])->assertOk();
        $this->applicant->refresh();
        $this->assertNull($this->applicant->lrn);
        $this->assertNull($this->applicant->primary_school_year);
        $this->assertNull($this->applicant->previous_college_university);
        $this->assertSame('Example Senior High', $this->applicant->senior_high_school);
    }

    public function test_invalid_values_return_validation_errors_and_do_not_partially_save(): void
    {
        $this->actingAs($this->owner);
        foreach ([['lrn', '123'], ['lrn', 'ABCDEFGHIJKL'], ['primary_school_year', '20AB'], ['primary_school_year', '20180'], ['primary_school', str_repeat('x', 256)], ['shs_strand', str_repeat('x', 101)], ['previous_college_university', str_repeat('x', 256)]] as [$field, $value]) {
            $this->putJson('/api/applicant/profile', [$field => $value, 'first_name' => 'Must not save'])->assertUnprocessable()->assertJsonValidationErrors($field);
            $this->assertSame('Original', $this->applicant->fresh()->first_name);
        }
    }

    public function test_education_updates_cannot_target_another_applicant_or_change_account_privileges(): void
    {
        $otherUser = User::create(['name' => 'Other', 'email' => 'other@example.test', 'password' => 'test-password', 'role' => 'applicant']);
        $other = Applicant::create(['user_id' => $otherUser->id, 'first_name' => 'Other', 'last_name' => 'Applicant', 'primary_school' => 'Keep this school']);
        $this->actingAs($this->owner)->putJson('/api/applicant/profile', self::FIELDS + ['id' => $other->id, 'applicant_id' => $other->id, 'user_id' => $otherUser->id, 'is_archived' => true, 'role' => 'admin'])->assertOk();
        $this->assertSame('Keep this school', $other->fresh()->primary_school);
        $this->assertSame($this->owner->id, $this->applicant->fresh()->user_id);
        $this->assertFalse($this->applicant->fresh()->is_archived);
        $this->assertSame('applicant', $this->owner->fresh()->role);
    }

    public function test_anonymous_other_roles_and_missing_profiles_cannot_save(): void
    {
        $this->putJson('/api/applicant/profile', self::FIELDS)->assertUnauthorized();
        foreach (['admin', 'staff'] as $role) {
            $user = User::create(['name' => $role, 'email' => $role . '@example.test', 'password' => 'test-password', 'role' => $role]);
            $this->actingAs($user)->putJson('/api/applicant/profile', self::FIELDS)->assertForbidden();
        }
        $missing = User::create(['name' => 'No profile', 'email' => 'missing@example.test', 'password' => 'test-password', 'role' => 'applicant']);
        $this->actingAs($missing)->putJson('/api/applicant/profile', self::FIELDS)->assertForbidden();
    }

    public function test_identity_write_failure_rolls_back_education_and_personal_changes(): void
    {
        User::updating(function () { throw new \RuntimeException('Simulated account write failure'); });
        try {
            $this->actingAs($this->owner)->putJson('/api/applicant/profile', self::FIELDS + ['first_name' => 'Changed'])->assertStatus(500);
        } finally { User::flushEventListeners(); }
        $this->assertNull($this->applicant->fresh()->primary_school);
        $this->assertSame('Original', $this->applicant->fresh()->first_name);
    }
}
