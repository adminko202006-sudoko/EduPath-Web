<?php

namespace Tests\Feature;

use App\Services\LocationCatalog;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class RegistrationAddressTest extends TestCase
{
    use \Tests\Support\InstallsStudentVerificationSchema;
    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:',
            'onboarding.enroll_new_applicants' => false, 'cache.default' => 'array']);
        DB::purge('sqlite');
        DB::setDefaultConnection('sqlite');
        // Exercise all validation cases without exhausting the production signup limiter.
        $this->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class);
        Schema::create('users', function (Blueprint $table) {
            $table->id(); $table->string('name'); $table->string('email')->unique();
            $table->string('password'); $table->string('role'); $table->rememberToken(); $table->timestamps();
        });
        foreach (['2026_08_25_091343_create_applicants_table.php', '2026_08_25_154002_create_personal_access_tokens_table.php',
            '2026_09_17_084737_create_staff_table.php'] as $migration) {
            (require database_path('migrations/'.$migration))->up();
        }
        $this->installStudentVerificationSchema();
        \Illuminate\Support\Facades\Storage::fake('local');
    }

    private function input(array $parts = []): array
    {
        return array_merge($this->studentIdentityInput(), ['first_name' => 'Address', 'last_name' => 'Tester', 'birth_date' => '2006-01-01',
            'gender' => 'Female', 'phone' => '09000000000', 'email' => 'address@example.test',
            'password' => 'password-example', 'password_confirmation' => 'password-example',
            'address_components' => array_merge(['country_code' => 'PH', 'province_id' => '0701200000',
                'city_id' => '0701244000', 'street' => '24 Rizal Street, Poblacion'], $parts)]);
    }

    public function test_public_lookups_filter_cities_by_country_and_province(): void
    {
        $this->getJson('/api/locations/countries')->assertOk()->assertJsonCount(250, 'data')
            ->assertHeader('Cache-Control', 'max-age=86400, public');
        $this->getJson('/api/locations/countries/PH/provinces')->assertOk()
            ->assertJsonFragment(['id' => '0701200000', 'name' => 'Bohol']);
        $this->getJson('/api/locations/countries/PH/cities?province_id=0701200000')->assertOk()
            ->assertJsonCount(48, 'data')->assertJsonFragment(['id' => '0701244000', 'name' => 'Trinidad', 'province_id' => '0701200000']);
        $this->getJson('/api/locations/countries/US/cities?province_id=0701200000')->assertUnprocessable();
        $this->getJson('/api/locations/countries/XX/provinces')->assertUnprocessable();
        $this->getJson('/api/locations/countries/PH/cities?province_id[]=0701200000')->assertUnprocessable();
    }

    public function test_registration_resolves_selected_ids_to_canonical_names(): void
    {
        $input = $this->input(['province' => 'Wrong label', 'city' => 'Wrong label']);
        $input['address'] = 'Do not trust client formatted address';
        $this->postJson('/api/auth/register', $input)->assertCreated()
            ->assertJsonPath('user.applicant.address', '24 Rizal Street, Poblacion, Trinidad, Bohol, Philippines');
        $this->assertDatabaseHas('applicants', ['address' => '24 Rizal Street, Poblacion, Trinidad, Bohol, Philippines']);
        $this->assertDatabaseCount('users', 1);
    }

    public function test_ncr_cities_use_their_actual_region_and_exclude_manila_districts(): void
    {
        $response = $this->getJson('/api/locations/countries/PH/cities?province_id=1300000000')->assertOk();
        $response->assertJsonCount(17, 'data')->assertJsonFragment(['name' => 'City of Manila'])
            ->assertJsonMissing(['name' => 'Tondo I/II']);
        $this->postJson('/api/auth/register', $this->input(['province_id' => '1300000000', 'city_id' => '1380600000']))
            ->assertCreated()->assertJsonPath('user.applicant.address', '24 Rizal Street, Poblacion, City of Manila, National Capital Region (NCR), Philippines');
    }

    public function test_cross_country_and_cross_province_selections_do_not_create_accounts(): void
    {
        foreach ([['country_code' => 'US'], ['province_id' => '0702200000'], ['city_id' => '999999999'], ['country_code' => '../']] as $parts) {
            $this->postJson('/api/auth/register', $this->input($parts))->assertUnprocessable()->assertJsonMissingPath('token');
        }
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('applicants', 0);
    }

    public function test_manual_entry_supports_missing_locations_without_fabricating_catalog_ids(): void
    {
        $this->postJson('/api/auth/register', $this->input(['province_id' => null, 'city_id' => null,
            'province' => 'New Province', 'city' => 'New Municipality']))->assertCreated()
            ->assertJsonPath('user.applicant.address', '24 Rizal Street, Poblacion, New Municipality, New Province, Philippines');
    }

    public function test_missing_and_malformed_address_parts_are_rejected(): void
    {
        foreach ([['street' => '   '], ['city_id' => null], ['province_id' => null, 'city_id' => null, 'city' => 'Test'],
            ['street' => str_repeat('a', 201)], ['city' => ['bad']], ['extra_key' => 'bad']] as $parts) {
            $this->postJson('/api/auth/register', $this->input($parts))->assertUnprocessable();
        }
        $this->assertDatabaseCount('users', 0);
    }

    public function test_registration_requires_a_structured_philippine_address(): void
    {
        $input = $this->input();
        unset($input['address_components']);
        $input['address'] = 'Preserved legacy address';
        $this->postJson('/api/auth/register', $input)->assertUnprocessable()->assertJsonValidationErrors('address_components');
    }

    public function test_registration_rejects_non_philippine_countries_even_with_valid_catalog_codes(): void
    {
        $code = collect(app(LocationCatalog::class)->countries())->first(function ($country) {
            return app(LocationCatalog::class)->country($country['id'])['provinces'] === [];
        })['id'];
        $this->postJson('/api/auth/register', $this->input(['country_code' => $code, 'province_id' => null,
            'city_id' => null, 'city' => 'Local town']))->assertUnprocessable()->assertJsonValidationErrors('address_components.country_code');
    }

    public function test_complete_address_length_is_checked_after_formatting(): void
    {
        $this->postJson('/api/auth/register', $this->input(['street' => str_repeat('a', 200),
            'province_id' => null, 'city_id' => null, 'province' => str_repeat('b', 150), 'city' => str_repeat('c', 150)]))
            ->assertUnprocessable()->assertJsonValidationErrors('address_components.street');
        $this->assertDatabaseCount('users', 0);
    }

    public function test_future_birth_dates_and_oversized_combined_names_do_not_create_accounts(): void
    {
        $input = $this->input();
        $input['birth_date'] = now()->addDay()->toDateString();
        $this->postJson('/api/auth/register', $input)->assertUnprocessable()
            ->assertJsonValidationErrors('birth_date')->assertJsonMissingPath('token');

        $input = $this->input();
        $input['first_name'] = str_repeat('a', 200);
        $input['last_name'] = str_repeat('b', 100);
        $this->postJson('/api/auth/register', $input)->assertUnprocessable()
            ->assertJsonValidationErrors('first_name')->assertJsonMissingPath('token');

        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('applicants', 0);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_registration_ignores_privileged_fields_and_returns_a_usable_applicant_session(): void
    {
        $input = array_merge($this->input(), ['role' => 'admin', 'user_id' => 999, 'email_verified_at' => now()->toDateTimeString()]);
        $response = $this->postJson('/api/auth/register', $input)->assertCreated()
            ->assertJsonPath('user.role', 'applicant')->assertJsonMissingPath('user.password')
            ->assertJsonMissingPath('user.remember_token');
        $this->assertDatabaseHas('applicants', ['user_id' => $response->json('user.id')]);
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check($input['password'], DB::table('users')->value('password')));
        $this->withToken($response->json('token'))->getJson('/api/auth/user')->assertOk()
            ->assertJsonFragment(['role' => 'applicant']);
    }
}
