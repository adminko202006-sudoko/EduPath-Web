<?php

namespace Tests\Feature;

use App\Models\User;
use App\Rules\UniqueAccountEmail;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class AccountEmailUniquenessTest extends TestCase
{
    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:',
            'database.connections.sqlite.foreign_key_constraints' => false, 'cache.default' => 'array', 'onboarding.enroll_new_applicants' => false]);
        DB::purge('sqlite');
        DB::setDefaultConnection('sqlite');
        Schema::create('users', function (Blueprint $t) {
            $t->id(); $t->string('name'); $t->string('email')->unique(); $t->string('password');
            $t->string('role'); $t->string('profile_photo')->nullable(); $t->rememberToken(); $t->timestamps();
        });
        foreach (['2026_08_25_091343_create_applicants_table.php', '2026_08_25_154002_create_personal_access_tokens_table.php',
            '2026_09_17_084737_create_staff_table.php', '2026_09_17_103417_create_staff_permissions_table.php'] as $migration) {
            (require database_path('migrations/'.$migration))->up();
        }
        Schema::create('academic_programs', function (Blueprint $t) { $t->id(); $t->string('name'); });
        Schema::create('staff_programs', function (Blueprint $t) { $t->unsignedBigInteger('staff_id'); $t->unsignedBigInteger('academic_program_id'); });
        $this->admin = $this->account('admin', 'admin@example.test');
    }

    public static function roles(): array
    {
        return [['admin'], ['staff'], ['applicant']];
    }

    private function account(string $role, string $email): User
    {
        $user = User::create(['name' => 'Account '.$role, 'email' => $email, 'password' => 'safe-password', 'role' => $role]);
        if ($role === 'staff') {
            $staffId = DB::table('staff')->insertGetId(['user_id' => $user->id, 'employee_id' => 'STAFF-'.$user->id,
                'first_name' => 'Staff', 'last_name' => 'Tester', 'status' => 'active']);
            DB::table('staff_permissions')->insert(['staff_id' => $staffId]);
        }
        return $user;
    }

    private function registration(string $email): array
    {
        return ['first_name' => 'New', 'last_name' => 'Applicant', 'birth_date' => '2006-01-01',
            'gender' => 'Female', 'phone' => '09123456789', 'address' => 'Trinidad', 'email' => $email,
            'password' => 'safe-password', 'password_confirmation' => 'safe-password'];
    }

    #[DataProvider('roles')]
    public function test_registration_rejects_existing_email_for_every_role_including_legacy_capitalization(string $role): void
    {
        $owner = $this->account($role, 'taken.address@gmail.com');
        // Model writes normalize email; simulate a preserved historical spelling.
        DB::table('users')->where('id', $owner->id)->update(['email' => 'Taken.Address@Gmail.com']);
        foreach (['taken.address@gmail.com', 'TAKEN.ADDRESS@GMAIL.COM', ' taken.address@gmail.com '] as $email) {
            $this->postJson('/api/auth/register', $this->registration($email))->assertUnprocessable()
                ->assertJsonPath('errors.email.0', UniqueAccountEmail::MESSAGE)->assertJsonMissingPath('token');
        }
        $this->assertDatabaseCount('users', 2);
        $this->assertDatabaseCount('applicants', 0);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_available_email_is_normalized_and_saved_once_through_the_shared_web_mobile_registration_api(): void
    {
        $this->postJson('/api/auth/register', $this->registration(' New.Account@Gmail.com '))->assertCreated()
            ->assertJsonPath('user.email', 'new.account@gmail.com')->assertJsonPath('user.role', 'applicant');
        $this->postJson('/api/auth/register', $this->registration('NEW.ACCOUNT@GMAIL.COM'))->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->assertDatabaseCount('users', 2);
        $this->assertDatabaseCount('applicants', 1);
        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    #[DataProvider('roles')]
    public function test_staff_creation_and_all_email_edit_endpoints_reject_another_accounts_email(string $role): void
    {
        $owner = $this->account($role, 'taken.address@gmail.com');
        $staff = $this->account('staff', 'staff@example.test');
        $staffId = $staff->staff->id;
        $this->actingAs($this->admin)->postJson('/api/admin/staff', [
            'name' => 'New Staff', 'first_name' => 'New', 'last_name' => 'Staff', 'email' => 'TAKEN.ADDRESS@GMAIL.COM',
            'employee_id' => 'NEW-STAFF', 'staff_role' => 'Admission Staff', 'password' => 'safe-password',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->postJson('/api/admin/profile', ['email' => 'TAKEN.ADDRESS@GMAIL.COM'])->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->putJson('/api/admin/staff/'.$staffId, ['email' => 'TAKEN.ADDRESS@GMAIL.COM', 'user_id' => $owner->id])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->actingAs($staff)->postJson('/api/staff/profile', [
            'first_name' => 'Staff', 'last_name' => 'Tester', 'email' => 'TAKEN.ADDRESS@GMAIL.COM', 'user_id' => $owner->id,
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->assertSame('staff@example.test', $staff->fresh()->email);
        $this->assertSame('admin@example.test', $this->admin->fresh()->email);
        $this->assertDatabaseCount('users', 3);
    }

    public function test_profile_owners_can_keep_their_own_email_and_new_values_are_normalized(): void
    {
        $staff = $this->account('staff', 'staff@example.test');
        $this->actingAs($this->admin)->postJson('/api/admin/profile', ['email' => ' ADMIN@EXAMPLE.TEST '])->assertOk()
            ->assertJsonPath('data.email', 'admin@example.test');
        $this->actingAs($staff)->postJson('/api/staff/profile', ['first_name' => 'Staff', 'last_name' => 'Tester', 'email' => ' STAFF@EXAMPLE.TEST '])
            ->assertOk()->assertJsonPath('data.user.email', 'staff@example.test');
        $this->actingAs($this->admin)->postJson('/api/admin/profile', ['email' => ' NEW.ADMIN@EXAMPLE.TEST '])->assertOk()
            ->assertJsonPath('data.email', 'new.admin@example.test');
    }

    public function test_database_duplicate_conflicts_remain_safe_email_validation_errors(): void
    {
        config(['app.debug' => true]);
        $this->app['router']->post('/api/_email_unique_race', fn () => User::create([
            'name' => 'Concurrent account', 'email' => ' ADMIN@EXAMPLE.TEST ', 'password' => 'safe-password', 'role' => 'applicant',
        ]));
        $this->postJson('/api/_email_unique_race')->assertUnprocessable()->assertJsonPath('errors.email.0', UniqueAccountEmail::MESSAGE)
            ->assertJsonMissingPath('trace')->assertDontSee('SQLSTATE')->assertDontSee('users_email_unique');
        $this->assertDatabaseCount('users', 1);
    }
}
