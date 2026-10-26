<?php

namespace Tests\Feature;

use App\Models\Applicant;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\Support\InstallsStudentVerificationSchema;
use Tests\TestCase;

class MobileRegistrationDetailsTest extends TestCase
{
    use InstallsStudentVerificationSchema;

    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:',
            'onboarding.enroll_new_applicants' => false, 'cache.default' => 'array']);
        DB::purge('sqlite');
        DB::setDefaultConnection('sqlite');
        $this->withoutMiddleware(ThrottleRequests::class);
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('role');
            $table->rememberToken();
            $table->timestamps();
        });
        foreach (['2026_08_25_091343_create_applicants_table.php', '2026_08_25_154002_create_personal_access_tokens_table.php',
            '2026_09_17_084737_create_staff_table.php', '2026_10_26_110000_add_registration_details_to_applicants_table.php'] as $migration) {
            (require database_path('migrations/'.$migration))->up();
        }
        $this->installStudentVerificationSchema();
        Storage::fake('local');
    }

    private function input(array $details = [], string $type = 'old'): array
    {
        return array_merge($this->studentIdentityInput(), [
            'first_name' => 'Mobile', 'last_name' => 'Student', 'birth_date' => '2006-01-01',
            'gender' => 'Female', 'phone' => '09123456789', 'email' => 'mobile@example.test',
            'password' => 'password-test', 'password_confirmation' => 'password-test',
            'student_type' => $type, 'tmc_student_number' => '2023-123',
            'registration_details' => array_merge(['course_code' => 'BSIT', 'year_level' => '4',
                'has_existing_scholarship' => '1', 'existing_scholarship_name' => '  CHED Merit Scholarship  '], $details),
        ]);
    }

    public function test_multipart_registration_persists_old_student_details_without_granting_verification_or_awards(): void
    {
        $response = $this->post('/api/auth/register', $this->input(), ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('user.applicant.registration_details.course_code', 'BSIT')
            ->assertJsonPath('user.applicant.registration_details.year_level', 4)
            ->assertJsonPath('user.applicant.registration_details.has_existing_scholarship', true)
            ->assertJsonPath('user.applicant.registration_details.existing_scholarship_name', 'CHED Merit Scholarship');
        $applicant = Applicant::findOrFail($response->json('user.applicant.id'));
        $this->assertSame('BSIT', $applicant->registration_details['course_code']);
        $this->assertDatabaseHas('student_verifications', [
            'applicant_id' => $applicant->id, 'status' => 'pending', 'academic_program_id' => null,
        ]);
        $this->assertCount(1, Storage::disk('local')->allFiles('student-identities'));
    }

    public function test_no_scholarship_clears_its_name_and_new_students_do_not_save_old_student_fields(): void
    {
        $this->postJson('/api/auth/register', $this->input(['has_existing_scholarship' => '0'], 'new'))
            ->assertCreated()
            ->assertJsonPath('user.applicant.registration_details.has_existing_scholarship', false)
            ->assertJsonPath('user.applicant.registration_details.existing_scholarship_name', null)
            ->assertJsonMissingPath('user.applicant.registration_details.course_code')
            ->assertJsonMissingPath('user.applicant.registration_details.year_level');
    }

    public function test_old_students_must_supply_a_supported_course_and_year_and_answer_the_scholarship_question(): void
    {
        foreach ([
            ['course_code' => null], ['course_code' => 'UNKNOWN'],
            ['year_level' => null], ['year_level' => 0], ['year_level' => 5], ['year_level' => 1.5],
            ['has_existing_scholarship' => null], ['has_existing_scholarship' => 'maybe'],
            ['existing_scholarship_name' => '   '], ['existing_scholarship_name' => str_repeat('a', 256)],
        ] as $invalid) {
            $this->postJson('/api/auth/register', $this->input($invalid))
                ->assertUnprocessable()->assertJsonValidationErrors('registration_details.'.array_key_first($invalid));
        }
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('applicants', 0);
        $this->assertCount(0, Storage::disk('local')->allFiles('student-identities'));
    }

    public function test_every_requested_course_and_year_is_accepted(): void
    {
        foreach (['BSIT', 'BSOA', 'BSCrim', 'BSPolSci', 'CAS', 'BSED'] as $index => $course) {
            $year = $index % 4 + 1;
            $input = $this->input(['course_code' => $course, 'year_level' => $year, 'has_existing_scholarship' => false]);
            $input['email'] = "course{$index}@example.test";
            $input['lrn'] = str_pad((string) ($index + 1), 12, '0', STR_PAD_LEFT);
            $input['tmc_student_number'] = "TMC{$index}";
            $this->postJson('/api/auth/register', $input)->assertCreated()
                ->assertJsonPath('user.applicant.registration_details.course_code', $course)
                ->assertJsonPath('user.applicant.registration_details.year_level', $year);
        }
    }

    public function test_existing_web_clients_can_still_register_without_the_optional_details_group(): void
    {
        $input = $this->input();
        unset($input['registration_details']);
        $this->postJson('/api/auth/register', $input)->assertCreated()
            ->assertJsonPath('user.applicant.registration_details', null);
    }

    public function test_additive_migration_preserves_existing_applicant_records(): void
    {
        $migration = require database_path('migrations/2026_10_26_110000_add_registration_details_to_applicants_table.php');
        $migration->down();
        $userId = DB::table('users')->insertGetId(['name' => 'Existing Student', 'email' => 'existing@example.test', 'password' => 'test', 'role' => 'applicant']);
        $id = DB::table('applicants')->insertGetId(['user_id' => $userId, 'first_name' => 'Existing', 'last_name' => 'Student']);
        $migration->up();
        $this->assertDatabaseHas('applicants', ['id' => $id, 'first_name' => 'Existing', 'registration_details' => null]);
    }
}
