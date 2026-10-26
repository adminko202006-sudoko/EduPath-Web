<?php

namespace Tests\Feature;

use App\Models\AdmissionApplication;
use App\Models\Applicant;
use App\Models\ApplicationDocument;
use App\Models\ApplicationDocumentHistory;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Illuminate\Filesystem\FilesystemAdapter;
use Tests\TestCase;

class ApplicantDocumentAccessTest extends TestCase
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
            $table->string('role')->default('applicant');
            $table->timestamps();
        });
        Schema::create('applicants', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->timestamps();
        });
        Schema::create('admission_applications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('applicant_id');
            $table->unsignedBigInteger('academic_program_id')->nullable();
            $table->unsignedBigInteger('admission_period_id')->nullable();
            $table->string('status')->default('pending');
            $table->text('remarks')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
        });
        Schema::create('application_documents', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('admission_application_id');
            $table->string('document_name');
            $table->string('file_path');
            $table->string('file_type')->nullable();
            $table->string('status')->default('pending');
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
        Schema::create('application_document_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('application_document_id');
            $table->unsignedBigInteger('user_id');
            $table->string('action');
            $table->string('old_status')->nullable();
            $table->string('new_status')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        Storage::fake('local');
        Storage::fake('public');
    }

    public function test_document_file_requires_authentication(): void
    {
        $document = $this->makeDocumentForApplicant();

        $this->getJson("/api/applicant/documents/{$document->id}/file")
            ->assertUnauthorized();
    }

    public function test_owner_can_download_a_private_disk_document(): void
    {
        [$document, $owner] = $this->makeDocumentForApplicant(withOwner: true);
        Storage::disk('local')->put($document->file_path, 'private-pdf-content');

        $response = $this->actingAs($owner)
            ->get("/api/applicant/documents/{$document->id}/file");

        $response->assertOk();
        $this->assertStringContainsString('private', $response->headers->get('Cache-Control'));
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
        $this->assertSame('attachment', $response->headers->get('Content-Disposition'));
    }

    public function test_another_applicant_cannot_download_the_document(): void
    {
        [$document] = $this->makeDocumentForApplicant(withOwner: true);
        $other = User::create([
            'name' => 'Other Applicant',
            'email' => 'other@example.test',
            'password' => 'password',
            'role' => 'applicant',
        ]);

        $this->actingAs($other)
            ->getJson("/api/applicant/documents/{$document->id}/file")
            ->assertForbidden();
    }

    public function test_legacy_public_disk_file_remains_available_through_authorized_route(): void
    {
        [$document, $owner] = $this->makeDocumentForApplicant(withOwner: true);
        Storage::disk('public')->put($document->file_path, 'legacy-pdf-content');

        $this->actingAs($owner)
            ->get("/api/applicant/documents/{$document->id}/file")
            ->assertOk();
    }

    public function test_applicant_role_without_applicant_profile_fails_closed(): void
    {
        $document = $this->makeDocumentForApplicant();
        $unlinkedUser = User::create([
            'name' => 'Unlinked Applicant',
            'email' => 'unlinked@example.test',
            'password' => 'password',
            'role' => 'applicant',
        ]);

        $this->actingAs($unlinkedUser)
            ->getJson("/api/applicant/documents/{$document->id}/file")
            ->assertForbidden();
    }

    public function test_upload_is_private_and_records_history_atomically(): void
    {
        [$existing, $owner] = $this->makeDocumentForApplicant(withOwner: true);
        $response = $this->actingAs($owner)->postJson('/api/applicant/documents', [
            'admission_application_id' => $existing->admission_application_id,
            'document_name' => 'New transcript',
            'document' => UploadedFile::fake()->create('transcript.pdf', 40, 'application/pdf'),
        ])->assertCreated()->assertJsonPath('success', true);
        Storage::disk('local')->assertExists($response->json('data.file_path'));
        $this->assertEmpty(Storage::disk('public')->allFiles());
        $this->assertDatabaseHas('application_document_histories', ['application_document_id' => $response->json('data.id'), 'action' => 'uploaded']);
    }

    public function test_upload_write_failure_does_not_report_success_or_create_records(): void
    {
        [$document, $owner] = $this->makeDocumentForApplicant(withOwner: true);
        $disk = \Mockery::mock(FilesystemAdapter::class);
        $disk->shouldReceive('putFileAs')->once()->andReturn(false);
        Storage::shouldReceive('disk')->with('local')->andReturn($disk);
        $this->actingAs($owner)->postJson('/api/applicant/documents', [
            'admission_application_id' => $document->admission_application_id,
            'document_name' => 'Transcript',
            'document' => UploadedFile::fake()->create('transcript.pdf', 40, 'application/pdf'),
        ])->assertStatus(503)->assertJsonPath('success', false);
        $this->assertDatabaseCount('application_documents', 1);
        $this->assertDatabaseCount('application_document_histories', 0);
    }

    public function test_replacement_preserves_prior_file_and_records_history(): void
    {
        [$document, $owner] = $this->makeDocumentForApplicant(withOwner: true);
        $document->update(['status' => 'rejected']);
        $oldPath = $document->file_path;
        Storage::disk('local')->put($oldPath, 'original-content');
        $response = $this->actingAs($owner)->postJson("/api/applicant/documents/{$document->id}/replace", [
            'document' => UploadedFile::fake()->create('replacement.pdf', 40, 'application/pdf'),
        ])->assertOk()->assertJsonPath('data.status', 'pending');
        $this->assertNotSame($oldPath, $response->json('data.file_path'));
        Storage::disk('local')->assertExists([$oldPath, $response->json('data.file_path')]);
        $this->assertDatabaseHas('application_document_histories', ['application_document_id' => $document->id, 'action' => 'replaced', 'old_status' => 'rejected', 'new_status' => 'pending']);
    }

    public function test_replacement_write_failure_keeps_original_metadata_and_file(): void
    {
        [$document, $owner] = $this->makeDocumentForApplicant(withOwner: true);
        $document->update(['status' => 'rejected']);
        $oldPath = $document->file_path;
        $originalDisk = Storage::disk('local');
        $originalDisk->put($oldPath, 'original-content');
        $disk = \Mockery::mock(FilesystemAdapter::class);
        $disk->shouldReceive('putFileAs')->once()->andReturn(false);
        Storage::shouldReceive('disk')->with('local')->andReturn($disk);
        $this->actingAs($owner)->postJson("/api/applicant/documents/{$document->id}/replace", [
            'document' => UploadedFile::fake()->create('replacement.pdf', 40, 'application/pdf'),
        ])->assertStatus(503)->assertJsonPath('success', false);
        $this->assertDatabaseHas('application_documents', ['id' => $document->id, 'file_path' => $oldPath, 'status' => 'rejected']);
        $originalDisk->assertExists($oldPath);
        $this->assertDatabaseCount('application_document_histories', 0);
    }

    public function test_missing_document_file_returns_not_found_without_a_success_response(): void
    {
        [$document, $owner] = $this->makeDocumentForApplicant(withOwner: true);
        $this->actingAs($owner)->getJson("/api/applicant/documents/{$document->id}/file")
            ->assertNotFound()->assertJsonPath('success', false);
    }

    public function test_history_failure_rolls_back_new_upload_and_removes_only_new_file(): void
    {
        [$document, $owner] = $this->makeDocumentForApplicant(withOwner: true);
        Storage::disk('local')->put($document->file_path, 'original-content');
        ApplicationDocumentHistory::creating(fn () => throw new \RuntimeException('Injected history failure'));
        try {
            $this->actingAs($owner)->postJson('/api/applicant/documents', [
                'admission_application_id' => $document->admission_application_id,
                'document_name' => 'Transcript',
                'document' => UploadedFile::fake()->create('transcript.pdf', 40, 'application/pdf'),
            ])->assertStatus(500);
        } finally {
            ApplicationDocumentHistory::flushEventListeners();
        }
        $this->assertDatabaseCount('application_documents', 1);
        $this->assertDatabaseCount('application_document_histories', 0);
        $this->assertSame([$document->file_path], Storage::disk('local')->allFiles());
    }

    public function test_history_failure_during_replacement_preserves_original_record_and_file(): void
    {
        [$document, $owner] = $this->makeDocumentForApplicant(withOwner: true);
        $document->update(['status' => 'rejected']);
        $oldPath = $document->file_path;
        Storage::disk('local')->put($oldPath, 'original-content');
        ApplicationDocumentHistory::creating(fn () => throw new \RuntimeException('Injected history failure'));
        try {
            $this->actingAs($owner)->postJson("/api/applicant/documents/{$document->id}/replace", [
                'document' => UploadedFile::fake()->create('replacement.pdf', 40, 'application/pdf'),
            ])->assertStatus(500);
        } finally {
            ApplicationDocumentHistory::flushEventListeners();
        }
        $this->assertDatabaseHas('application_documents', ['id' => $document->id, 'file_path' => $oldPath, 'status' => 'rejected']);
        $this->assertSame([$oldPath], Storage::disk('local')->allFiles());
        $this->assertDatabaseCount('application_document_histories', 0);
    }

    public function test_upload_and_replace_enforce_ownership_type_and_review_state(): void
    {
        [$document, $owner] = $this->makeDocumentForApplicant(withOwner: true);
        $this->actingAs($owner)->postJson('/api/applicant/documents', [
            'admission_application_id' => $document->admission_application_id,
            'document_name' => 'Invalid',
            'document' => UploadedFile::fake()->create('script.exe', 10, 'application/octet-stream'),
        ])->assertUnprocessable();
        $this->postJson("/api/applicant/documents/{$document->id}/replace", [
            'document' => UploadedFile::fake()->create('transcript.pdf', 40, 'application/pdf'),
        ])->assertUnprocessable();
        $other = User::create(['name' => 'Other', 'email' => 'other-upload@example.test', 'password' => 'password', 'role' => 'applicant']);
        Applicant::create(['user_id' => $other->id, 'first_name' => 'Other']);
        $this->actingAs($other)->postJson('/api/applicant/documents', [
            'admission_application_id' => $document->admission_application_id,
            'document_name' => 'Transcript',
            'document' => UploadedFile::fake()->create('transcript.pdf', 40, 'application/pdf'),
        ])->assertForbidden();
        $this->postJson("/api/applicant/documents/{$document->id}/replace", [
            'document' => UploadedFile::fake()->create('transcript.pdf', 40, 'application/pdf'),
        ])->assertForbidden();
        $this->assertEmpty(Storage::disk('local')->allFiles());
    }

    public function test_delete_without_applicant_profile_returns_forbidden(): void
    {
        $document = $this->makeDocumentForApplicant();
        $user = User::create(['name' => 'Unlinked', 'email' => 'delete-unlinked@example.test', 'password' => 'password', 'role' => 'applicant']);
        $this->actingAs($user)->deleteJson("/api/applicant/documents/{$document->id}")->assertForbidden();
        $this->assertDatabaseCount('application_documents', 1);
    }

    public function test_only_rejected_documents_can_be_deleted(): void
    {
        [$document, $owner] = $this->makeDocumentForApplicant(withOwner: true);
        Storage::disk('local')->put($document->file_path, 'original-content');
        foreach (['pending', 'under_review', 'verified', 'approved'] as $status) {
            $document->update(['status' => $status]);
            $this->actingAs($owner)->deleteJson("/api/applicant/documents/{$document->id}")
                ->assertUnprocessable()->assertJsonValidationErrors('document');
            $this->assertDatabaseHas('application_documents', ['id' => $document->id, 'status' => $status]);
        }
        Storage::disk('local')->assertExists($document->file_path);
        $this->assertDatabaseCount('application_document_histories', 0);
    }

    public function test_owner_can_delete_rejected_document_with_audit_history(): void
    {
        [$document, $owner] = $this->makeDocumentForApplicant(withOwner: true);
        $document->update(['status' => 'rejected']);
        Storage::disk('local')->put($document->file_path, 'retained-original');
        $this->actingAs($owner)->deleteJson("/api/applicant/documents/{$document->id}")
            ->assertOk()->assertJsonPath('success', true);
        $this->assertDatabaseMissing('application_documents', ['id' => $document->id]);
        $this->assertDatabaseHas('application_document_histories', ['action' => 'deleted', 'old_status' => 'rejected', 'user_id' => $owner->id]);
        Storage::disk('local')->assertExists($document->file_path);
        $this->deleteJson("/api/applicant/documents/{$document->id}")->assertNotFound();
        $this->assertDatabaseCount('application_document_histories', 1);
    }

    public function test_another_applicant_cannot_delete_rejected_document(): void
    {
        [$document] = $this->makeDocumentForApplicant(withOwner: true);
        $document->update(['status' => 'rejected']);
        $other = User::create(['name' => 'Other', 'email' => 'delete-other@example.test', 'password' => 'password', 'role' => 'applicant']);
        Applicant::create(['user_id' => $other->id, 'first_name' => 'Other']);
        $this->actingAs($other)->deleteJson("/api/applicant/documents/{$document->id}")->assertForbidden();
        $this->assertDatabaseCount('application_documents', 1);
        $this->assertDatabaseCount('application_document_histories', 0);
    }

    public function test_delete_history_failure_preserves_rejected_document_and_file(): void
    {
        [$document, $owner] = $this->makeDocumentForApplicant(withOwner: true);
        $document->update(['status' => 'rejected']);
        Storage::disk('local')->put($document->file_path, 'original-content');
        ApplicationDocumentHistory::creating(fn () => throw new \RuntimeException('Injected history failure'));
        try {
            $this->actingAs($owner)->deleteJson("/api/applicant/documents/{$document->id}")->assertStatus(500);
        } finally {
            ApplicationDocumentHistory::flushEventListeners();
        }
        $this->assertDatabaseHas('application_documents', ['id' => $document->id, 'status' => 'rejected']);
        Storage::disk('local')->assertExists($document->file_path);
        $this->assertDatabaseCount('application_document_histories', 0);
    }

    public function test_mobile_document_changes_are_visible_in_admin_document_list(): void
    {
        Schema::create('academic_programs', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->timestamps();
        });
        [$document, $owner] = $this->makeDocumentForApplicant(withOwner: true);
        $admin = User::create(['name' => 'Admin', 'email' => 'document-admin@example.test', 'password' => 'password', 'role' => 'admin']);
        $document->update(['status' => 'rejected', 'remarks' => 'Please upload a clearer copy.']);
        $oldPath = $document->file_path;
        Storage::disk('local')->put($oldPath, 'original');

        $replacement = $this->actingAs($owner)->postJson("/api/applicant/documents/{$document->id}/replace", [
            'document' => UploadedFile::fake()->create('corrected.pdf', 40, 'application/pdf'),
        ])->assertOk()->assertJsonPath('data.status', 'pending');
        $this->actingAs($admin)->getJson('/api/admin/documents')
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $document->id)
            ->assertJsonPath('data.0.status', 'pending')
            ->assertJsonPath('data.0.remarks', null)
            ->assertJsonPath('data.0.file_path', $replacement->json('data.file_path'))
            ->assertJsonPath('data.0.admission_application.applicant.id', $document->admissionApplication->applicant_id);

        $this->actingAs($owner)->deleteJson("/api/applicant/documents/{$document->id}")->assertUnprocessable();
        $document->refresh()->update(['status' => 'rejected']);
        $this->deleteJson("/api/applicant/documents/{$document->id}")->assertOk();
        $this->actingAs($admin)->getJson('/api/admin/documents')->assertOk()->assertJsonCount(0, 'data');
        Storage::disk('local')->assertExists([$oldPath, $replacement->json('data.file_path')]);
    }

    private function makeDocumentForApplicant(bool $withOwner = false): array|ApplicationDocument
    {
        $owner = User::create([
            'name' => 'Document Owner',
            'email' => 'owner@example.test',
            'password' => 'password',
            'role' => 'applicant',
        ]);
        $applicant = Applicant::create([
            'user_id' => $owner->id,
            'first_name' => 'Document',
            'last_name' => 'Owner',
        ]);
        $application = AdmissionApplication::create([
            'applicant_id' => $applicant->id,
            'academic_program_id' => 1,
            'admission_period_id' => 1,
            'status' => 'pending',
        ]);
        $document = ApplicationDocument::create([
            'admission_application_id' => $application->id,
            'document_name' => 'Transcript',
            'file_path' => 'documents/private.pdf',
            'file_type' => 'application/pdf',
            'status' => 'pending',
        ]);

        return $withOwner ? [$document, $owner] : $document;
    }
}
