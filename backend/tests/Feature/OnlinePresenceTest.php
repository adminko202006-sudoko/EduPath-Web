<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\OnlinePresence;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class OnlinePresenceTest extends TestCase
{
    private User $admin;
    private User $applicant;
    private User $staff;
    private string $adminToken;
    private string $applicantToken;
    private string $staffToken;

    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:', 'cache.default' => 'array', 'sanctum.expiration' => null]);
        DB::purge('sqlite'); DB::setDefaultConnection('sqlite');
        Schema::create('users', function (Blueprint $table) {
            $table->id(); $table->string('name'); $table->string('email')->unique(); $table->string('password'); $table->string('role'); $table->rememberToken(); $table->timestamps();
        });
        Schema::create('staff', function (Blueprint $table) { $table->id(); $table->unsignedBigInteger('user_id'); $table->string('status'); });
        (require database_path('migrations/2026_08_25_154002_create_personal_access_tokens_table.php'))->up();
        foreach (['admin', 'applicant', 'staff'] as $role) {
            $this->$role = User::create(['name' => $role, 'email' => $role.'@example.test', 'password' => 'test-password', 'role' => $role]);
            $property = $role.'Token';
            $this->$property = $this->$role->createToken('presence-test')->plainTextToken;
        }
        DB::table('staff')->insert(['user_id' => $this->staff->id, 'status' => 'active']);
    }

    private function requestAs(?string $token, string $method, string $uri, array $data = [])
    {
        app('auth')->forgetGuards();
        return $this->withHeader('Authorization', $token ? 'Bearer '.$token : '')->json($method, $uri, $data);
    }

    private function onlineStatus(int $id): bool
    {
        return $this->requestAs($this->adminToken, 'GET', '/api/admin/presence?'.http_build_query(['user_ids' => [$id]]))
            ->assertOk()->assertHeader('Cache-Control', 'no-store, private')->json('data.'.$id);
    }

    public function test_only_authenticated_clients_can_pulse_and_only_admin_can_read_presence(): void
    {
        $this->requestAs(null, 'POST', '/api/auth/presence')->assertUnauthorized();
        $this->requestAs(null, 'GET', '/api/admin/presence?user_ids[]=1')->assertUnauthorized();
        foreach ([$this->applicantToken, $this->staffToken] as $token) {
            $this->requestAs($token, 'GET', '/api/admin/presence?user_ids[]=1')->assertForbidden();
        }
        $this->requestAs($this->adminToken, 'GET', '/api/admin/presence?user_ids[]=0')->assertUnprocessable();
        $this->requestAs($this->adminToken, 'GET', '/api/admin/presence?user_ids=bad')->assertUnprocessable();
    }

    public function test_green_state_is_recent_activity_not_just_an_active_account_and_cannot_be_spoofed(): void
    {
        $this->assertFalse($this->onlineStatus($this->staff->id));
        $this->requestAs($this->applicantToken, 'POST', '/api/auth/presence', ['user_id' => $this->staff->id, 'is_online' => true])->assertOk();
        $this->assertTrue($this->onlineStatus($this->applicant->id));
        $this->assertFalse($this->onlineStatus($this->staff->id));
        $this->travel(OnlinePresence::TTL_SECONDS + 1)->seconds();
        $this->assertFalse($this->onlineStatus($this->applicant->id));
    }

    public function test_logging_out_one_device_does_not_hide_another_online_device(): void
    {
        $second = $this->applicant->createToken('second-device')->plainTextToken;
        foreach ([$this->applicantToken, $second] as $token) $this->requestAs($token, 'POST', '/api/auth/presence')->assertOk();
        $this->requestAs($this->applicantToken, 'POST', '/api/auth/logout')->assertOk();
        $this->assertTrue($this->onlineStatus($this->applicant->id));
        $this->requestAs($second, 'POST', '/api/auth/logout')->assertOk();
        $this->assertFalse($this->onlineStatus($this->applicant->id));
        $this->requestAs($second, 'POST', '/api/auth/presence')->assertUnauthorized();
    }

    public function test_deactivated_staff_and_expired_tokens_never_appear_online(): void
    {
        $this->requestAs($this->staffToken, 'POST', '/api/auth/presence')->assertOk();
        $this->assertTrue($this->onlineStatus($this->staff->id));
        DB::table('staff')->where('user_id', $this->staff->id)->update(['status' => 'inactive']);
        $this->assertFalse($this->onlineStatus($this->staff->id));
        $this->requestAs($this->staffToken, 'POST', '/api/auth/presence')->assertForbidden();
        $this->requestAs($this->applicantToken, 'POST', '/api/auth/presence')->assertOk();
        $this->applicant->tokens()->update(['expires_at' => now()->subSecond()]);
        $this->assertFalse($this->onlineStatus($this->applicant->id));
    }

    public function test_missing_unknown_and_admin_accounts_do_not_leak_data(): void
    {
        $this->assertFalse($this->onlineStatus(99999));
        $this->requestAs($this->adminToken, 'POST', '/api/auth/presence')->assertOk();
        $this->assertFalse($this->onlineStatus($this->admin->id));
        Cache::flush();
        $this->assertFalse($this->onlineStatus($this->applicant->id));
    }
}
