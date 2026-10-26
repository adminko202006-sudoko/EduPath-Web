<?php

namespace Tests\Feature;

use App\Models\Applicant;
use App\Models\EntranceExam;
use App\Models\ExamAssignment;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class EntranceExamManagementTest extends TestCase
{
    use \Tests\Support\InstallsWorkflowSchema;
    private User $admin;
    private int $counter = 0;

    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default' => 'sqlite', 'database.connections.sqlite.database' => ':memory:', 'database.connections.sqlite.foreign_key_constraints' => true]);
        DB::purge('sqlite'); DB::setDefaultConnection('sqlite');
        Schema::create('users', function (Blueprint $t) { $t->id(); $t->string('name'); $t->string('email')->unique(); $t->string('password'); $t->string('role'); $t->timestamps(); });
        Schema::create('applicants', function (Blueprint $t) { $t->id(); $t->foreignId('user_id')->constrained(); $t->string('first_name'); $t->string('middle_name')->nullable(); $t->string('last_name'); $t->boolean('is_archived')->default(false); $t->timestamps(); });
        Schema::create('academic_programs', function (Blueprint $t) { $t->id(); $t->string('name'); $t->string('code'); $t->timestamps(); });
        Schema::create('admission_applications', function (Blueprint $t) { $t->id(); $t->foreignId('applicant_id')->constrained(); $t->foreignId('academic_program_id')->constrained(); $t->string('status'); $t->timestamps(); });
        Schema::create('entrance_exams', function (Blueprint $t) { $t->id(); $t->string('title'); $t->text('description')->nullable(); $t->date('exam_date'); $t->string('start_time'); $t->string('end_time'); $t->string('venue'); $t->integer('capacity')->nullable(); $t->boolean('is_active')->default(true); $t->timestamp('results_released_at')->nullable(); $t->timestamps(); });
        Schema::create('exam_assignments', function (Blueprint $t) { $t->id(); $t->foreignId('entrance_exam_id')->constrained()->cascadeOnDelete(); $t->foreignId('applicant_id')->constrained(); $t->string('status')->default('scheduled'); $t->decimal('score', 5, 2)->nullable(); $t->text('remarks')->nullable(); $t->timestamps(); $t->unique(['entrance_exam_id', 'applicant_id']); });
        $this->installWorkflowSchema();
        (require database_path('migrations/2026_10_20_000001_add_private_roster_to_entrance_exams.php'))->up();
        $this->admin = $this->account('admin');
    }

    private function account(string $role = 'applicant'): User
    {
        return User::create(['name' => 'Account ' . ++$this->counter, 'email' => 'account' . $this->counter . '@example.test', 'password' => 'test-password', 'role' => $role]);
    }

    private function person(): Applicant
    {
        $user = $this->account();
        $person = Applicant::create(['user_id' => $user->id, 'first_name' => 'Applicant', 'last_name' => sprintf('%03d', $this->counter)]);
        DB::table('academic_programs')->insertOrIgnore(['id' => 1000, 'name' => 'Document-cleared fixture program', 'code' => 'FIXTURE']);
        DB::table('admission_applications')->insert(['applicant_id' => $person->id, 'academic_program_id' => 1000, 'status' => 'pending']);
        return $person;
    }

    private function exam(array $extra = []): EntranceExam
    {
        return EntranceExam::create(array_merge(['title' => 'Scheduled exam', 'exam_date' => '2026-11-01', 'start_time' => '09:00:00', 'end_time' => '10:00:00', 'venue' => 'Test room', 'is_active' => true, 'capacity' => 1], $extra));
    }

    private function fheApplication(Applicant $person, string $name = 'Free Higher Education (FHE)'): \App\Models\ScholarshipApplication
    {
        if (!Schema::hasTable('scholarships')) {
            Schema::create('scholarships', function (Blueprint $t) { $t->id(); $t->string('name'); $t->string('program_type')->nullable(); $t->timestamps(); });
            Schema::table('scholarship_applications', function (Blueprint $t) { $t->unsignedBigInteger('applicant_id'); $t->unsignedBigInteger('scholarship_id'); $t->string('status')->default('pending'); $t->text('remarks')->nullable(); $t->timestamps(); });
        }
        $scholarship = \App\Models\Scholarship::create(['name' => $name]);
        return \App\Models\ScholarshipApplication::create(['applicant_id' => $person->id, 'scholarship_id' => $scholarship->id, 'status' => 'pending']);
    }

    public function test_fhe_approval_requires_own_completed_released_passing_result(): void
    {
        $a = $this->person(); $other = $this->person(); $app = $this->fheApplication($a);
        $url = '/api/admin/scholarship-applications/'.$app->id;
        $this->actingAs($this->admin)->putJson($url, ['status' => 'approved'])->assertUnprocessable();
        foreach ([
            ['scheduled', null, null], ['completed', null, now()], ['completed', 40, null],
            ['completed', 39, now()], ['absent', 100, now()], ['completed', 101, now()],
        ] as [$status, $score, $released]) {
            $exam = $this->exam(['results_released_at' => $released]);
            ExamAssignment::create(['entrance_exam_id' => $exam->id, 'applicant_id' => $a->id, 'status' => $status, 'score' => $score]);
            $this->putJson($url, ['status' => 'approved'])->assertUnprocessable()->assertJsonValidationErrors('status');
            $this->assertSame('pending', $app->fresh()->status);
        }
        $passing = $this->exam(['results_released_at' => now()]);
        ExamAssignment::create(['entrance_exam_id' => $passing->id, 'applicant_id' => $other->id, 'status' => 'completed', 'score' => 100]);
        $this->putJson($url, ['status' => 'approved'])->assertUnprocessable();
        ExamAssignment::create(['entrance_exam_id' => $passing->id, 'applicant_id' => $a->id, 'status' => 'completed', 'score' => 40]);
        $this->putJson($url, ['status' => 'approved'])->assertOk()->assertJsonPath('data.status', 'approved')->assertJsonPath('data.award_status', 'undecided');
        $this->assertDatabaseHas('workflow_events', ['subject_type' => 'scholarship', 'subject_id' => $app->id, 'action' => 'application_review']);
    }

    public function test_fhe_award_and_idempotent_approval_cannot_bypass_exam_gate(): void
    {
        $a = $this->person(); $app = $this->fheApplication($a); $app->update(['status' => 'approved']);
        $url = '/api/admin/scholarship-applications/'.$app->id;
        $this->actingAs($this->admin)->putJson($url, ['status' => 'approved'])->assertUnprocessable();
        $decision = ['award_status' => 'awarded', 'remarks' => 'Manual decision', 'expected_revision' => 0];
        $this->putJson($url.'/award', $decision)->assertUnprocessable();
        $exam = $this->exam(['results_released_at' => now()]);
        ExamAssignment::create(['entrance_exam_id' => $exam->id, 'applicant_id' => $a->id, 'status' => 'completed', 'score' => 100]);
        $this->putJson($url.'/award', $decision)->assertOk()->assertJsonPath('data.award_status', 'awarded');
    }

    public function test_fhe_pending_review_and_unrelated_scholarship_approval_are_preserved(): void
    {
        $a = $this->person(); $app = $this->fheApplication($a); $other = $this->fheApplication($a, 'Merit Scholarship');
        $this->actingAs($this->admin)->putJson('/api/admin/scholarship-applications/'.$app->id, ['status' => 'under_review'])->assertOk();
        $this->putJson('/api/admin/scholarship-applications/'.$app->id, ['status' => 'pending'])->assertOk();
        $this->putJson('/api/admin/scholarship-applications/'.$other->id, ['status' => 'approved'])->assertOk();
    }

    public function test_score_limits_release_checks_and_applicant_pass_privacy(): void
    {
        $a = $this->person(); $exam = $this->exam();
        $assignment = ExamAssignment::create(['entrance_exam_id' => $exam->id, 'applicant_id' => $a->id, 'status' => 'completed', 'score' => 101]);
        $url = '/api/admin/exams/'.$exam->id;
        $this->actingAs($this->admin)->postJson($url.'/release-results')->assertUnprocessable();
        $this->putJson($url.'/assignments/'.$assignment->id, ['score' => 101])->assertUnprocessable();
        $this->putJson($url.'/assignments/'.$assignment->id, ['score' => -1])->assertUnprocessable();
        $this->putJson($url.'/assignments/'.$assignment->id, ['score' => 40])->assertOk();
        $this->actingAs($a->user)->getJson('/api/applicant/exams/'.$assignment->id)->assertOk()->assertJsonMissingPath('data.score')->assertJsonMissingPath('data.passed');
        $this->actingAs($this->admin)->postJson($url.'/release-results')->assertOk();
        $this->actingAs($a->user)->getJson('/api/applicant/exams/'.$assignment->id)->assertOk()->assertJsonPath('data.passed', true)->assertJsonPath('data.entrance_exam.passing_score', 40);
    }

    public function test_uploaded_roster_is_private_validated_and_available_only_to_assigned_applicant(): void
    {
        \Illuminate\Support\Facades\Storage::fake('local');
        $exam = $this->exam(); $a = $this->person(); $b = $this->person();
        $assignment = ExamAssignment::create(['entrance_exam_id' => $exam->id, 'applicant_id' => $a->id]);
        $url = '/api/admin/exams/'.$exam->id.'/roster';
        $this->getJson($url)->assertUnauthorized();
        $this->actingAs($this->admin)->postJson($url, ['roster_pdf' => \Illuminate\Http\UploadedFile::fake()->createWithContent('roster.pdf', 'Not a PDF')])->assertUnprocessable();
        $pdf = new \Dompdf\Dompdf(); $pdf->loadHtml('<p>Prepared roster fixture</p>'); $pdf->render();
        $content = $pdf->output();
        $this->postJson($url, ['roster_pdf' => \Illuminate\Http\UploadedFile::fake()->createWithContent('roster.pdf', $content)])
            ->assertOk()->assertJsonPath('data.has_roster_pdf', true)->assertJsonMissingPath('data.roster_pdf_path');
        $path = $exam->fresh()->roster_pdf_path;
        \Illuminate\Support\Facades\Storage::disk('local')->assertExists($path);
        $this->get($url.'?source=uploaded')->assertOk()->assertHeader('Content-Type', 'application/pdf');
        $this->actingAs($a->user)->get('/api/applicant/exams/'.$assignment->id.'/roster?source=uploaded')->assertOk();
        $this->postJson($url, ['roster_pdf' => \Illuminate\Http\UploadedFile::fake()->createWithContent('roster.pdf', $content)])->assertForbidden();
        $this->actingAs($b->user)->getJson('/api/applicant/exams/'.$assignment->id.'/roster')->assertForbidden();
        $this->getJson($url)->assertForbidden();
        $this->actingAs($this->account('staff'))->getJson($url)->assertForbidden();
        $this->actingAs($this->admin)->getJson($url.'?source=invalid')->assertUnprocessable();
    }

    public function test_generated_roster_contains_only_names_and_session_details(): void
    {
        $exam = $this->exam(['title' => 'Morning session', 'start_time' => '08:00', 'end_time' => '10:00']);
        $a = $this->person(); $a->update(['first_name' => 'José', 'last_name' => 'Peña']);
        $assignment = ExamAssignment::create(['entrance_exam_id' => $exam->id, 'applicant_id' => $a->id, 'status' => 'completed', 'score' => 88, 'remarks' => 'PRIVATE-RESULT-REMARK']);
        $records = $exam->examAssignments()->with('applicant')->get();
        $html = view('pdf.entrance-exam-roster', ['exam' => $exam, 'assignments' => $records])->render();
        $this->assertStringContainsString('Peña, José', $html);
        $this->assertStringContainsString('8:00 AM', $html); $this->assertStringContainsString('10:00 AM', $html);
        $this->assertStringNotContainsString('PRIVATE-RESULT-REMARK', $html);
        $this->assertStringNotContainsString($a->user->email, $html);
        $response = $this->actingAs($a->user)->get('/api/applicant/exams/'.$assignment->id.'/roster?source=generated')->assertOk()->assertHeader('Content-Type', 'application/pdf');
        $this->assertStringStartsWith('%PDF-', $response->getContent());
        $this->actingAs($this->admin)->getJson('/api/admin/exams/'.$exam->id.'/roster?source=uploaded')->assertNotFound();
    }

    public function test_admin_can_create_and_edit_a_session_with_a_prepared_pdf(): void
    {
        \Illuminate\Support\Facades\Storage::fake('local');
        $this->actingAs($this->admin);
        $pdf = new \Dompdf\Dompdf(); $pdf->loadHtml('<p>Prepared session roster</p>'); $pdf->render();
        $file = fn () => \Illuminate\Http\UploadedFile::fake()->createWithContent('session.pdf', $pdf->output());
        $fields = ['title' => 'Afternoon session', 'exam_date' => '2026-11-01', 'start_time' => '13:00', 'end_time' => '14:00', 'venue' => 'Room 1', 'is_active' => '1', 'roster_pdf' => $file()];
        $response = $this->post('/api/admin/exams', $fields, ['Accept' => 'application/json'])->assertCreated()->assertJsonPath('data.has_roster_pdf', true);
        $exam = EntranceExam::findOrFail($response->json('data.id')); $oldPath = $exam->roster_pdf_path;
        $this->post('/api/admin/exams/'.$exam->id, ['_method' => 'PUT', 'end_time' => '15:00', 'roster_pdf' => $file()], ['Accept' => 'application/json'])->assertOk();
        \Illuminate\Support\Facades\Storage::disk('local')->assertExists($oldPath);
        $this->assertNotSame($oldPath, $exam->fresh()->roster_pdf_path);
        $this->assertSame('15:00', $exam->fresh()->end_time);
    }

    public function test_admin_assigns_applicants_without_an_approved_admission_or_award_slot_gate(): void
    {
        $exam = $this->exam(); $a = $this->person(); $b = $this->person();
        $this->actingAs($this->admin)->postJson('/api/admin/exams/' . $exam->id . '/assignments', ['applicant_ids' => [$a->id, $b->id], 'score' => 100, 'status' => 'completed'])->assertCreated()->assertJsonPath('assigned_count', 2)->assertJsonCount(2, 'data.exam_assignments');
        $this->assertDatabaseCount('exam_assignments', 2);
        $this->assertDatabaseHas('exam_assignments', ['applicant_id' => $a->id, 'status' => 'scheduled', 'score' => null, 'remarks' => null]);
        $this->actingAs($a->user)->getJson('/api/applicant/exams')->assertOk()->assertJsonCount(1, 'data')->assertJsonMissingPath('data.0.score')->assertJsonMissingPath('data.0.remarks');
        $this->actingAs($a->user)->getJson('/api/applicant/exams/' . ExamAssignment::where('applicant_id', $b->id)->value('id'))->assertForbidden();
    }

    public function test_required_documents_filter_candidates_and_block_stale_bulk_assignment_atomically(): void
    {
        $exam = $this->exam(); $a = $this->person(); $b = $this->person();
        DB::table('admission_requirements')->insert(['id' => 1, 'name' => 'Academic record', 'is_active' => true, 'is_required' => true]);
        DB::table('admission_requirement_program')->insert(['admission_requirement_id' => 1, 'academic_program_id' => 1000]);
        $admission = fn ($person) => DB::table('admission_applications')->where('applicant_id', $person->id)->value('id');
        DB::table('application_documents')->insert(['admission_application_id' => $admission($a), 'document_name' => 'Academic record', 'status' => 'verified']);
        $doc = DB::table('application_documents')->insertGetId(['admission_application_id' => $admission($b), 'document_name' => 'Academic record', 'status' => 'pending']);
        $url = '/api/admin/exams/'.$exam->id;
        $this->actingAs($this->admin)->getJson($url.'/candidates')->assertOk()->assertJsonPath('total', 1)->assertJsonPath('data.0.id', $a->id);
        foreach (['pending', 'rejected'] as $status) {
            DB::table('application_documents')->where('id', $doc)->update(['status' => $status]);
            $this->postJson($url.'/assignments', ['applicant_ids' => [$a->id, $b->id]])->assertUnprocessable()->assertJsonValidationErrors('applicant_ids');
            $this->assertDatabaseCount('exam_assignments', 0);
        }
        DB::table('application_documents')->where('id', $doc)->update(['status' => 'verified']);
        $this->postJson($url.'/assignments', ['applicant_ids' => [$a->id, $b->id]])->assertCreated()->assertJsonPath('assigned_count', 2);
    }

    public function test_existing_scheduled_assignment_rechecks_documents_and_preserves_history(): void
    {
        $exam = $this->exam(); $a = $this->person();
        $assignment = ExamAssignment::create(['entrance_exam_id' => $exam->id, 'applicant_id' => $a->id, 'status' => 'scheduled']);
        DB::table('admission_requirements')->insert(['id' => 1, 'name' => 'Academic record', 'is_active' => true, 'is_required' => true]);
        DB::table('admission_requirement_program')->insert(['admission_requirement_id' => 1, 'academic_program_id' => 1000]);
        $this->actingAs($a->user)->getJson('/api/applicant/exams')->assertOk()->assertJsonPath('data.0.documents_verified', false)->assertJsonMissingPath('data.0.score');
        $this->getJson('/api/applicant/exams/'.$assignment->id)->assertOk()->assertJsonPath('data.documents_verified', false);
        $this->getJson('/api/applicant/exams/'.$assignment->id.'/roster')->assertUnprocessable();
        $url = '/api/admin/exams/'.$exam->id.'/assignments/'.$assignment->id;
        $this->actingAs($this->admin)->putJson($url, ['status' => 'completed', 'score' => 85])->assertUnprocessable();
        $this->assertSame('scheduled', $assignment->fresh()->status);
        $this->putJson($url, ['status' => 'absent'])->assertOk();
        $this->putJson($url, ['status' => 'completed', 'score' => 85])->assertUnprocessable();
        DB::table('application_documents')->insert(['admission_application_id' => DB::table('admission_applications')->where('applicant_id', $a->id)->value('id'), 'document_name' => 'Academic record', 'status' => 'verified']);
        $this->putJson($url, ['status' => 'completed', 'score' => 85])->assertOk();
        $this->postJson('/api/admin/exams/'.$exam->id.'/release-results')->assertOk();
        DB::table('application_documents')->update(['status' => 'rejected']);
        $this->actingAs($a->user)->getJson('/api/applicant/exams')->assertOk()->assertJsonPath('data.0.status', 'completed')->assertJsonPath('data.0.score', 85);
    }

    public function test_same_date_different_sessions_exclude_assigned_applicants_and_reject_stale_bulk_selections(): void
    {
        $morning = $this->exam();
        $afternoon = $this->exam(['start_time' => '13:00', 'end_time' => '14:00']);
        $assigned = $this->person(); $available = $this->person();
        $this->actingAs($this->admin)->postJson('/api/admin/exams/'.$morning->id.'/assignments', ['applicant_ids' => [$assigned->id]])->assertCreated();
        $url = '/api/admin/exams/'.$afternoon->id;
        $this->getJson($url.'/candidates')->assertOk()->assertJsonPath('total', 1)->assertJsonPath('data.0.id', $available->id);
        $this->getJson($url.'/candidates?search='.urlencode($assigned->user->email))->assertOk()->assertJsonPath('total', 0);
        $this->postJson($url.'/assignments', ['applicant_ids' => [$available->id, $assigned->id]])
            ->assertUnprocessable()->assertJsonValidationErrors('applicant_ids');
        $this->assertDatabaseCount('exam_assignments', 1);
        $this->postJson($url.'/assignments', ['applicant_ids' => [$available->id]])->assertCreated();
        $this->assertDatabaseCount('exam_assignments', 2);
    }

    public function test_an_assignment_on_a_different_date_does_not_block_a_new_assignment(): void
    {
        $a = $this->person(); $first = $this->exam(); $next = $this->exam(['exam_date' => '2026-11-02']);
        ExamAssignment::create(['entrance_exam_id' => $first->id, 'applicant_id' => $a->id]);
        $this->actingAs($this->admin)->getJson('/api/admin/exams/'.$next->id.'/candidates')->assertOk()->assertJsonPath('data.0.id', $a->id);
        $this->postJson('/api/admin/exams/'.$next->id.'/assignments', ['applicant_ids' => [$a->id]])->assertCreated();
    }

    public function test_same_date_rule_preserves_inactive_completed_absent_and_released_records(): void
    {
        $target = $this->exam(); $this->actingAs($this->admin);
        foreach ([['scheduled', false, null], ['completed', true, now()], ['absent', true, null]] as [$status, $active, $released]) {
            $a = $this->person();
            $other = $this->exam(['is_active' => $active, 'results_released_at' => $released]);
            $saved = ExamAssignment::create(['entrance_exam_id' => $other->id, 'applicant_id' => $a->id, 'status' => $status, 'score' => $status === 'completed' ? 75 : null, 'remarks' => 'Retain history']);
            $this->postJson('/api/admin/exams/'.$target->id.'/assignments', ['applicant_ids' => [$a->id]])->assertUnprocessable();
            $this->assertSame($status, $saved->fresh()->status);
            $this->assertSame('Retain history', $saved->fresh()->remarks);
        }
        $this->getJson('/api/admin/exams/'.$target->id.'/candidates')->assertOk()->assertJsonPath('total', 0);
        $this->assertDatabaseCount('exam_assignments', 3);
    }

    public function test_admin_cannot_move_an_assigned_schedule_onto_a_conflicting_date(): void
    {
        $a = $this->person(); $first = $this->exam(); $next = $this->exam(['exam_date' => '2026-11-02']);
        foreach ([$first, $next] as $exam) ExamAssignment::create(['entrance_exam_id' => $exam->id, 'applicant_id' => $a->id]);
        $url = '/api/admin/exams/'.$next->id;
        $this->actingAs($this->admin)->putJson($url, ['exam_date' => '2026-11-01', 'venue' => 'Changed room'])->assertUnprocessable()->assertJsonValidationErrors('exam_date');
        $this->assertSame('2026-11-02', $next->fresh()->exam_date->toDateString());
        $this->assertSame('Test room', $next->fresh()->venue);
        $this->putJson($url, ['exam_date' => '2026-11-03'])->assertOk();
        $this->putJson($url, ['start_time' => '08:00'])->assertOk();
        $this->assertDatabaseCount('exam_assignments', 2);
    }

    public function test_repeat_assignment_does_not_reset_recorded_results(): void
    {
        $exam = $this->exam(); $a = $this->person();
        $saved = ExamAssignment::create(['entrance_exam_id' => $exam->id, 'applicant_id' => $a->id, 'status' => 'completed', 'score' => 78.5, 'remarks' => 'Original feedback']);
        $this->actingAs($this->admin);
        for ($i = 0; $i < 2; $i++) $this->postJson('/api/admin/exams/' . $exam->id . '/assignments', ['applicant_ids' => [$a->id]])->assertOk()->assertJsonPath('assigned_count', 0)->assertJsonPath('already_assigned_count', 1);
        $this->assertDatabaseCount('exam_assignments', 1);
        $this->assertSame('completed', $saved->fresh()->status);
        $this->assertEquals(78.5, $saved->fresh()->score);
        $this->assertSame('Original feedback', $saved->fresh()->remarks);
    }

    public function test_assignment_validation_is_atomic_and_rejects_archived_accounts(): void
    {
        $exam = $this->exam(); $a = $this->person(); $archived = $this->person(); $archived->update(['is_archived' => true]);
        $this->actingAs($this->admin);
        foreach ([[], [$a->id, $a->id], [$a->id, 99999], [$a->id, $archived->id], array_fill(0, 101, $a->id)] as $ids) {
            $this->postJson('/api/admin/exams/' . $exam->id . '/assignments', ['applicant_ids' => $ids])->assertUnprocessable();
            $this->assertDatabaseCount('exam_assignments', 0);
        }
    }

    public function test_inactive_and_released_exams_reject_new_assignments(): void
    {
        $a = $this->person(); $this->actingAs($this->admin);
        foreach ([$this->exam(['is_active' => false]), $this->exam(['results_released_at' => now()])] as $exam) {
            $this->postJson('/api/admin/exams/' . $exam->id . '/assignments', ['applicant_ids' => [$a->id]])->assertConflict();
        }
        $this->assertDatabaseCount('exam_assignments', 0);
    }

    public function test_candidate_search_program_filters_and_pagination_exclude_assigned_and_archived(): void
    {
        $exam = $this->exam(); $this->actingAs($this->admin);
        $people = collect(); for ($i = 0; $i < 23; $i++) $people->push($this->person());
        $assigned = $people[0]; $archived = $people[1]; $archived->update(['is_archived' => true]);
        ExamAssignment::create(['entrance_exam_id' => $exam->id, 'applicant_id' => $assigned->id]);
        DB::table('academic_programs')->insert(['id' => 1, 'name' => 'Program One', 'code' => 'P1']);
        DB::table('admission_applications')->insert(['applicant_id' => $people[2]->id, 'academic_program_id' => 1, 'status' => 'pending']);
        $url = '/api/admin/exams/' . $exam->id . '/candidates';
        $first = $this->getJson($url)->assertOk()->assertJsonPath('total', 21)->assertJsonCount(20, 'data')->assertJsonMissingPath('data.0.user.password');
        $this->assertNotContains($assigned->id, array_column($first->json('data'), 'id'));
        $this->assertNotContains($archived->id, array_column($first->json('data'), 'id'));
        $this->getJson($url . '?page=2')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson($url . '?program_id=1')->assertOk()->assertJsonPath('total', 1)->assertJsonPath('data.0.id', $people[2]->id);
        $this->getJson($url . '?search=' . urlencode($people[2]->user->email))->assertOk()->assertJsonPath('total', 1)->assertJsonPath('data.0.id', $people[2]->id);
        $this->getJson($url . '?page=0')->assertUnprocessable();
    }

    public function test_management_endpoints_remain_admin_only(): void
    {
        $exam = $this->exam(); $a = $this->person(); $url = '/api/admin/exams/' . $exam->id;
        $this->getJson($url . '/candidates')->assertUnauthorized();
        $this->postJson($url . '/assignments', ['applicant_ids' => [$a->id]])->assertUnauthorized();
        foreach ([$a->user, $this->account('staff')] as $user) {
            $this->actingAs($user)->getJson($url . '/candidates')->assertForbidden();
            $this->postJson($url . '/assignments', ['applicant_ids' => [$a->id]])->assertForbidden();
            $this->deleteJson($url)->assertForbidden();
        }
        $this->assertDatabaseCount('exam_assignments', 0);
    }

    public function test_referenced_exams_cannot_cascade_delete_history_but_unused_exams_can_be_deleted(): void
    {
        $exam = $this->exam(); $a = $this->person();
        ExamAssignment::create(['entrance_exam_id' => $exam->id, 'applicant_id' => $a->id, 'status' => 'completed', 'score' => 65]);
        $this->actingAs($this->admin)->deleteJson('/api/admin/exams/' . $exam->id)->assertConflict();
        $this->assertDatabaseCount('exam_assignments', 1);
        $this->putJson('/api/admin/exams/' . $exam->id, ['is_active' => false])->assertOk();
        $this->assertDatabaseHas('entrance_exams', ['id' => $exam->id, 'is_active' => false]);
        $released = $this->exam(['results_released_at' => now()]);
        $this->deleteJson('/api/admin/exams/' . $released->id)->assertConflict();
        $unused = $this->exam(); $this->deleteJson('/api/admin/exams/' . $unused->id)->assertOk();
        $this->assertDatabaseMissing('entrance_exams', ['id' => $unused->id]);
    }

    public function test_admin_partial_schedule_updates_compare_against_persisted_times(): void
    {
        $exam = $this->exam(); $url = '/api/admin/exams/' . $exam->id; $this->actingAs($this->admin);
        $this->putJson($url, ['end_time' => '08:59'])->assertUnprocessable()->assertJsonValidationErrors('end_time');
        $this->putJson($url, ['start_time' => '10:00'])->assertUnprocessable();
        $this->putJson($url, ['end_time' => '09:00'])->assertUnprocessable();
        $this->assertSame('09:00:00', $exam->fresh()->start_time);
        $this->putJson($url, ['end_time' => '11:00'])->assertOk();
        $this->putJson($url, ['is_active' => false])->assertOk();
        $this->assertSame('11:00', $exam->fresh()->end_time);
    }

    public function test_release_readiness_idempotency_and_result_edit_lock_are_preserved(): void
    {
        $exam = $this->exam(); $a = $this->person(); $this->actingAs($this->admin); $url = '/api/admin/exams/' . $exam->id;
        $this->postJson($url . '/release-results')->assertUnprocessable();
        $assignment = ExamAssignment::create(['entrance_exam_id' => $exam->id, 'applicant_id' => $a->id]);
        $this->postJson($url . '/release-results')->assertUnprocessable();
        $this->putJson($url . '/assignments/' . $assignment->id, ['status' => 'completed'])->assertOk();
        $this->postJson($url . '/release-results')->assertUnprocessable();
        $this->putJson($url . '/assignments/' . $assignment->id, ['score' => 75])->assertOk();
        $this->postJson($url . '/release-results')->assertOk(); $releasedAt = $exam->fresh()->results_released_at;
        $this->postJson($url . '/release-results')->assertOk();
        $this->assertTrue($releasedAt->equalTo($exam->fresh()->results_released_at));
        $this->putJson($url . '/assignments/' . $assignment->id, ['score' => 99])->assertConflict();
        $this->assertEquals(75, $assignment->fresh()->score);
        $this->actingAs($a->user)->getJson('/api/applicant/exams')->assertOk()->assertJsonPath('data.0.score', 75);
    }

    public function test_admin_cannot_update_an_assignment_through_another_exams_url(): void
    {
        $exam = $this->exam(); $otherExam = $this->exam(); $a = $this->person();
        $assignment = ExamAssignment::create(['entrance_exam_id' => $otherExam->id, 'applicant_id' => $a->id, 'status' => 'completed', 'score' => 70]);
        $this->actingAs($this->admin)->putJson('/api/admin/exams/' . $exam->id . '/assignments/' . $assignment->id, ['score' => 99])->assertNotFound();
        $this->assertEquals(70, $assignment->fresh()->score);
    }

    public function test_authorized_staff_partial_times_use_same_validation_and_keep_program_scope(): void
    {
        Schema::create('staff', function (Blueprint $t) { $t->id(); $t->foreignId('user_id')->constrained(); $t->string('status'); $t->timestamps(); });
        Schema::create('staff_permissions', function (Blueprint $t) { $t->id(); $t->unsignedBigInteger('staff_id'); $t->boolean('manage_exams')->default(false); $t->timestamps(); });
        Schema::create('staff_programs', function (Blueprint $t) { $t->unsignedBigInteger('staff_id'); $t->unsignedBigInteger('academic_program_id'); });
        $staffUser = $this->account('staff');
        $staff = \App\Models\Staff::create(['user_id' => $staffUser->id, 'status' => 'active']);
        \App\Models\StaffPermission::create(['staff_id' => $staff->id, 'manage_exams' => true]);
        DB::table('academic_programs')->insert(['id' => 1, 'name' => 'Assigned Program', 'code' => 'ONE']);
        DB::table('staff_programs')->insert(['staff_id' => $staff->id, 'academic_program_id' => 1]);
        $a = $this->person(); DB::table('admission_applications')->insert(['applicant_id' => $a->id, 'academic_program_id' => 1, 'status' => 'pending']);
        $exam = $this->exam(); ExamAssignment::create(['entrance_exam_id' => $exam->id, 'applicant_id' => $a->id]);
        $this->actingAs($staffUser)->putJson('/api/staff/exams/' . $exam->id, ['end_time' => '08:00'])->assertUnprocessable();
        $this->putJson('/api/staff/exams/' . $exam->id, ['end_time' => '11:00'])->assertOk()->assertJsonMissingPath('data.exam_assignments.0.score');
        $conflicting = $this->exam(['exam_date' => '2026-11-02']);
        ExamAssignment::create(['entrance_exam_id' => $conflicting->id, 'applicant_id' => $a->id]);
        $this->putJson('/api/staff/exams/'.$exam->id, ['exam_date' => '2026-11-02'])->assertUnprocessable()->assertJsonValidationErrors('exam_date');
        $this->assertSame('2026-11-01', $exam->fresh()->exam_date->toDateString());
        $other = $this->exam(); $this->putJson('/api/staff/exams/' . $other->id, ['end_time' => '12:00'])->assertForbidden();
    }
}
