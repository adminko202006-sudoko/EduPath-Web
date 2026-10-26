<?php

namespace Tests\Feature;

use App\Models\PasswordResetOtp;
use App\Models\User;
use App\Notifications\PasswordChangedNotification;
use App\Notifications\PasswordResetOtpNotification;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordRecoverySecurityTest extends TestCase
{
    private User $account;

    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default'=>'sqlite', 'database.connections.sqlite.database'=>':memory:', 'cache.default'=>'array']);
        DB::purge('sqlite'); DB::setDefaultConnection('sqlite');
        Notification::fake();
        Schema::create('users', function (Blueprint $t) { $t->id(); $t->string('name'); $t->string('email'); $t->string('password'); $t->string('role'); $t->rememberToken(); $t->timestamps(); });
        Schema::create('password_reset_otps', function (Blueprint $t) { $t->id(); $t->unsignedBigInteger('user_id'); $t->string('email'); $t->string('otp_hash'); $t->timestamp('expires_at'); $t->unsignedInteger('attempts')->default(0); $t->timestamp('verified_at')->nullable(); $t->timestamps(); });
        (require database_path('migrations/2026_10_18_000004_secure_password_reset_credentials.php'))->up();
        Schema::create('personal_access_tokens', function (Blueprint $t) { $t->id(); $t->morphs('tokenable'); $t->string('name'); $t->string('token',64)->unique(); $t->text('abilities')->nullable(); $t->timestamp('last_used_at')->nullable(); $t->timestamp('expires_at')->nullable(); $t->timestamps(); });
        Schema::create('password_reset_tokens', function (Blueprint $t) { $t->string('email')->primary(); $t->string('token'); $t->timestamp('created_at')->nullable(); });
        (require database_path('migrations/2026_09_17_084737_create_staff_table.php'))->up();
        (require database_path('migrations/2026_09_17_103417_create_staff_permissions_table.php'))->up();
        Schema::create('academic_programs', function (Blueprint $t) { $t->id(); $t->string('name'); });
        Schema::create('staff_programs', function (Blueprint $t) { $t->unsignedBigInteger('staff_id'); $t->unsignedBigInteger('academic_program_id'); });
        Schema::create('applicants', function (Blueprint $t) { $t->id(); $t->unsignedBigInteger('user_id'); });
        $this->account=User::create(['name'=>'Test','email'=>'recovery@example.test','password'=>'old-password','role'=>'admin']);
        PasswordResetOtp::create(['user_id'=>$this->account->id,'email'=>$this->account->email,'otp_hash'=>Hash::make('123456'),'expires_at'=>now()->addMinutes(10),'attempts'=>0]);
    }

    private function verify(): string
    {
        return $this->postJson('/api/auth/verify-reset-otp',['email'=>$this->account->email,'otp'=>'123456'])->assertOk()->json('reset_token');
    }

    private function reset(array $extra=[])
    {
        return $this->postJson('/api/auth/reset-password-with-otp',array_merge(['email'=>$this->account->email,'password'=>'new-password','password_confirmation'=>'new-password'],$extra));
    }

    private function staffAccount(string $status = 'active'): void
    {
        $this->account->update(['role' => 'staff']);
        DB::table('staff')->insert(['id' => 1, 'user_id' => $this->account->id, 'employee_id' => 'RECOVERY-STAFF', 'first_name' => 'Staff', 'last_name' => 'Tester', 'status' => $status]);
        DB::table('staff_permissions')->insert(['staff_id' => 1, 'manage_admissions' => true, 'manage_exams' => false]);
        DB::table('academic_programs')->insert(['id' => 1, 'name' => 'Assigned Program']);
        DB::table('staff_programs')->insert(['staff_id' => 1, 'academic_program_id' => 1]);
    }

    public function test_staff_recovery_sends_to_registered_email_and_preserves_admin_managed_access(): void
    {
        $this->staffAccount();
        $staffBefore = DB::table('staff')->first();
        $permissionsBefore = DB::table('staff_permissions')->first();
        $assignmentsBefore = DB::table('staff_programs')->get()->toArray();
        $this->postJson('/api/auth/forgot-password', ['email' => strtoupper($this->account->email), 'notification_email' => 'attacker@example.test'])->assertOk()
            ->assertJsonMissingPath('otp')->assertJsonMissingPath('reset_token');
        $deliveredOtp = null;
        Notification::assertSentTo($this->account, PasswordResetOtpNotification::class, function ($notification, $channels) use (&$deliveredOtp) {
            $mail = $notification->toMail($this->account);
            $deliveredOtp = $mail->introLines[2];
            return $channels === ['mail'] && preg_match('/^\d{6}$/', $deliveredOtp) === 1;
        });
        $this->assertTrue(Hash::check($deliveredOtp, PasswordResetOtp::first()->otp_hash));
        $credential = $this->postJson('/api/auth/verify-reset-otp', ['email' => $this->account->email, 'otp' => $deliveredOtp])->assertOk()->json('reset_token');
        $this->reset(['reset_token' => $credential, 'role' => 'admin', 'status' => 'active', 'manage_exams' => true])->assertOk()->assertJsonMissingPath('token');
        $this->assertSame('staff', $this->account->fresh()->role);
        $this->assertEquals($staffBefore, DB::table('staff')->first());
        $this->assertEquals($permissionsBefore, DB::table('staff_permissions')->first());
        $this->assertEquals($assignmentsBefore, DB::table('staff_programs')->get()->toArray());
        Notification::assertSentToTimes($this->account, PasswordChangedNotification::class, 1);
        $this->postJson('/api/auth/login', ['email' => $this->account->email, 'password' => 'new-password'])->assertOk()->assertJsonPath('user.role', 'staff');
    }

    public function test_disabled_staff_cannot_be_reactivated_by_recovery(): void
    {
        $this->staffAccount('inactive');
        $credential = $this->verify();
        $this->reset(['reset_token' => $credential, 'status' => 'active', 'role' => 'admin'])->assertOk();
        $this->assertDatabaseHas('staff', ['user_id' => $this->account->id, 'status' => 'inactive']);
        $this->postJson('/api/auth/login', ['email' => $this->account->email, 'password' => 'new-password'])->assertUnprocessable();
        $this->assertSame('staff', $this->account->fresh()->role);
        $this->assertSame(0, $this->account->tokens()->count());
    }

    public function test_staff_reset_revokes_only_the_owners_tokens_sessions_and_other_recovery_credentials(): void
    {
        $this->staffAccount();
        config(['session.driver' => 'database', 'session.connection' => 'sqlite']);
        Schema::create('sessions', function (Blueprint $t) { $t->string('id')->primary(); $t->unsignedBigInteger('user_id'); });
        $other = User::create(['name' => 'Other', 'email' => 'other@example.test', 'password' => 'other-password', 'role' => 'admin']);
        $oldToken = $this->account->createToken('web')->plainTextToken;
        $this->account->createToken('mobile'); $other->createToken('other');
        $this->getJson('/api/auth/user', ['Authorization' => 'Bearer '.$oldToken])->assertOk();
        $this->app['auth']->forgetGuards();
        DB::table('sessions')->insert([['id' => 'owner-browser', 'user_id' => $this->account->id], ['id' => 'other-browser', 'user_id' => $other->id]]);
        $legacy = Password::createToken($this->account);
        $credential = $this->verify();
        $this->reset(['reset_token' => $credential])->assertOk();
        $this->assertSame(0, $this->account->tokens()->count());
        $this->assertSame(1, $other->tokens()->count());
        $this->assertDatabaseMissing('sessions', ['id' => 'owner-browser']);
        $this->assertDatabaseHas('sessions', ['id' => 'other-browser']);
        $this->assertFalse(Password::tokenExists($this->account, $legacy));
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/auth/user', ['Authorization' => 'Bearer '.$oldToken])->assertUnauthorized();
        $this->reset(['reset_token' => $credential])->assertUnprocessable();
        Notification::assertSentToTimes($this->account, PasswordChangedNotification::class, 1);
    }

    public function test_password_changed_email_contains_no_password_otp_or_reset_credentials(): void
    {
        $notification = new PasswordChangedNotification();
        $message = $notification->toMail($this->account);
        $body = implode(' ', $message->introLines);
        $this->assertSame(['mail'], $notification->via($this->account));
        $this->assertStringContainsString('contact the Trinidad Municipal College administrator', $body);
        foreach (['old-password', 'new-password', '123456', 'reset_token'] as $secret) $this->assertStringNotContainsString($secret, $body);
    }

    public function test_recovery_mail_failure_rolls_back_changes_instead_of_reporting_success(): void
    {
        $this->staffAccount();
        $credential = $this->verify();
        $this->account->createToken('existing');
        Notification::shouldReceive('send')->andThrow(new \RuntimeException('Simulated private mail transport failure'));
        $this->reset(['reset_token' => $credential])->assertStatus(500)->assertDontSee('private mail transport');
        $this->assertTrue(Hash::check('old-password', $this->account->fresh()->password));
        $this->assertSame(1, $this->account->tokens()->count());
        $this->assertNotNull(PasswordResetOtp::first()->reset_token_hash);
        $this->postJson('/api/auth/forgot-password', ['email' => $this->account->email])->assertStatus(500);
        $this->assertNotNull(PasswordResetOtp::first()->reset_token_hash);
    }

    public function test_staff_otp_expiry_failed_attempt_lockout_and_generic_unknown_account_response(): void
    {
        $this->staffAccount();
        PasswordResetOtp::first()->update(['expires_at' => now()->subSecond()]);
        $this->postJson('/api/auth/verify-reset-otp', ['email' => $this->account->email, 'otp' => '123456'])->assertUnprocessable();
        PasswordResetOtp::first()->update(['expires_at' => now()->addMinutes(10)]);
        for ($i = 0; $i < 5; $i++) $this->postJson('/api/auth/verify-reset-otp', ['email' => $this->account->email, 'otp' => '000000'])->assertUnprocessable();
        $this->postJson('/api/auth/verify-reset-otp', ['email' => $this->account->email, 'otp' => '123456'])->assertUnprocessable();
        $known = $this->postJson('/api/auth/forgot-password', ['email' => $this->account->email])->assertOk();
        $unknown = $this->postJson('/api/auth/forgot-password', ['email' => 'missing@example.test'])->assertOk();
        $this->assertSame($known->json(), $unknown->json());
        Notification::assertCount(1);
        $this->postJson('/api/auth/forgot-password', ['email' => $this->account->email])->assertOk();
        $this->postJson('/api/auth/forgot-password', ['email' => $this->account->email])->assertOk();
        $this->postJson('/api/auth/forgot-password', ['email' => $this->account->email])->assertStatus(429);
    }

    public function test_legacy_reset_link_preserves_staff_status_and_has_the_same_session_cleanup(): void
    {
        $this->staffAccount('inactive');
        $this->account->createToken('existing');
        $token = Password::createToken($this->account);
        $payload = ['email' => $this->account->email, 'token' => $token, 'password' => 'new-password', 'password_confirmation' => 'new-password'];
        $this->postJson('/api/auth/reset-password', $payload)->assertOk();
        $this->assertDatabaseHas('staff', ['user_id' => $this->account->id, 'status' => 'inactive']);
        $this->assertSame(0, $this->account->tokens()->count());
        $this->assertSame(0, PasswordResetOtp::count());
        $this->postJson('/api/auth/reset-password', $payload)->assertUnprocessable();
        Notification::assertSentToTimes($this->account, PasswordChangedNotification::class, 1);
    }

    public function test_verified_email_alone_and_wrong_credentials_cannot_reset_password(): void
    {
        $token=$this->verify();
        $this->assertSame(64,strlen($token));
        $this->assertNotSame($token,PasswordResetOtp::first()->reset_token_hash);
        $this->reset()->assertUnprocessable();
        $this->reset(['reset_token'=>str_repeat('x',64)])->assertUnprocessable();
        $this->assertTrue(Hash::check('old-password',$this->account->fresh()->password));
    }

    public function test_reset_is_single_use_and_revokes_existing_tokens(): void
    {
        $this->account->createToken('old-session');
        $token=$this->verify();
        $this->reset(['reset_token'=>$token])->assertOk();
        $this->assertTrue(Hash::check('new-password',$this->account->fresh()->password));
        $this->assertSame(0,$this->account->tokens()->count());
        $this->assertSame(0,PasswordResetOtp::count());
        $this->reset(['reset_token'=>$token])->assertUnprocessable();
    }

    public function test_reset_is_bound_to_email_and_expiration(): void
    {
        $token=$this->verify();
        $this->reset(['email'=>'another@example.test','reset_token'=>$token])->assertUnprocessable();
        $this->travel(11)->minutes();
        $this->reset(['reset_token'=>$token])->assertUnprocessable();
    }

    public function test_wrong_otp_attempts_persist_and_verification_is_single_use(): void
    {
        for($i=0;$i<5;$i++)$this->postJson('/api/auth/verify-reset-otp',['email'=>$this->account->email,'otp'=>'000000'])->assertUnprocessable();
        $this->assertSame(5,PasswordResetOtp::first()->attempts);
        $this->postJson('/api/auth/verify-reset-otp',['email'=>$this->account->email,'otp'=>'123456'])->assertUnprocessable();
    }

    public function test_login_and_recovery_endpoints_are_rate_limited(): void
    {
        for($i=0;$i<5;$i++)$this->postJson('/api/auth/login',['email'=>$this->account->email,'password'=>'wrong'])->assertUnprocessable();
        $this->postJson('/api/auth/login',['email'=>$this->account->email,'password'=>'wrong'])->assertStatus(429)->assertHeader('Retry-After');
        // Unknown accounts still consume limits without sending email or revealing existence.
        for($i=0;$i<3;$i++)$this->postJson('/api/auth/forgot-password',['email'=>'unknown@example.test'])->assertOk();
        $this->postJson('/api/auth/forgot-password',['email'=>'unknown@example.test'])->assertStatus(429);
    }

    public function test_resend_invalidates_previous_reset_credential_and_verification_cannot_be_replayed(): void
    {
        \Illuminate\Support\Facades\Notification::fake();
        $token=$this->verify();
        $this->postJson('/api/auth/verify-reset-otp',['email'=>$this->account->email,'otp'=>'123456'])->assertUnprocessable();
        $this->postJson('/api/auth/forgot-password',['email'=>$this->account->email])->assertOk();
        $this->assertNull(PasswordResetOtp::first()->verified_at);
        $this->assertNull(PasswordResetOtp::first()->reset_token_hash);
        $this->reset(['reset_token'=>$token])->assertUnprocessable();
    }

    public function test_malformed_auth_input_is_validation_error_not_server_error(): void
    {
        $this->postJson('/api/auth/login',['email'=>['bad'],'password'=>'wrong'])->assertUnprocessable();
        $this->postJson('/api/auth/forgot-password',['email'=>['bad']])->assertUnprocessable();
    }

    public function test_api_server_errors_do_not_expose_private_diagnostics_even_with_debug_enabled(): void
    {
        config(['app.debug'=>true]);
        $this->app['router']->get('/api/_isolated_failure',function(){throw new \RuntimeException('private-SQL-and-filesystem-detail');});
        $this->getJson('/api/_isolated_failure')->assertStatus(500)->assertJsonPath('success',false)->assertJsonMissingPath('trace')->assertDontSee('private-SQL-and-filesystem-detail');
        $this->app['router']->get('/api/_isolated_unavailable',fn()=>abort(503,'private-diagnostic',['Retry-After'=>'30']));
        $this->getJson('/api/_isolated_unavailable')->assertStatus(503)->assertHeader('Retry-After','30')->assertDontSee('private-diagnostic');
    }
}
