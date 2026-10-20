<?php

namespace Tests\Feature;

use App\Models\Applicant;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UserProfilePhotoTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:']);
        DB::purge('sqlite');
        DB::setDefaultConnection('sqlite');
        Schema::create('users', function (Blueprint $t) {
            $t->id(); $t->string('name'); $t->string('email')->unique(); $t->string('password'); $t->string('role'); $t->string('profile_photo')->nullable(); $t->timestamps();
        });
        foreach (['applicants', 'staff'] as $table) {
            Schema::create($table, function (Blueprint $t) use ($table) {
                $t->id(); $t->unsignedBigInteger('user_id'); $t->string('first_name'); $t->string('middle_name')->nullable(); $t->string('last_name');
                if ($table === 'applicants') {
                    $t->date('birth_date')->nullable(); $t->string('gender')->nullable(); $t->string('phone')->nullable(); $t->text('address')->nullable(); $t->string('profile_photo')->nullable(); $t->boolean('is_archived')->default(false);
                } else { $t->string('status')->default('active'); }
                $t->timestamps();
            });
        }
        Schema::create('staff_permissions', function (Blueprint $t) { $t->id(); $t->unsignedBigInteger('staff_id'); });
        Schema::create('academic_programs', function (Blueprint $t) { $t->id(); $t->string('name'); });
        Schema::create('staff_programs', function (Blueprint $t) { $t->unsignedBigInteger('staff_id'); $t->unsignedBigInteger('academic_program_id'); });
        foreach (['admission_applications', 'scholarship_applications', 'exam_assignments'] as $table) {
            Schema::create($table, function (Blueprint $t) { $t->id(); $t->unsignedBigInteger('applicant_id'); });
        }
        Storage::fake('public');
    }

    private function account(string $role): User
    {
        return User::create(['name' => 'Original User', 'email' => $role . '@example.test', 'password' => 'safe-test-password', 'role' => $role]);
    }

    private function person(User $user): Applicant|Staff
    {
        $data = ['user_id' => $user->id, 'first_name' => 'Original', 'last_name' => 'User'];
        return $user->role === 'staff' ? Staff::create($data + ['status' => 'active']) : Applicant::create($data);
    }

    private function payload(string $role): array
    {
        return ['_method' => 'PUT', 'first_name' => 'Updated', 'last_name' => 'User', 'email' => $role . '@example.test'];
    }

    public function test_both_roles_can_edit_upload_and_admin_can_read_their_photo(): void
    {
        $admin = $this->account('admin');
        foreach (['staff', 'applicant'] as $role) {
            $user = $this->account($role);
            $person = $this->person($user);
            $old = $role . '/old.png';
            Storage::disk('public')->put($old, 'prior image');
            ($role === 'staff' ? $user : $person)->update(['profile_photo' => $old]);
            $response = $this->actingAs($user)->postJson('/api/' . $role . '/profile', $this->payload($role) + [
                'profile_photo' => UploadedFile::fake()->create('photo.png', 100, 'image/png'),
                'user_id' => $admin->id, 'role' => 'admin',
            ])->assertOk();
            $path = $role === 'staff' ? $response->json('data.user.profile_photo') : $response->json('data.applicant.profile_photo');
            $this->assertNotEmpty($path);
            Storage::disk('public')->assertExists($path);
            Storage::disk('public')->assertExists($old);
            $this->assertSame('Updated', $person->fresh()->first_name);
            $this->assertSame('Updated User', $user->fresh()->name);
            $this->assertSame($role, $user->fresh()->role);
            $this->actingAs($user->fresh())->getJson('/api/auth/user')->assertOk()->assertJsonPath('data.profile_photo_url', Storage::disk('public')->url($path));
            $endpoint = $role === 'staff' ? 'staff' : 'applicants';
            $photoKey = $role === 'staff' ? 'data.user.profile_photo' : 'data.profile_photo';
            $this->actingAs($admin)->getJson('/api/admin/' . $endpoint . '/' . $person->id)->assertOk()->assertJsonPath($photoKey, $path)->assertJsonMissingPath('data.user.password');
        }
    }

    public function test_invalid_and_oversized_uploads_preserve_both_profiles(): void
    {
        foreach (['staff', 'applicant'] as $role) {
            $user = $this->account($role); $person = $this->person($user);
            foreach ([UploadedFile::fake()->create('bad.svg', 1, 'image/svg+xml'), UploadedFile::fake()->create('large.png', 2049, 'image/png')] as $file) {
                $this->actingAs($user)->postJson('/api/' . $role . '/profile', $this->payload($role) + ['profile_photo' => $file])->assertUnprocessable()->assertJsonValidationErrors('profile_photo');
                $this->assertSame('Original', $person->fresh()->first_name);
            }
        }
    }

    public function test_profile_endpoints_reject_other_roles_and_anonymous_uploads(): void
    {
        $this->postJson('/api/staff/profile', ['_method' => 'PUT'])->assertUnauthorized();
        $this->postJson('/api/applicant/profile', ['_method' => 'PUT'])->assertUnauthorized();
        $staff = $this->account('staff'); $this->person($staff);
        $applicant = $this->account('applicant'); $this->person($applicant);
        $this->actingAs($staff)->putJson('/api/applicant/profile', ['first_name' => 'Intruder'])->assertForbidden();
        $this->actingAs($applicant)->putJson('/api/staff/profile', $this->payload('staff'))->assertForbidden();
    }

    public function test_failed_storage_write_does_not_change_profiles(): void
    {
        $disk = \Mockery::mock(\Illuminate\Filesystem\FilesystemAdapter::class);
        $disk->shouldReceive('putFileAs')->twice()->andReturn(false);
        Storage::shouldReceive('disk')->with('public')->andReturn($disk);
        foreach (['staff', 'applicant'] as $role) {
            $user = $this->account($role); $person = $this->person($user);
            ($role === 'staff' ? $user : $person)->update(['profile_photo' => 'existing.png']);
            $this->actingAs($user)->postJson('/api/' . $role . '/profile', $this->payload($role) + ['profile_photo' => UploadedFile::fake()->create('new.png', 10, 'image/png')])->assertStatus(503)->assertJsonPath('success', false);
            $this->assertSame('Original', $person->fresh()->first_name);
            $this->assertSame('existing.png', ($role === 'staff' ? $user : $person)->fresh()->profile_photo);
        }
    }

    public function test_failed_database_update_keeps_original_photo_and_rolls_back_names(): void
    {
        foreach (['staff', 'applicant'] as $role) {
            $user = $this->account($role); $person = $this->person($user);
            $old = $role . '/old.png'; Storage::disk('public')->put($old, 'old');
            ($role === 'staff' ? $user : $person)->update(['profile_photo' => $old]);
            User::updating(function () { throw new \RuntimeException('Simulated write failure'); });
            try {
                $this->actingAs($user)->postJson('/api/' . $role . '/profile', $this->payload($role) + ['profile_photo' => UploadedFile::fake()->create('new.png', 10, 'image/png')])->assertStatus(500);
            } finally { User::flushEventListeners(); }
            $this->assertSame('Original', $person->fresh()->first_name);
            $this->assertSame($old, ($role === 'staff' ? $user : $person)->fresh()->profile_photo);
            Storage::disk('public')->assertExists($old);
        }
        $this->assertCount(2, Storage::disk('public')->allFiles());
    }
}
