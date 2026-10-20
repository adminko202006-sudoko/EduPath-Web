<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminProfileTest extends TestCase
{
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

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('role');
            $table->string('profile_photo')->nullable();
            $table->timestamps();
        });

        Storage::fake('public');
    }

    public function test_admin_can_view_update_and_upload_profile_photo(): void
    {
        $admin = User::create([
            'name' => 'EduPath Admin',
            'email' => 'admin-profile@example.test',
            'password' => 'test-password',
            'role' => 'admin',
        ]);

        $this->actingAs($admin)
            ->getJson('/api/admin/profile')
            ->assertOk()
            ->assertJsonPath('data.name', 'EduPath Admin')
            ->assertJsonPath('data.profile_photo_url', null);

        $this->actingAs($admin)
            ->postJson('/api/admin/profile', [
                'name' => 'Updated EduPath Admin',
                'email' => 'admin-updated@example.test',
                'profile_photo' => UploadedFile::fake()->create('admin-photo.png', 100, 'image/png'),
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Updated EduPath Admin')
            ->assertJsonPath('data.email', 'admin-updated@example.test');

        $admin->refresh();
        $this->assertSame('Updated EduPath Admin', $admin->name);
        $this->assertSame('admin-updated@example.test', $admin->email);
        $this->assertNotEmpty($admin->profile_photo);
        Storage::disk('public')->assertExists($admin->profile_photo);
    }

    public function test_non_admin_cannot_access_admin_profile_endpoint(): void
    {
        $applicant = User::create([
            'name' => 'Applicant User',
            'email' => 'applicant-profile@example.test',
            'password' => 'test-password',
            'role' => 'applicant',
        ]);

        $this->actingAs($applicant)
            ->getJson('/api/admin/profile')
            ->assertForbidden();
    }
}
