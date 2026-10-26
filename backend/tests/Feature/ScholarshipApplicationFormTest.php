<?php

namespace Tests\Feature;

use App\Models\Applicant;
use App\Models\Scholarship;
use App\Models\ScholarshipApplication;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Tests\Support\InstallsWorkflowSchema;

class ScholarshipApplicationFormTest extends TestCase
{
    use InstallsWorkflowSchema;
    use \Tests\Support\InstallsStudentVerificationSchema;
    private User $owner;
    private Applicant $applicant;
    private Scholarship $scholarship;

    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:', 'database.connections.sqlite.foreign_key_constraints' => false]);
        DB::purge('sqlite'); DB::setDefaultConnection('sqlite');
        Schema::create('users', function (Blueprint $t) { $t->id(); $t->string('name'); $t->string('email')->unique(); $t->string('password'); $t->string('role'); $t->timestamps(); });
        Schema::create('applicants', function (Blueprint $t) { $t->id(); $t->unsignedBigInteger('user_id'); $t->string('first_name')->nullable(); $t->string('last_name')->nullable(); $t->timestamps(); });
        Schema::create('admission_applications', function (Blueprint $t) { $t->id(); $t->unsignedBigInteger('applicant_id'); $t->unsignedBigInteger('academic_program_id'); $t->string('status'); $t->timestamps(); });
        Schema::create('scholarships', function (Blueprint $t) { $t->id(); $t->string('name'); $t->string('category')->default('other'); $t->boolean('is_active')->default(true); $t->boolean('admission_approval_required')->default(true); $t->date('application_start')->nullable(); $t->date('application_end')->nullable(); $t->timestamp('application_start_at')->nullable(); $t->timestamp('application_end_at')->nullable(); $t->timestamps(); });
        (require database_path('migrations/2026_08_25_091346_create_admission_requirements_table.php'))->up();
        \App\Models\AdmissionRequirement::create(['name' => 'Grade slip', 'is_active' => true]);
        \App\Models\AdmissionRequirement::create(['name' => 'New requirement', 'is_active' => true]);
        (require database_path('migrations/2026_08_25_091348_create_scholarship_applications_table.php'))->up();
        (require database_path('migrations/2026_10_24_000001_add_scholarship_applicant_details.php'))->up();
        (require database_path('migrations/2026_10_26_000001_add_scholarship_required_documents.php'))->up();
        (require database_path('migrations/2026_09_17_084737_create_staff_table.php'))->up();
        (require database_path('migrations/2026_09_17_103417_create_staff_permissions_table.php'))->up();
        Schema::create('academic_programs', function (Blueprint $t) { $t->id(); $t->string('name'); });
        Schema::create('staff_programs', function (Blueprint $t) { $t->unsignedBigInteger('staff_id'); $t->unsignedBigInteger('academic_program_id'); });
        $this->installWorkflowSchema();
        Storage::fake('local'); Storage::fake('public');
        $this->owner = $this->user('applicant', 'owner');
        $this->applicant = Applicant::create(['user_id' => $this->owner->id, 'first_name' => 'Test', 'last_name' => 'Applicant']);
        $this->verifiedStudent($this->owner);
        DB::table('admission_applications')->insert(['applicant_id' => $this->applicant->id, 'academic_program_id' => 1, 'status' => 'approved']);
        $this->scholarship = Scholarship::create(['name' => 'Test scholarship', 'is_active' => true, 'admission_approval_required' => true]);
    }

    private function user(string $role, string $name): User
    {
        return User::create(['name' => $name, 'email' => "$name@example.test", 'password' => 'test-password', 'role' => $role]);
    }

    private function answers(): array
    {
        return ['academic_average' => '1.75', 'grading_scale' => 'grade_point', 'year_level' => 'Incoming Freshman', 'income_range' => 'under_100000', 'household_size' => 4, 'motivation' => 'This assistance will support my education.', 'additional_notes' => 'Applicant note'];
    }

    private function endpoint(): string { return '/api/applicant/scholarships/'.$this->scholarship->id.'/apply'; }

    public function test_selected_requirements_are_enforced_and_saved_privately_with_the_application(): void
    {
        $this->scholarship->update(['required_documents' => ['Grade slip', 'Proof of income']]);
        $this->actingAs($this->owner)->postJson($this->endpoint(), ['application_details' => $this->answers()])
            ->assertUnprocessable()->assertJsonValidationErrors('requirement_documents');
        $this->assertDatabaseCount('scholarship_applications', 0);
        $response = $this->postJson($this->endpoint(), [
            'application_details' => $this->answers(),
            'requirement_documents' => [UploadedFile::fake()->create('grades.pdf', 20, 'application/pdf'), UploadedFile::fake()->create('income.pdf', 20, 'application/pdf')],
        ])->assertCreated()->assertJsonPath('data.submitted_requirements.0.requirement', 'Grade slip')
            ->assertJsonPath('data.submitted_requirements.1.name', 'income.pdf')->assertJsonMissingPath('data.requirement_documents');
        $id = $response->json('data.id');
        $this->get("/api/scholarship-applications/$id/requirements/0")->assertOk();
        $this->getJson("/api/scholarship-applications/$id/requirements/9")->assertNotFound();
        $other = $this->user('applicant', 'other-upload');
        Applicant::create(['user_id' => $other->id, 'first_name' => 'Other']);
        $this->actingAs($other)->getJson("/api/scholarship-applications/$id/requirements/0")->assertForbidden();
        $admin = $this->user('admin', 'upload-admin');
        $this->actingAs($admin)->get("/api/scholarship-applications/$id/requirements/1")->assertOk();
        $this->assertEmpty(Storage::disk('public')->allFiles());
        $this->assertCount(2, Storage::disk('local')->allFiles('scholarship-documents'));
    }

    public function test_requirement_files_reject_wrong_indices_types_and_oversized_uploads(): void
    {
        $this->scholarship->update(['required_documents' => ['Grade slip']]);
        $this->actingAs($this->owner);
        foreach ([
            [1 => UploadedFile::fake()->create('grades.pdf', 20, 'application/pdf')],
            [UploadedFile::fake()->create('script.exe', 20, 'application/octet-stream')],
            [UploadedFile::fake()->create('large.pdf', 5121, 'application/pdf')],
        ] as $files) {
            $this->postJson($this->endpoint(), ['requirement_documents' => $files])->assertUnprocessable();
        }
        $this->assertDatabaseCount('scholarship_applications', 0);
        $this->assertEmpty(Storage::disk('local')->allFiles('scholarship-documents'));
    }

    public function test_failed_application_cleans_up_all_new_requirement_files(): void
    {
        $this->scholarship->update(['required_documents' => ['Grade slip', 'Income']]);
        ScholarshipApplication::creating(fn () => throw new \RuntimeException('Injected failure'));
        try {
            $this->actingAs($this->owner)->postJson($this->endpoint(), ['requirement_documents' => [
                UploadedFile::fake()->create('grades.pdf', 20, 'application/pdf'), UploadedFile::fake()->create('income.pdf', 20, 'application/pdf'),
            ]])->assertStatus(500);
        } finally { ScholarshipApplication::flushEventListeners(); }
        $this->assertDatabaseCount('scholarship_applications', 0);
        $this->assertEmpty(Storage::disk('local')->allFiles('scholarship-documents'));
    }

    public function test_only_admin_can_configure_requirements_and_invalid_lists_are_rejected(): void
    {
        $url = '/api/admin/scholarships/'.$this->scholarship->id;
        $this->actingAs($this->owner)->putJson($url, ['required_documents' => ['Grade slip']])->assertForbidden();
        $this->actingAs($this->user('admin', 'requirements-admin'));
        \App\Models\AdmissionRequirement::create(['name' => 'Inactive document', 'is_active' => false]);
        foreach ([['Grade slip', 'grade slip'], [''], ['   '], array_fill(0, 11, 'Requirement'), ['Not in Requirement List'], ['Inactive document']] as $names) {
            $this->putJson($url, ['required_documents' => $names])->assertUnprocessable();
            $this->postJson('/api/admin/scholarships', ['name' => 'Invalid requirements', 'category' => 'other', 'required_documents' => $names])->assertUnprocessable();
        }
        $this->assertNull($this->scholarship->fresh()->required_documents);
    }

    public function test_admin_can_save_selected_documents_and_existing_submissions_keep_their_snapshot(): void
    {
        Schema::create('online_exam_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('required_question_count')->default(100);
            $table->unsignedInteger('seconds_per_question')->default(60);
        });
        Schema::table('scholarships', function (Blueprint $table) {
            $table->boolean('requires_online_exam')->default(false);
            $table->boolean('requires_face_to_face_exam')->default(false);
            $table->boolean('unlimited_awards')->default(true);
            $table->integer('available_slots')->nullable();
            $table->integer('exam_question_count')->nullable();
            $table->integer('exam_seconds_per_question')->nullable();
            $table->integer('exam_passing_score')->nullable();
        });
        $admin = $this->user('admin', 'configure-admin');
        $url = '/api/admin/scholarships/'.$this->scholarship->id;
        $this->actingAs($admin)->putJson($url, ['required_documents' => ['Grade slip']])
            ->assertOk()->assertJsonPath('data.required_documents', ['Grade slip']);
        $submission = $this->actingAs($this->owner)->postJson($this->endpoint(), [
            'requirement_documents' => [UploadedFile::fake()->create('grades.pdf', 20, 'application/pdf')],
        ])->assertCreated();
        $this->actingAs($admin)->putJson($url, ['required_documents' => ['New requirement']])->assertOk();
        $application = ScholarshipApplication::findOrFail($submission->json('data.id'));
        $this->assertSame('Grade slip', $application->submitted_requirements[0]['requirement']);
        $this->actingAs($this->owner)->get('/api/scholarship-applications/'.$application->id.'/requirements/0')->assertOk();
        // A renamed, removed or inactive catalog entry must not silently erase
        // requirements already saved on a scholarship or submitted application.
        \App\Models\AdmissionRequirement::where('name', 'New requirement')->update(['is_active' => false]);
        $this->actingAs($admin)->putJson($url, ['required_documents' => ['New requirement']])->assertOk();
        $this->putJson($url, ['required_documents' => []])->assertOk()->assertJsonPath('data.required_documents', []);
        $this->putJson($url, ['required_documents' => ['New requirement']])->assertUnprocessable()->assertJsonValidationErrors('required_documents.0');
        $this->assertSame('Grade slip', $application->fresh()->submitted_requirements[0]['requirement']);
    }

    public function test_new_form_stores_private_attachment_and_separate_applicant_answers(): void
    {
        $response = $this->actingAs($this->owner)->postJson($this->endpoint(), [
            'application_details' => $this->answers(), 'remarks' => 'Must not become reviewer remarks',
            'supporting_document' => UploadedFile::fake()->create('grades.pdf', 30, 'application/pdf'),
            'status' => 'approved',
        ])->assertCreated()->assertJsonPath('data.status', 'pending')->assertJsonPath('data.remarks', null)
            ->assertJsonPath('data.application_details.household_size', 4)->assertJsonPath('data.supporting_document_name', 'grades.pdf')
            ->assertJsonPath('data.application_details.year_level', 'Incoming Freshman')
            ->assertJsonMissingPath('data.supporting_document_path');
        $application = ScholarshipApplication::findOrFail($response->json('data.id'));
        Storage::disk('local')->assertExists($application->getRawOriginal('supporting_document_path'));
        $this->assertEmpty(Storage::disk('public')->allFiles());
        $this->get('/api/scholarship-applications/'.$application->id.'/attachment')->assertOk();
        $this->getJson('/api/applicant/scholarship-applications/'.$application->id)->assertOk()->assertJsonPath('data.application_details.motivation', $this->answers()['motivation']);
    }

    public function test_graduate_choice_is_rejected_for_new_forms_and_existing_answers_remain_readable(): void
    {
        $answers = array_replace($this->answers(), ['year_level' => 'Graduate / Post-graduate']);
        $this->actingAs($this->owner)->postJson($this->endpoint(), ['application_details' => $answers])
            ->assertUnprocessable()->assertJsonValidationErrors('application_details.year_level');
        $this->assertDatabaseCount('scholarship_applications', 0);

        $existing = ScholarshipApplication::create([
            'applicant_id' => $this->applicant->id,
            'scholarship_id' => $this->scholarship->id,
            'status' => 'pending',
            'application_details' => $answers,
        ]);
        $this->getJson('/api/applicant/scholarship-applications/'.$existing->id)
            ->assertOk()->assertJsonPath('data.application_details.year_level', 'Graduate / Post-graduate');
        $this->assertSame($answers, $existing->fresh()->application_details);
    }

    public function test_validation_rejects_missing_choices_invalid_household_and_unsupported_files_without_saving(): void
    {
        $this->actingAs($this->owner);
        foreach (['year_level' => '', 'income_range' => '', 'grading_scale' => '', 'household_size' => 0, 'academic_average' => -1, 'motivation' => 'short'] as $field => $bad) {
            $this->postJson($this->endpoint(), ['application_details' => array_replace($this->answers(), [$field => $bad])])
                ->assertUnprocessable()->assertJsonValidationErrors('application_details.'.$field);
        }
        $this->postJson($this->endpoint(), ['application_details' => $this->answers(), 'supporting_document' => UploadedFile::fake()->create('script.exe', 10, 'application/octet-stream')])->assertUnprocessable();
        $this->postJson($this->endpoint(), ['application_details' => $this->answers(), 'supporting_document' => UploadedFile::fake()->create('huge.pdf', 5121, 'application/pdf')])->assertUnprocessable();
        $this->assertDatabaseCount('scholarship_applications', 0);
        $this->assertEmpty(Storage::disk('local')->allFiles('scholarship-documents'));
    }

    public function test_multipart_numeric_answers_match_the_json_contract(): void
    {
        $answers = array_replace($this->answers(), ['household_size' => '5', 'academic_average' => '92.5', 'grading_scale' => 'percentage']);
        $this->actingAs($this->owner)->post($this->endpoint(), ['application_details' => $answers, 'supporting_document' => UploadedFile::fake()->create('grades.pdf', 30, 'application/pdf')], ['Accept' => 'application/json'])
            ->assertCreated()->assertJsonPath('data.application_details.household_size', 5)
            ->assertJsonPath('data.application_details.academic_average', 92.5);
    }

    public function test_file_storage_failure_never_creates_an_application(): void
    {
        $disk = \Mockery::mock(FilesystemAdapter::class);
        $disk->shouldReceive('putFileAs')->once()->andReturn(false);
        Storage::shouldReceive('disk')->with('local')->andReturn($disk);
        $this->actingAs($this->owner)->postJson($this->endpoint(), ['application_details' => $this->answers(), 'supporting_document' => UploadedFile::fake()->create('grades.pdf', 30, 'application/pdf')])
            ->assertStatus(503)->assertJsonPath('success', false);
        $this->assertDatabaseCount('scholarship_applications', 0);
    }

    public function test_database_failure_removes_only_the_new_attachment_and_retry_succeeds(): void
    {
        Storage::disk('local')->put('scholarship-documents/existing-file.pdf', 'preserve');
        ScholarshipApplication::creating(fn () => throw new \RuntimeException('Injected failure'));
        try {
            $this->actingAs($this->owner)->postJson($this->endpoint(), ['application_details' => $this->answers(), 'supporting_document' => UploadedFile::fake()->create('grades.pdf', 30, 'application/pdf')])->assertStatus(500);
        } finally { ScholarshipApplication::flushEventListeners(); }
        $this->assertDatabaseCount('scholarship_applications', 0);
        $this->assertSame(['scholarship-documents/existing-file.pdf'], Storage::disk('local')->allFiles('scholarship-documents'));
        $this->postJson($this->endpoint(), ['application_details' => $this->answers()])->assertCreated();
        $this->postJson($this->endpoint(), ['application_details' => $this->answers()])->assertStatus(409);
        $this->assertDatabaseCount('scholarship_applications', 1);
    }

    public function test_admission_revoked_during_upload_blocks_submission_and_cleans_up_new_file(): void
    {
        $disk = \Mockery::mock(FilesystemAdapter::class);
        $disk->shouldReceive('putFileAs')->once()->andReturnUsing(function () {
            DB::table('admission_applications')->update(['status' => 'pending']);
            return 'scholarship-documents/new.pdf';
        });
        $disk->shouldReceive('delete')->once()->with('scholarship-documents/new.pdf')->andReturn(true);
        Storage::shouldReceive('disk')->with('local')->andReturn($disk);
        $this->actingAs($this->owner)->postJson($this->endpoint(), ['application_details' => $this->answers(), 'supporting_document' => UploadedFile::fake()->create('grades.pdf', 30, 'application/pdf')])
            ->assertUnprocessable()->assertJsonValidationErrors('admission');
        $this->assertDatabaseCount('scholarship_applications', 0);
    }

    public function test_migration_preserves_legacy_rows_and_does_not_parse_or_rewrite_remarks(): void
    {
        Schema::table('scholarship_applications', fn (Blueprint $table) => $table->dropColumn(['application_details', 'supporting_document_path', 'supporting_document_name']));
        $id = DB::table('scholarship_applications')->insertGetId(['applicant_id' => $this->applicant->id, 'scholarship_id' => $this->scholarship->id, 'status' => 'under_review', 'remarks' => 'GWA: 1.75; legacy text to preserve']);
        (require database_path('migrations/2026_10_24_000001_add_scholarship_applicant_details.php'))->up();
        $application = ScholarshipApplication::findOrFail($id);
        $this->assertSame('under_review', $application->status);
        $this->assertSame('GWA: 1.75; legacy text to preserve', $application->remarks);
        $this->assertNull($application->application_details);
        $this->assertDatabaseCount('scholarship_applications', 1);
    }

    public function test_review_does_not_overwrite_applicant_answers_and_legacy_submissions_still_work(): void
    {
        $id = $this->actingAs($this->owner)->postJson($this->endpoint(), ['application_details' => $this->answers()])->assertCreated()->json('data.id');
        $this->actingAs($this->user('admin', 'administrator'))->putJson('/api/admin/scholarship-applications/'.$id, [
            'status' => 'under_review', 'remarks' => 'Reviewer feedback', 'application_details' => ['motivation' => 'Overwrite'],
        ])->assertOk();
        $application = ScholarshipApplication::findOrFail($id);
        $this->assertSame($this->answers()['motivation'], $application->application_details['motivation']);
        $this->assertSame('Reviewer feedback', $application->remarks);
        $other = Scholarship::create(['name' => 'Legacy scholarship', 'is_active' => true, 'admission_approval_required' => true]);
        $this->actingAs($this->owner)->postJson('/api/applicant/scholarships/'.$other->id.'/apply', ['remarks' => 'Preserved legacy input'])->assertCreated()->assertJsonPath('data.remarks', 'Preserved legacy input');
    }

    public function test_attachment_requires_authentication_ownership_or_scoped_staff_permission(): void
    {
        $application = ScholarshipApplication::create(['applicant_id' => $this->applicant->id, 'scholarship_id' => $this->scholarship->id, 'supporting_document_path' => 'scholarship-documents/test.pdf', 'supporting_document_name' => 'test.pdf']);
        Storage::disk('local')->put('scholarship-documents/test.pdf', '%PDF-test');
        $url = '/api/scholarship-applications/'.$application->id.'/attachment';
        $this->getJson($url)->assertUnauthorized();
        $other = $this->user('applicant', 'other');
        Applicant::create(['user_id' => $other->id]);
        $this->actingAs($other)->getJson($url)->assertForbidden();
        $this->actingAs($this->user('admin', 'admin'))->get($url)->assertOk();
        $staff = $this->user('staff', 'staff');
        $profile = \App\Models\Staff::create(['user_id' => $staff->id, 'employee_id' => 'TEST', 'first_name' => 'Staff', 'last_name' => 'Test', 'status' => 'active']);
        $permission = \App\Models\StaffPermission::create(['staff_id' => $profile->id, 'manage_scholarships' => false]);
        DB::table('academic_programs')->insert(['id' => 1, 'name' => 'Program']);
        $profile->academicPrograms()->sync([1]);
        $this->actingAs($staff->fresh())->getJson($url)->assertForbidden();
        $permission->update(['manage_scholarships' => true]);
        $this->actingAs($staff->fresh())->get($url)->assertOk();
        $profile->academicPrograms()->sync([]);
        $this->actingAs($staff->fresh())->getJson($url)->assertForbidden();
        $profile->academicPrograms()->sync([1]); $profile->update(['status' => 'inactive']);
        $this->actingAs($staff->fresh())->getJson($url)->assertForbidden();
    }

    public function test_eligibility_periods_and_server_status_rules_remain_enforced(): void
    {
        $this->actingAs($this->owner);
        DB::table('admission_applications')->update(['status' => 'pending']);
        $this->postJson($this->endpoint(), ['application_details' => $this->answers()])->assertForbidden();
        DB::table('admission_applications')->update(['status' => 'approved']);
        $this->scholarship->update(['application_end_at' => now()->subMinute()]);
        $this->postJson($this->endpoint(), ['application_details' => $this->answers()])->assertStatus(400);
        $this->assertDatabaseCount('scholarship_applications', 0);
    }
}
