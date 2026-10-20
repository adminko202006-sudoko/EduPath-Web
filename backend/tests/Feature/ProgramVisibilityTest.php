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
}
