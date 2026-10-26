<?php

namespace Tests\Feature;

use App\Models\AcademicProgram;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ProgramVisibilityTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => ':memory:',
        ]);
        DB::purge('sqlite');
        DB::setDefaultConnection('sqlite');
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('role');
            $table->timestamps();
        });
        Schema::create('academic_programs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function test_deactivated_program_remains_in_admin_list_and_can_be_reactivated(): void
    {
        $admin = User::create(['name' => 'Admin', 'email' => 'admin@example.test', 'password' => 'password', 'role' => 'admin']);
        $program = AcademicProgram::create(['name' => 'Test Program', 'code' => 'TEST', 'is_active' => true]);
        $this->actingAs($admin, 'sanctum');

        $this->putJson("/api/admin/programs/{$program->id}", ['is_active' => false])
            ->assertOk()->assertJsonPath('data.is_active', false);
        $this->getJson('/api/admin/programs')->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $program->id)
            ->assertJsonPath('data.0.is_active', false);
        $this->getJson('/api/programs')->assertOk()->assertJsonCount(0, 'programs');
        $this->assertDatabaseCount('academic_programs', 1);

        $this->putJson("/api/admin/programs/{$program->id}", ['is_active' => true])
            ->assertOk()->assertJsonPath('data.is_active', true);
        $this->getJson('/api/admin/programs')->assertOk()->assertJsonPath('data.0.is_active', true);
        $this->getJson('/api/programs')->assertOk()->assertJsonPath('programs.0.id', $program->id);
        $this->assertDatabaseCount('academic_programs', 1);
    }

    public function test_inactive_management_list_is_restricted_to_admin(): void
    {
        AcademicProgram::create(['name' => 'Inactive Program', 'code' => 'OFF', 'is_active' => false]);
        $this->getJson('/api/admin/programs')->assertUnauthorized();
        foreach (['applicant', 'staff'] as $role) {
            $user = User::create(['name' => $role, 'email' => "{$role}@example.test", 'password' => 'password', 'role' => $role]);
            $this->actingAs($user, 'sanctum')->getJson('/api/admin/programs')->assertForbidden();
        }
    }

    public function test_admin_requirement_changes_reach_the_mobile_program_endpoint(): void
    {
        Schema::create('admission_requirements', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('file_path')->nullable();
            $table->boolean('is_required')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
        Schema::create('admission_requirement_program', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('admission_requirement_id');
            $table->unsignedBigInteger('academic_program_id');
            $table->timestamps();
        });
        $program = AcademicProgram::create(['name' => 'Assigned Program', 'code' => 'ASSIGNED', 'is_active' => true]);
        $other = AcademicProgram::create(['name' => 'Other Program', 'code' => 'OTHER', 'is_active' => true]);
        $admin = User::create(['name' => 'Admin', 'email' => 'requirements-admin@example.test', 'password' => 'password', 'role' => 'admin']);
        $applicant = User::create(['name' => 'Applicant', 'email' => 'requirements-applicant@example.test', 'password' => 'password', 'role' => 'applicant']);
        $url = "/api/applicant/programs/{$program->id}/requirements";
        $this->getJson($url)->assertUnauthorized();
        $this->actingAs($admin, 'sanctum');
        $created = $this->postJson('/api/admin/requirements', [
            'name' => 'Medical Certificate', 'description' => 'Detailed clinic instructions.',
            'is_required' => true, 'is_active' => true, 'program_ids' => [$program->id],
        ])->assertCreated();
        $id = $created->json('data.id');
        $this->actingAs($applicant, 'sanctum')->getJson($url)->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Medical Certificate')
            ->assertJsonPath('data.0.description', 'Detailed clinic instructions.')
            ->assertJsonPath('data.0.is_required', true);
        $this->getJson("/api/applicant/programs/{$other->id}/requirements")->assertOk()->assertJsonCount(0, 'data');
        $this->postJson('/api/admin/requirements', ['name' => 'Unauthorized'])->assertForbidden();
        $this->actingAs($admin, 'sanctum')->putJson("/api/admin/requirements/{$id}", [
            'name' => 'Updated requirement', 'description' => 'Updated instructions.', 'is_required' => false,
        ])->assertOk();
        $this->actingAs($applicant, 'sanctum')->getJson($url)->assertOk()
            ->assertJsonPath('data.0.name', 'Updated requirement')
            ->assertJsonPath('data.0.description', 'Updated instructions.')
            ->assertJsonPath('data.0.is_required', false);
        $this->actingAs($admin, 'sanctum')->putJson("/api/admin/requirements/{$id}", [
            'name' => 'Updated requirement', 'is_active' => false,
        ])->assertOk();
        $this->actingAs($applicant, 'sanctum')->getJson($url)->assertOk()->assertJsonCount(0, 'data');
    }
}
