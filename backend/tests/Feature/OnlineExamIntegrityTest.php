<?php

namespace Tests\Feature;

use App\Models\Applicant;
use App\Models\OnlineExamAttempt;
use App\Models\OnlineExamOption;
use App\Models\OnlineExamQuestion;
use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Tests\TestCase;

class OnlineExamIntegrityTest extends TestCase
{
    use \Tests\Support\InstallsWorkflowSchema;
    protected User $applicantUser;
    protected Applicant $applicant;
    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Isolate every test from the configured MySQL database.
        config([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => ':memory:',
            'database.connections.sqlite.foreign_key_constraints' => false,
        ]);

        DB::purge('sqlite');
        DB::setDefaultConnection('sqlite');

        $this->createTestSchema();
        (require database_path('migrations/2026_10_20_000005_add_online_exam_navigation.php'))->up();
        (require database_path('migrations/2026_10_19_000001_create_online_exam_settings_table.php'))->up();
        $this->installWorkflowSchema();
        (require database_path('migrations/2026_10_20_000002_add_online_exam_staff_review.php'))->up();
        (require database_path('migrations/2026_10_18_000003_create_announcement_dismissals_table.php'))->up();
        $this->createTestUsers();
    }

    private function createTestSchema(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('title');
            $table->text('message');
            $table->string('type')->nullable();
            $table->unsignedBigInteger('announcement_id')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('content');
            $table->string('status');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('role')->default('applicant');
            $table->string('fcm_token')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('applicants', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->unique();
            $table->string('first_name')->nullable();
            $table->string('middle_name')->nullable();
            $table->string('last_name')->nullable();
            $table->date('birth_date')->nullable();
            $table->string('gender')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->string('profile_photo')->nullable();
            $table->boolean('is_archived')->default(false);
            $table->timestamps();
        });

        Schema::create('online_exam_questions', function (Blueprint $table) {
            $table->id();
            $table->text('question');
            $table->boolean('is_active')->default(true);
            $table->string('source')->nullable();
            $table->timestamps();
        });

        Schema::create('online_exam_options', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('online_exam_question_id');
            $table->string('text');
            $table->boolean('is_correct')->default(false);
            $table->integer('position')->default(0);
            $table->timestamps();
        });

        Schema::create('online_exam_attempts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('applicant_id');
            $table->string('status')->default('in_progress');
            $table->integer('question_count')->default(0);
            $table->integer('seconds_per_question')->default(60);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->integer('current_question_index')->default(0);
            $table->decimal('score', 5, 2)->nullable();
            $table->boolean('passed')->nullable();
            $table->unsignedBigInteger('results_released_by')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamp('results_released_at')->nullable();
            $table->timestamps();
        });

        Schema::create('online_exam_attempt_questions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('online_exam_attempt_id');
            $table->unsignedBigInteger('online_exam_question_id');
            $table->integer('position');
            $table->timestamps();
        });

        Schema::create('online_exam_answers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('online_exam_attempt_id');
            $table->unsignedBigInteger('online_exam_question_id');
            $table->unsignedBigInteger('online_exam_option_id')->nullable();
            $table->timestamp('answered_at')->nullable();
            $table->timestamps();

            $table->unique(
                ['online_exam_attempt_id', 'online_exam_question_id'],
                'test_attempt_question_unique'
            );
        });

        Schema::create('online_exam_retake_grants', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('applicant_id');
            $table->string('reason')->nullable();
            $table->unsignedBigInteger('granted_by')->nullable();
            $table->timestamps();
        });
        Schema::create('admission_applications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('applicant_id');
            $table->string('status')->default('pending');
            $table->timestamps();
        });

        Schema::create('scholarships', function (Blueprint $table) {
            $table->id();
            $table->string('category')->default('other');
            $table->boolean('is_active')->default(true);
            $table->boolean('requires_online_exam')->default(true);
            $table->timestamps();
        });

        Schema::create('scholarship_applications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('applicant_id');
            $table->unsignedBigInteger('scholarship_id');
            $table->string('status')->default('pending');
            $table->timestamps();
        });
    }

    private function createTestUsers(): void
    {
        $this->applicantUser = User::create([
            'name' => 'Test Applicant',
            'email' => 'applicant-test@example.test',
            'password' => 'test-password',
            'role' => 'applicant',
        ]);

        $this->applicant = Applicant::create([
            'user_id' => $this->applicantUser->id,
            'first_name' => 'Test',
            'last_name' => 'Applicant',
        ]);

        $this->adminUser = User::create([
            'name' => 'Test Administrator',
            'email' => 'admin-test@example.test',
            'password' => 'test-password',
            'role' => 'admin',
        ]);
    }

    private function createAttempt(string $status = 'in_progress'): OnlineExamAttempt
    {
        // Existing attempt fixtures represent applicants approved to take the exam.
        if (!DB::table('scholarship_applications')->where('applicant_id', $this->applicant->id)->exists()) {
            $scholarshipId = DB::table('scholarships')->insertGetId(['category' => 'other', 'is_active' => true, 'requires_online_exam' => true]);
            DB::table('scholarship_applications')->insert(['applicant_id' => $this->applicant->id, 'scholarship_id' => $scholarshipId, 'status' => 'approved']);
        }
        return OnlineExamAttempt::create([
            'applicant_id' => $this->applicant->id,
            'status' => $status,
            'question_count' => 100,
            'seconds_per_question' => 60,
            'started_at' => now()->subSeconds(5),
            'expires_at' => now()->addHour(),
            'current_question_index' => 0,
        ]);
    }

    /**
     * Create 100 ordered question assignments, each with one correct option.
     * Returns the question and option IDs for test setup.
     */
    private function assignOneHundredQuestions(
        OnlineExamAttempt $attempt
    ): array {
        $questions = [];
        $options = [];

        for ($position = 1; $position <= 100; $position++) {
            $question = OnlineExamQuestion::create([
                'question' => "Test question {$position}",
                'is_active' => true,
                'source' => 'test',
            ]);

            $option = OnlineExamOption::create([
                'online_exam_question_id' => $question->id,
                'text' => "Correct answer {$position}",
                'is_correct' => true,
                'position' => 1,
            ]);

            DB::table('online_exam_attempt_questions')->insert([
                'online_exam_attempt_id' => $attempt->id,
                'online_exam_question_id' => $question->id,
                'position' => $position,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $questions[] = $question;
            $options[] = $option;
        }

        return [$questions, $options];
    }

    private function recordAllCorrectAnswers(
        OnlineExamAttempt $attempt,
        array $questions,
        array $options
    ): void {
        foreach ($questions as $index => $question) {
            DB::table('online_exam_answers')->insert([
                'online_exam_attempt_id' => $attempt->id,
                'online_exam_question_id' => $question->id,
                'online_exam_option_id' => $options[$index]->id,
                'answered_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function test_valid_one_hundred_question_attempt_is_scored_correctly(): void
    {
        $attempt = $this->createAttempt();
        [$questions, $options] = $this->assignOneHundredQuestions($attempt);
        $this->recordAllCorrectAnswers($attempt, $questions, $options);

        $response = $this->actingAs($this->applicantUser, 'sanctum')
            ->postJson("/api/applicant/online-exam/attempts/{$attempt->id}/submit");

        $response->assertOk()
            ->assertJsonPath('success', true);

        $attempt->refresh();

        $this->assertSame('completed', $attempt->status);
        $this->assertSame('100.00', $attempt->score);
        $this->assertTrue($attempt->passed);
        $this->assertNull($attempt->results_released_at);
    }

    public function test_submission_rejects_an_option_from_another_question(): void
    {
        $attempt = $this->createAttempt();
        [$questions, $options] = $this->assignOneHundredQuestions($attempt);

        $this->recordAllCorrectAnswers($attempt, $questions, $options);

        // Tamper with question 1's answer to use question 2's option.
        DB::table('online_exam_answers')
            ->where('online_exam_attempt_id', $attempt->id)
            ->where('online_exam_question_id', $questions[0]->id)
            ->update([
                'online_exam_option_id' => $options[1]->id,
                'updated_at' => now(),
            ]);

        $response = $this->actingAs($this->applicantUser, 'sanctum')
            ->postJson("/api/applicant/online-exam/attempts/{$attempt->id}/submit");

        $response->assertStatus(422);

        $this->assertNull($attempt->fresh()->score);
        $this->assertSame('in_progress', $attempt->fresh()->status);
    }

    public function test_admin_cannot_release_a_tampered_recorded_score(): void
    {
        $attempt = $this->createAttempt('completed');
        [$questions] = $this->assignOneHundredQuestions($attempt);

        // Stored score claims 80%, but no correct answers support that score.
        $attempt->update([
            'score' => 80,
            'passed' => true,
            'completed_at' => now(),
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/admin/online-exams/attempts/{$attempt->id}/release");

        $response->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->assertNull($attempt->fresh()->results_released_at);
    }

    public function test_applicant_cannot_see_score_before_official_release(): void
    {
        $attempt = $this->createAttempt('completed');

        $attempt->update([
            'score' => 75,
            'passed' => true,
            'remarks' => 'Passed',
            'completed_at' => now(),
        ]);

        $response = $this->actingAs($this->applicantUser, 'sanctum')
            ->getJson("/api/applicant/online-exam/attempts/{$attempt->id}/result");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.released', false)
            ->assertJsonPath('data.score', null)
            ->assertJsonPath('data.passed', null)
            ->assertJsonPath('data.remarks', null);
    }

    public function test_applicant_cannot_access_another_applicants_attempt(): void
    {
        $otherUser = User::create([
            'name' => 'Other Applicant',
            'email' => 'other-applicant-test@example.test',
            'password' => 'test-password',
            'role' => 'applicant',
        ]);

        $otherApplicant = Applicant::create([
            'user_id' => $otherUser->id,
            'first_name' => 'Other',
            'last_name' => 'Applicant',
        ]);

        $attempt = OnlineExamAttempt::create([
            'applicant_id' => $otherApplicant->id,
            'status' => 'completed',
            'question_count' => 100,
            'seconds_per_question' => 60,
            'started_at' => now()->subMinute(),
            'completed_at' => now(),
            'score' => 80,
            'passed' => true,
        ]);

        $response = $this->actingAs($this->applicantUser, 'sanctum')
            ->getJson("/api/applicant/online-exam/attempts/{$attempt->id}/result");

        $response->assertStatus(403);
    }

    public function test_applicant_role_cannot_release_exam_results(): void
    {
        $attempt = $this->createAttempt('completed');

        $response = $this->actingAs($this->applicantUser, 'sanctum')
            ->postJson("/api/admin/online-exams/attempts/{$attempt->id}/release");

        $response->assertStatus(403);
    }

    public function test_admin_can_grant_retake_after_completed_attempt(): void
    {
        $attempt = $this->createAttempt('completed');

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/admin/online-exams/retake-grants', [
                'applicant_id' => $this->applicant->id,
                'reason' => 'Approved retake after reviewing the request.',
            ]);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Retake authorized.');

        $this->assertDatabaseHas('online_exam_retake_grants', [
            'applicant_id' => $this->applicant->id,
            'granted_by' => $this->adminUser->id,
            'reason' => 'Approved retake after reviewing the request.',
        ]);

        $this->assertDatabaseCount('online_exam_retake_grants', 1);
    }

    public function test_admin_cannot_grant_retake_before_any_exam_attempt(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/admin/online-exams/retake-grants', [
                'applicant_id' => $this->applicant->id,
                'reason' => 'Applicant requested another attempt.',
            ]);

        $response->assertStatus(422);

        $this->assertDatabaseCount('online_exam_retake_grants', 0);
    }

    public function test_admin_cannot_grant_retake_while_exam_is_in_progress(): void
    {
        $this->createAttempt('in_progress');

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/admin/online-exams/retake-grants', [
                'applicant_id' => $this->applicant->id,
                'reason' => 'Applicant requested another attempt.',
            ]);

        $response->assertStatus(422);

        $this->assertDatabaseCount('online_exam_retake_grants', 0);
    }

    public function test_admin_cannot_issue_duplicate_unused_retake_grants(): void
    {
        $this->createAttempt('completed');

        $payload = [
            'applicant_id' => $this->applicant->id,
            'reason' => 'Approved retake after reviewing the request.',
        ];

        $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/admin/online-exams/retake-grants', $payload)
            ->assertCreated();

        $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/admin/online-exams/retake-grants', $payload)
            ->assertStatus(422);

        $this->assertDatabaseCount('online_exam_retake_grants', 1);
    }

    public function test_applicant_role_cannot_grant_exam_retakes(): void
    {
        $response = $this->actingAs($this->applicantUser, 'sanctum')
            ->postJson('/api/admin/online-exams/retake-grants', [
                'applicant_id' => $this->applicant->id,
                'reason' => 'Applicant attempts to authorize their own retake.',
            ]);

        $response->assertForbidden();

        $this->assertDatabaseCount('online_exam_retake_grants', 0);
    }

    private function createEligibleExamSetup(
        bool $approvedAdmission = true,
        bool $approvedOtherScholarship = true
    ): void {
        if ($approvedAdmission) {
            DB::table('admission_applications')->insert([
                'applicant_id' => $this->applicant->id,
                'status' => 'approved',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        if ($approvedOtherScholarship) {
            $scholarshipId = DB::table('scholarships')->insertGetId([
                'category' => 'other',
                'is_active' => true,
                'requires_online_exam' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('scholarship_applications')->insert([
                'applicant_id' => $this->applicant->id,
                'scholarship_id' => $scholarshipId,
                'status' => 'approved',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        for ($i = 1; $i <= 100; $i++) {
            $question = OnlineExamQuestion::create([
                'question' => "Workflow test question {$i}",
                'is_active' => true,
                'source' => 'workflow_test',
            ]);
            $question->options()->createMany([
                ['text' => 'Correct answer', 'is_correct' => true, 'position' => 1],
                ['text' => 'Incorrect answer', 'is_correct' => false, 'position' => 2],
            ]);
        }
    }

    public function test_invalid_active_questions_do_not_count_toward_attempt_availability(): void
    {
        $this->createEligibleExamSetup();
        $question = OnlineExamQuestion::first();
        $question->options()->update(['is_correct' => false]);
        $this->actingAs($this->applicantUser, 'sanctum')->getJson('/api/applicant/online-exam')
            ->assertOk()->assertJsonPath('data.eligible', false)->assertJsonPath('data.question_bank_count', 99);
        $this->postJson('/api/applicant/online-exam/start')->assertUnprocessable();
        $this->assertDatabaseCount('online_exam_attempts', 0);
        $this->assertDatabaseCount('online_exam_attempt_questions', 0);
    }

    public function test_availability_notification_is_created_once_and_never_contains_scores_or_keys(): void
    {
        $this->createEligibleExamSetup();
        $service = app(\App\Services\OnlineExamAvailabilityService::class);
        $service->notifyIfEligible($this->applicant->id);
        $service->notifyEligibleApplicants();
        $this->assertDatabaseCount('online_exam_availability_notices', 1);
        $this->assertDatabaseCount('notifications', 1);
        $this->assertDatabaseCount('notification_deliveries', 1);
        $notification = \App\Models\Notification::first();
        $this->assertSame('exam', $notification->type);
        $this->assertSame($this->applicantUser->id, $notification->user_id);
        $this->assertStringContainsString('attempt 1', $notification->message);
        $notification->delete();
        $service->notifyIfEligible($this->applicant->id);
        $this->assertDatabaseCount('notifications', 0);
        $this->assertDatabaseCount('online_exam_availability_notices', 1);
    }

    public function test_availability_waits_for_both_approvals_and_a_valid_question_bank(): void
    {
        $this->createEligibleExamSetup(false, true);
        $service = app(\App\Services\OnlineExamAvailabilityService::class);
        $service->notifyIfEligible($this->applicant->id);
        $this->assertDatabaseCount('notifications', 0);
        DB::table('admission_applications')->insert(['applicant_id' => $this->applicant->id, 'status' => 'approved']);
        DB::table('scholarship_applications')->update(['status' => 'pending']);
        $service->notifyIfEligible($this->applicant->id);
        $this->assertDatabaseCount('notifications', 0);
        DB::table('scholarship_applications')->update(['status' => 'approved']);
        OnlineExamQuestion::first()->update(['is_active' => false]);
        $service->notifyIfEligible($this->applicant->id);
        $this->assertDatabaseCount('notifications', 0);
        OnlineExamQuestion::first()->update(['is_active' => true]);
        app(\App\Services\NotificationDispatchService::class)->dispatch();
        $this->assertDatabaseCount('notifications', 1);
        $this->assertDatabaseCount('online_exam_availability_notices', 1);
    }

    public function test_availability_respects_attempt_limits_and_notifies_for_an_authorized_retake_once(): void
    {
        $this->createEligibleExamSetup();
        $attempt = $this->createAttempt('completed');
        $service = app(\App\Services\OnlineExamAvailabilityService::class);
        $service->notifyIfEligible($this->applicant->id);
        $this->assertDatabaseCount('notifications', 0);
        $this->actingAs($this->adminUser, 'sanctum')->postJson('/api/admin/online-exams/retake-grants', ['applicant_id' => $this->applicant->id, 'reason' => 'Authorized test retake'])->assertCreated();
        $service->notifyIfEligible($this->applicant->id);
        $this->assertDatabaseCount('notifications', 1);
        $this->assertDatabaseHas('online_exam_availability_notices', ['applicant_id' => $this->applicant->id, 'attempt_number' => 2]);
        $this->assertSame('completed', $attempt->fresh()->status);
        $this->assertNull($attempt->fresh()->results_released_at);
    }

    public function test_failed_availability_delivery_record_rolls_back_its_deduplication_marker(): void
    {
        $this->createEligibleExamSetup();
        $this->mock(\App\Services\ApplicantNotificationService::class)->shouldReceive('create')->once()->andThrow(new \RuntimeException('Simulated availability record failure'));
        try {
            app(\App\Services\OnlineExamAvailabilityService::class)->notifyIfEligible($this->applicant->id);
            $this->fail('Expected simulated availability failure.');
        } catch (\RuntimeException $e) {
            $this->assertSame('Simulated availability record failure', $e->getMessage());
        }
        $this->assertDatabaseCount('notifications', 0);
        $this->assertDatabaseCount('online_exam_availability_notices', 0);
    }

    public function test_refresh_preserves_assignments_and_saved_answer_without_exposing_key(): void
    {
        $this->travelTo(now()->startOfSecond());
        $attempt = $this->createAttempt();
        [$questions, $options] = $this->assignOneHundredQuestions($attempt);
        $originalOrder = DB::table('online_exam_attempt_questions')
            ->where('online_exam_attempt_id', $attempt->id)
            ->orderBy('position')->pluck('online_exam_question_id')->all();

        $this->actingAs($this->applicantUser, 'sanctum')
            ->postJson("/api/applicant/online-exam/attempts/{$attempt->id}/answers", [
                'question_id' => $questions[0]->id,
                'option_id' => $options[0]->id,
            ])->assertOk();

        for ($refresh = 0; $refresh < 2; $refresh++) {
            $response = $this->getJson("/api/applicant/online-exam/attempts/{$attempt->id}/questions")
                ->assertOk()
                ->assertJsonCount(1, 'data.questions')
                ->assertJsonPath('data.questions.0.id', $questions[0]->id)
                ->assertJsonPath('data.questions.0.selected_option_id', $options[0]->id)
                ->assertJsonPath('data.attempt.remaining_seconds', 55);
            $this->assertArrayNotHasKey('is_correct', $response->json('data.questions.0.options.0'));
            $this->assertArrayNotHasKey('score', $response->json('data.attempt'));
        }

        $this->assertSame($originalOrder, DB::table('online_exam_attempt_questions')
            ->where('online_exam_attempt_id', $attempt->id)
            ->orderBy('position')->pluck('online_exam_question_id')->all());
        $this->assertDatabaseCount('online_exam_answers', 1);
    }

    public function test_server_advances_at_deadline_and_rejects_past_and_future_answers(): void
    {
        $this->travelTo(now()->startOfSecond());
        $attempt = $this->createAttempt();
        [$questions, $options] = $this->assignOneHundredQuestions($attempt);
        $this->travel(55)->seconds();

        $this->actingAs($this->applicantUser, 'sanctum')
            ->getJson("/api/applicant/online-exam/attempts/{$attempt->id}/questions")
            ->assertOk()
            ->assertJsonPath('data.questions.0.id', $questions[1]->id)
            ->assertJsonPath('data.attempt.current_question_index', 1)
            ->assertJsonPath('data.attempt.remaining_seconds', 60);

        foreach ([0, 2] as $position) {
            $this->postJson("/api/applicant/online-exam/attempts/{$attempt->id}/answers", [
                'question_id' => $questions[$position]->id,
                'option_id' => $options[$position]->id,
            ])->assertUnprocessable();
        }
        $this->postJson("/api/applicant/online-exam/attempts/{$attempt->id}/answers", [
            'question_id' => $questions[1]->id,
            'option_id' => $options[1]->id,
        ])->assertOk();
        $this->assertDatabaseCount('online_exam_answers', 1);
    }

    public function test_expired_attempt_scores_unanswered_questions_once_and_hides_results(): void
    {
        $this->travelTo(now()->startOfSecond());
        $attempt = $this->createAttempt();
        $this->assignOneHundredQuestions($attempt);
        $attempt->update([
            'started_at' => now()->subMinutes(100),
            'expires_at' => now(),
        ]);

        $this->actingAs($this->applicantUser, 'sanctum')
            ->getJson("/api/applicant/online-exam/attempts/{$attempt->id}")
            ->assertOk()->assertJsonPath('data.status', 'expired');
        $attempt->refresh();
        $this->assertSame('0.00', $attempt->score);
        $this->assertFalse($attempt->passed);
        $completedAt = $attempt->completed_at->toISOString();

        $this->getJson("/api/applicant/online-exam/attempts/{$attempt->id}/result")
            ->assertOk()->assertJsonPath('data.released', false)
            ->assertJsonPath('data.score', null);
        $this->postJson("/api/applicant/online-exam/attempts/{$attempt->id}/submit")
            ->assertUnprocessable();
        $this->assertSame($completedAt, $attempt->fresh()->completed_at->toISOString());
    }

    public function test_admin_attempt_pagination_filters_search_and_validation(): void
    {
        for ($i = 0; $i < 27; $i++) $this->createAttempt($i === 0 ? 'completed' : 'in_progress');
        $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/admin/online-exams/attempts?page=2')->assertOk()
            ->assertJsonPath('data.total', 27)->assertJsonCount(2, 'data.data');
        $this->getJson('/api/admin/online-exams/attempts?status=completed&release=unreleased&search=applicant-test')
            ->assertOk()->assertJsonPath('data.total', 1)->assertJsonPath('data.data.0.status', 'completed');
        $this->getJson('/api/admin/online-exams/attempts?release=released')->assertOk()->assertJsonPath('data.total', 0);
        $this->getJson('/api/admin/online-exams/attempts?status=invalid')->assertUnprocessable();
        $this->getJson('/api/admin/online-exams/attempts?page=0')->assertUnprocessable();
    }

    public function test_staff_and_applicant_cannot_access_admin_exam_management(): void
    {
        $question = OnlineExamQuestion::create(['question' => 'Protected question', 'is_active' => true]);
        $attempt = $this->createAttempt('completed');
        $staff = User::create(['name' => 'Staff', 'email' => 'staff@example.test', 'password' => 'password', 'role' => 'staff']);
        foreach ([$staff, $this->applicantUser] as $user) {
            $this->actingAs($user, 'sanctum');
            $this->getJson('/api/admin/online-exams/questions')->assertForbidden();
            $this->getJson('/api/admin/online-exams/attempts')->assertForbidden();
            $this->postJson('/api/admin/online-exams/questions', [])->assertForbidden();
            $this->putJson("/api/admin/online-exams/questions/{$question->id}", [])->assertForbidden();
            $this->deleteJson("/api/admin/online-exams/questions/{$question->id}")->assertForbidden();
            $this->postJson("/api/admin/online-exams/attempts/{$attempt->id}/release")->assertForbidden();
            $this->postJson('/api/admin/online-exams/retake-grants', [])->assertForbidden();
        }
        $this->assertDatabaseCount('online_exam_questions', 1);
        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_grouped_attempts_paginate_applicants_without_splitting_their_history(): void
    {
        for ($i = 0; $i < 27; $i++) $this->createAttempt($i === 0 ? 'completed' : 'in_progress');
        $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/admin/online-exams/attempts?group_by=applicant')->assertOk()
            ->assertJsonPath('data.total', 1)->assertJsonCount(1, 'data.data')
            ->assertJsonCount(27, 'data.data.0.attempts')
            ->assertJsonPath('data.data.0.applicant_id', $this->applicant->id);
        $this->getJson('/api/admin/online-exams/attempts?group_by=applicant&status=completed')
            ->assertOk()->assertJsonCount(1, 'data.data.0.attempts')
            ->assertJsonPath('data.data.0.attempts.0.status', 'completed');
        $this->getJson('/api/admin/online-exams/attempts?group_by=invalid')->assertUnprocessable();
        $this->actingAs($this->applicantUser, 'sanctum')->getJson('/api/admin/online-exams/attempts?group_by=applicant')->assertForbidden();
    }

    public function test_detailed_online_results_are_private_until_release_and_notifications_have_correct_destination(): void
    {
        $attempt = $this->createAttempt();
        [$questions, $options] = $this->assignOneHundredQuestions($attempt);
        DB::table('online_exam_answers')->insert([
            'online_exam_attempt_id' => $attempt->id, 'online_exam_question_id' => $questions[0]->id,
            'online_exam_option_id' => $options[0]->id, 'answered_at' => now(),
        ]);
        $this->actingAs($this->applicantUser, 'sanctum')->postJson("/api/applicant/online-exam/attempts/{$attempt->id}/submit")->assertOk();
        $this->getJson("/api/applicant/online-exam/attempts/{$attempt->id}/result")->assertOk()
            ->assertJsonPath('data.released', false)->assertJsonMissingPath('data.correct_count');
        $this->getJson('/api/applicant/online-exam')->assertOk()->assertJsonMissingPath('data.attempts.0.correct_count');
        $this->actingAs($this->adminUser, 'sanctum')->postJson("/api/admin/online-exams/attempts/{$attempt->id}/release")->assertOk();
        $this->actingAs($this->applicantUser, 'sanctum')->getJson("/api/applicant/online-exam/attempts/{$attempt->id}/result")->assertOk()
            ->assertJsonPath('data.attempt_id', $attempt->id)->assertJsonPath('data.question_count', 100)
            ->assertJsonPath('data.answered_count', 1)->assertJsonPath('data.unanswered_count', 99)
            ->assertJsonPath('data.correct_count', 1)->assertJsonPath('data.incorrect_count', 0)
            ->assertJsonPath('data.passing_score', 50)->assertJsonPath('data.passed', false)
            ->assertJsonMissingPath('data.questions')->assertJsonMissingPath('data.answers');
        $this->getJson('/api/applicant/online-exam')->assertOk()->assertJsonPath('data.attempts.0.correct_count', 1);
        $this->getJson('/api/applicant/notifications')->assertOk()->assertJsonPath('data.0.destination', 'online_exam');
        $scheduled = new \App\Models\Notification(['type' => 'exam', 'title' => 'Entrance exam result', 'message' => 'View your entrance examination schedule.']);
        $this->assertSame('scheduled_exam', $scheduled->destination);
        $legacy = new \App\Models\Notification(['type' => 'exam', 'title' => 'Online examination result released', 'message' => 'Your official result is available.']);
        $this->assertSame('online_exam', $legacy->destination);
    }

    public function test_question_options_can_be_edited_only_before_assignment(): void
    {
        $payload = ['question' => 'What is the correct answer?', 'options' => [
            ['text' => 'First', 'is_correct' => true], ['text' => 'Second', 'is_correct' => false],
        ]];
        $this->actingAs($this->adminUser, 'sanctum');
        $id = $this->postJson('/api/admin/online-exams/questions', $payload)->assertCreated()->json('data.id');
        $payload['options'][0]['is_correct'] = false;
        $payload['options'][1]['is_correct'] = true;
        $this->putJson("/api/admin/online-exams/questions/{$id}", $payload)->assertOk()
            ->assertJsonPath('data.options.1.is_correct', true);
        $invalid = $payload;
        $invalid['options'][0]['is_correct'] = true;
        $this->putJson("/api/admin/online-exams/questions/{$id}", $invalid)->assertUnprocessable();
        $invalid['options'][0]['is_correct'] = false;
        $invalid['options'][1]['is_correct'] = false;
        $this->putJson("/api/admin/online-exams/questions/{$id}", $invalid)->assertUnprocessable();

        $attempt = $this->createAttempt();
        DB::table('online_exam_attempt_questions')->insert(['online_exam_attempt_id' => $attempt->id, 'online_exam_question_id' => $id, 'position' => 1]);
        $this->putJson("/api/admin/online-exams/questions/{$id}", $payload)->assertUnprocessable();
        $this->deleteJson("/api/admin/online-exams/questions/{$id}")->assertUnprocessable();
        $this->putJson("/api/admin/online-exams/questions/{$id}", ['is_active' => false])->assertOk();
        $this->getJson('/api/admin/online-exams/questions')->assertOk()->assertJsonPath('data.questions.0.attempts_count', 1);
        $this->assertDatabaseCount('online_exam_options', 2);
        $this->assertDatabaseHas('online_exam_options', ['online_exam_question_id' => $id, 'text' => 'Second', 'is_correct' => true]);
    }

    public function test_unused_question_can_be_deleted(): void
    {
        $question = OnlineExamQuestion::create(['question' => 'Unused question', 'is_active' => false]);
        $this->actingAs($this->adminUser, 'sanctum')->deleteJson("/api/admin/online-exams/questions/{$question->id}")->assertOk();
        $this->assertDatabaseMissing('online_exam_questions', ['id' => $question->id]);
    }

    public function test_release_notifies_once_and_applicant_can_read_official_result(): void
    {
        $attempt = $this->createAttempt();
        $this->assignOneHundredQuestions($attempt);
        $this->actingAs($this->applicantUser, 'sanctum')->postJson("/api/applicant/online-exam/attempts/{$attempt->id}/submit")->assertOk();
        $this->assertDatabaseCount('notifications', 0);
        for ($retry = 0; $retry < 2; $retry++) {
            $this->actingAs($this->adminUser, 'sanctum')->postJson("/api/admin/online-exams/attempts/{$attempt->id}/release")->assertOk();
        }
        $this->assertDatabaseCount('notifications', 1);
        $this->actingAs($this->applicantUser, 'sanctum')->getJson("/api/applicant/online-exam/attempts/{$attempt->id}/result")
            ->assertOk()->assertJsonPath('data.released', true)->assertJsonPath('data.score', '0.00');
        $response = $this->getJson('/api/applicant/notifications')->assertOk()->assertJsonPath('unread_count', 1);
        $id = $response->json('data.0.id');
        $this->putJson("/api/applicant/notifications/{$id}/read")->assertOk();
        $firstRead = DB::table('notifications')->where('id', $id)->value('read_at');
        $this->travel(5)->minutes();
        $this->putJson("/api/applicant/notifications/{$id}/read")->assertOk();
        $this->assertSame($firstRead, DB::table('notifications')->where('id', $id)->value('read_at'));
        $this->getJson('/api/applicant/notifications')->assertOk()->assertJsonPath('unread_count', 0);
    }

    public function test_notification_ownership_and_empty_list_are_enforced(): void
    {
        $id = \App\Models\Notification::create(['user_id' => $this->adminUser->id, 'title' => 'Private', 'message' => 'Private', 'is_read' => false])->id;
        $this->actingAs($this->applicantUser, 'sanctum');
        $this->getJson('/api/applicant/notifications')->assertOk()->assertJsonCount(0, 'data')->assertJsonPath('unread_count', 0);
        $this->putJson("/api/applicant/notifications/{$id}/read")->assertForbidden();
        $this->deleteJson("/api/applicant/notifications/{$id}")->assertForbidden();
        $this->assertDatabaseHas('notifications', ['id' => $id, 'is_read' => false]);
    }

    public function test_applicant_announcements_hide_drafts_and_future_publications(): void
    {
        foreach ([['Published', 'published', now()->subMinute()], ['Draft', 'draft', null], ['Future', 'published', now()->addDay()]] as [$title, $status, $published]) {
            \App\Models\Announcement::create(['title' => $title, 'content' => 'College announcement', 'status' => $status, 'published_at' => $published]);
        }
        $this->actingAs($this->applicantUser, 'sanctum')->getJson('/api/applicant/announcements')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.title', 'Published');
    }

    public function test_repeated_announcement_sync_does_not_duplicate_or_reset_read_state(): void
    {
        $announcement = \App\Models\Announcement::create(['title' => 'Published', 'content' => 'College announcement', 'status' => 'published', 'published_at' => now()->subMinute()]);
        $push = $this->mock(\App\Services\FcmService::class);
        $push->shouldNotReceive('sendNotification');
        $service = app(\App\Services\AnnouncementNotificationService::class);
        $service->syncPublishedAnnouncement($announcement);
        DB::table('notifications')->update(['is_read' => true, 'read_at' => now()]);
        $service->syncPublishedAnnouncement($announcement);
        $this->assertDatabaseCount('notifications', 1);
        $this->assertDatabaseHas('notifications', ['user_id' => $this->applicantUser->id, 'announcement_id' => $announcement->id, 'is_read' => true]);
    }

    public function test_announcement_dismissal_is_account_scoped_idempotent_and_survives_sync(): void
    {
        $other = User::create(['name' => 'Other', 'email' => 'announcement-other@example.test', 'password' => 'password', 'role' => 'applicant']);
        $announcement = \App\Models\Announcement::create(['title' => 'Published', 'content' => 'College announcement', 'status' => 'published', 'published_at' => now()->subMinute()]);
        $this->mock(\App\Services\FcmService::class)->shouldNotReceive('sendNotification');
        $service = app(\App\Services\AnnouncementNotificationService::class);
        $service->syncPublishedAnnouncement($announcement);
        $this->actingAs($this->applicantUser, 'sanctum');
        for ($i = 0; $i < 2; $i++) {
            $this->deleteJson("/api/applicant/announcements/{$announcement->id}")->assertOk()->assertJsonPath('success', true);
        }
        $this->applicantUser->update(['fcm_token' => 'dismissed-account-test-device']);
        $service->syncPublishedAnnouncement($announcement);
        $this->getJson('/api/applicant/announcements')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/applicant/notifications')->assertOk()->assertJsonCount(0, 'data')->assertJsonPath('unread_count', 0);
        $this->assertDatabaseCount('announcement_dismissals', 1);
        $this->assertDatabaseHas('announcements', ['id' => $announcement->id]);
        $this->assertDatabaseCount('notifications', 2);
        $this->actingAs($other, 'sanctum')->getJson('/api/applicant/announcements')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/applicant/notifications')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('unread_count', 1);
    }

    public function test_deleting_linked_notification_dismisses_announcement_in_both_feeds(): void
    {
        $announcement = \App\Models\Announcement::create(['title' => 'Published', 'content' => 'College announcement', 'status' => 'published']);
        $notification = \App\Models\Notification::create(['user_id' => $this->applicantUser->id, 'title' => 'Published', 'message' => 'Announcement', 'type' => 'announcement', 'announcement_id' => $announcement->id]);
        $general = \App\Models\Notification::create(['user_id' => $this->applicantUser->id, 'title' => 'General', 'message' => 'Personal']);
        $this->actingAs($this->applicantUser, 'sanctum')->deleteJson("/api/applicant/notifications/{$notification->id}")->assertOk();
        $this->getJson('/api/applicant/announcements')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/applicant/notifications')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $general->id);
        $this->deleteJson("/api/applicant/notifications/{$general->id}")->assertOk();
        $this->assertDatabaseMissing('notifications', ['id' => $general->id]);
    }

    public function test_draft_future_missing_and_non_applicant_announcement_dismissals_are_rejected(): void
    {
        $this->actingAs($this->applicantUser, 'sanctum');
        foreach ([['draft', null], ['published', now()->addDay()]] as [$status, $date]) {
            $announcement = \App\Models\Announcement::create(['title' => 'Hidden', 'content' => 'Hidden', 'status' => $status, 'published_at' => $date]);
            $this->deleteJson("/api/applicant/announcements/{$announcement->id}")->assertNotFound();
        }
        $this->deleteJson('/api/applicant/announcements/999999')->assertNotFound();
        $this->actingAs($this->adminUser, 'sanctum')->deleteJson("/api/applicant/announcements/{$announcement->id}")->assertForbidden();
        $this->assertDatabaseCount('announcement_dismissals', 0);
    }

    public function test_anonymous_announcement_dismissal_requires_authentication(): void
    {
        $this->deleteJson('/api/applicant/announcements/1')->assertUnauthorized();
        $this->assertDatabaseCount('announcement_dismissals', 0);
    }

    public function test_online_review_requires_separate_explicit_permission_and_program_scope(): void
    {
        [$user, $staff] = $this->staffExamFixture();
        $attempt = $this->createAttempt('completed');
        $attempt->update(['score' => 80, 'passed' => true, 'completed_at' => now()]);
        $this->actingAs($user->fresh(), 'sanctum')->getJson('/api/staff/online-exams/attempts')->assertForbidden();
        $staff->permissions()->update(['review_online_exams' => true]);
        $this->actingAs($user->fresh(), 'sanctum');
        $response = $this->getJson('/api/staff/online-exams/attempts')->assertOk()->assertJsonCount(1, 'data.data')->assertJsonPath('data.data.0.score', '80.00');
        foreach (['answers', 'assigned_questions', 'remarks', 'passed', 'results_released_by'] as $key) {
            $this->assertArrayNotHasKey($key, $response->json('data.data.0'));
        }
        $staff->academicPrograms()->sync([2]);
        DB::table('admission_applications')->where('applicant_id', $this->applicant->id)->where('academic_program_id', 2)->delete();
        $this->actingAs($user->fresh(), 'sanctum')->getJson('/api/staff/online-exams/attempts')->assertOk()->assertJsonCount(0, 'data.data');
        $this->putJson("/api/staff/online-exams/attempts/{$attempt->id}/review", ['recommendation' => 'needs_attention', 'remarks' => 'Review notes'])->assertForbidden();
        $this->assertDatabaseCount('online_exam_reviews', 0);
    }

    public function test_online_review_is_audited_idempotent_and_never_releases_or_changes_score(): void
    {
        [$user, $staff] = $this->staffExamFixture();
        $staff->permissions()->update(['review_online_exams' => true]);
        $attempt = $this->createAttempt('completed');
        $attempt->update(['score' => 80, 'passed' => true, 'completed_at' => now()]);
        $payload = ['recommendation' => 'ready_for_admin_review', 'remarks' => 'Checked completion record.', 'score' => 100, 'results_released_at' => now()->toIso8601String()];
        $this->actingAs($user->fresh(), 'sanctum');
        for ($i = 0; $i < 2; $i++) $this->putJson("/api/staff/online-exams/attempts/{$attempt->id}/review", $payload)->assertOk();
        $this->assertDatabaseCount('online_exam_reviews', 1);
        $this->assertDatabaseHas('online_exam_reviews', ['online_exam_attempt_id' => $attempt->id, 'reviewed_by' => $user->id]);
        $this->assertSame(1, DB::table('workflow_events')->where('action', 'staff_review')->count());
        $this->assertSame('80.00', $attempt->fresh()->score);
        $this->assertNull($attempt->fresh()->results_released_at);
        $this->postJson("/api/admin/online-exams/attempts/{$attempt->id}/release")->assertForbidden();
        $this->postJson('/api/admin/online-exams/retake-grants', ['applicant_id' => $this->applicant->id, 'reason' => 'Not authorized'])->assertForbidden();
        $this->actingAs($this->adminUser, 'sanctum')->getJson('/api/admin/online-exams/attempts')->assertOk()->assertJsonPath('data.data.0.reviews.0.reviewer.name', $user->name);
        $this->actingAs($this->applicantUser, 'sanctum')->getJson("/api/applicant/online-exam/attempts/{$attempt->id}")->assertOk()->assertJsonMissingPath('data.reviews')->assertJsonMissingPath('data.score');
    }

    public function test_online_review_rejects_invalid_input_open_or_released_attempts_and_revoked_permission(): void
    {
        [$user, $staff] = $this->staffExamFixture();
        $staff->permissions()->update(['review_online_exams' => true]);
        $attempt = $this->createAttempt();
        $path = "/api/staff/online-exams/attempts/{$attempt->id}/review";
        $valid = ['recommendation' => 'needs_attention', 'remarks' => 'Check this record.'];
        $this->actingAs($user->fresh(), 'sanctum')->putJson($path, $valid)->assertConflict();
        $attempt->update(['status' => 'completed']);
        $this->putJson($path, ['recommendation' => 'approve', 'remarks' => ''])->assertUnprocessable();
        $attempt->update(['results_released_at' => now()]);
        $this->putJson($path, $valid)->assertConflict();
        $staff->permissions()->update(['review_online_exams' => false]);
        $this->actingAs($user->fresh(), 'sanctum')->putJson($path, $valid)->assertForbidden();
        $staff->update(['status' => 'inactive']);
        $this->actingAs($user->fresh(), 'sanctum')->getJson('/api/staff/online-exams/attempts')->assertForbidden();
        $this->actingAs($this->applicantUser, 'sanctum')->getJson('/api/staff/online-exams/attempts')->assertForbidden();
        $this->assertDatabaseCount('online_exam_reviews', 0);
    }

    private function staffExamFixture(): array
    {
        Schema::table('admission_applications', fn (Blueprint $table) => $table->unsignedBigInteger('academic_program_id')->nullable());
        Schema::create('staff', function (Blueprint $table) {
            $table->id(); $table->unsignedBigInteger('user_id'); $table->string('status'); $table->timestamps();
        });
        Schema::create('staff_permissions', function (Blueprint $table) {
            $table->id(); $table->unsignedBigInteger('staff_id'); $table->boolean('manage_exams')->default(false);
            $table->boolean('review_online_exams')->default(false);
            $table->boolean('send_notifications')->default(false); $table->boolean('manage_scholarships')->default(false); $table->timestamps();
        });
        Schema::create('academic_programs', function (Blueprint $table) {
            $table->id(); $table->string('name'); $table->string('code'); $table->timestamps();
        });
        Schema::create('staff_programs', function (Blueprint $table) {
            $table->id(); $table->unsignedBigInteger('staff_id'); $table->unsignedBigInteger('academic_program_id');
        });
        Schema::create('entrance_exams', function (Blueprint $table) {
            $table->id(); $table->string('title'); $table->date('exam_date'); $table->string('venue')->nullable();
            $table->timestamp('results_released_at')->nullable(); $table->timestamps();
        });
        Schema::create('exam_assignments', function (Blueprint $table) {
            $table->id(); $table->unsignedBigInteger('entrance_exam_id'); $table->unsignedBigInteger('applicant_id');
            $table->string('status')->default('assigned'); $table->integer('score')->nullable(); $table->text('remarks')->nullable(); $table->timestamps();
        });
        $staffUser = User::create(['name' => 'Reviewer', 'email' => 'reviewer@example.test', 'password' => 'password', 'role' => 'staff']);
        $staff = \App\Models\Staff::create(['user_id' => $staffUser->id, 'status' => 'active']);
        \App\Models\StaffPermission::create(['staff_id' => $staff->id, 'manage_exams' => true]);
        foreach ([1, 2] as $id) DB::table('academic_programs')->insert(['id' => $id, 'name' => "Program {$id}", 'code' => "P{$id}"]);
        DB::table('staff_programs')->insert(['staff_id' => $staff->id, 'academic_program_id' => 1]);
        // The authorized applicant has admissions in two programs; only one may be included.
        foreach ([1, 2] as $program) DB::table('admission_applications')->insert(['applicant_id' => $this->applicant->id, 'academic_program_id' => $program, 'status' => 'approved']);
        $otherUser = User::create(['name' => 'Other', 'email' => 'other-review@example.test', 'password' => 'password', 'role' => 'applicant']);
        $other = Applicant::create(['user_id' => $otherUser->id, 'first_name' => 'Other']);
        DB::table('admission_applications')->insert(['applicant_id' => $other->id, 'academic_program_id' => 2, 'status' => 'approved']);
        $exam = \App\Models\EntranceExam::create(['title' => 'Shared schedule', 'exam_date' => now()->addDay()]);
        foreach ([$this->applicant, $other] as $applicant) \App\Models\ExamAssignment::create(['entrance_exam_id' => $exam->id, 'applicant_id' => $applicant->id, 'score' => 75, 'remarks' => 'Restricted remark']);
        return [$staffUser, $staff, $exam];
    }

    public function test_staff_exam_list_show_and_update_scope_nested_assignments_and_hide_results(): void
    {
        [$user, $staff, $exam] = $this->staffExamFixture();
        $this->actingAs($user, 'sanctum');
        $list = $this->getJson('/api/staff/exams')->assertOk()->assertJsonCount(1, 'data.0.exam_assignments');
        $this->assertArrayNotHasKey('score', $list->json('data.0.exam_assignments.0'));
        $list->assertJsonCount(1, 'data.0.exam_assignments.0.applicant.admission_applications');
        $this->getJson("/api/staff/exams/{$exam->id}")->assertOk()->assertJsonCount(1, 'data.exam_assignments');
        $updated = $this->putJson("/api/staff/exams/{$exam->id}", ['venue' => 'Test room'])->assertOk()->assertJsonCount(1, 'data.exam_assignments');
        $this->assertArrayNotHasKey('remarks', $updated->json('data.exam_assignments.0'));
        $exam->update(['results_released_at' => now()]);
        $this->getJson("/api/staff/exams/{$exam->id}")->assertOk()->assertJsonCount(1, 'data.exam_assignments')->assertJsonPath('data.exam_assignments.0.score', 75);
    }

    public function test_staff_exam_access_requires_active_permission_and_program_assignment(): void
    {
        [$user, $staff, $exam] = $this->staffExamFixture();
        $this->actingAs($user, 'sanctum');
        DB::table('staff_permissions')->update(['manage_exams' => false]);
        $this->getJson('/api/staff/exams')->assertForbidden();
        DB::table('staff_permissions')->update(['manage_exams' => true]);
        DB::table('staff')->update(['status' => 'inactive']);
        $this->actingAs($user->fresh(), 'sanctum');
        $this->getJson('/api/staff/exams')->assertForbidden();
        DB::table('staff')->update(['status' => 'active']);
        DB::table('staff_programs')->delete();
        $this->actingAs($user->fresh(), 'sanctum');
        $this->getJson('/api/staff/exams')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson("/api/staff/exams/{$exam->id}")->assertForbidden();
        $this->putJson("/api/staff/exams/{$exam->id}", ['venue' => 'Unauthorized'])->assertForbidden();
    }

    public function test_scheduled_applicant_result_privacy_and_ownership_are_preserved(): void
    {
        [$user, $staff, $exam] = $this->staffExamFixture();
        $this->actingAs($this->applicantUser, 'sanctum');
        $response = $this->getJson('/api/applicant/exams')->assertOk()->assertJsonCount(1, 'data');
        $this->assertArrayNotHasKey('score', $response->json('data.0'));
        $this->assertArrayNotHasKey('remarks', $response->json('data.0'));
        $otherId = DB::table('exam_assignments')->where('applicant_id', '!=', $this->applicant->id)->value('id');
        $this->getJson("/api/applicant/exams/{$otherId}")->assertForbidden();
        $exam->update(['results_released_at' => now()]);
        $this->getJson('/api/applicant/exams')->assertOk()->assertJsonPath('data.0.score', 75);
    }

    public function test_staff_notifications_respect_permission_and_recipient_program_scope(): void
    {
        [$user, $staff, $exam] = $this->staffExamFixture();
        $this->actingAs($user, 'sanctum')->getJson('/api/staff/notifications')->assertForbidden();
        DB::table('staff_permissions')->update(['send_notifications' => true]);
        $this->actingAs($user->fresh(), 'sanctum');
        $ownId = \App\Models\Notification::create(['user_id' => $this->applicantUser->id, 'title' => 'Assigned', 'message' => 'Test'])->id;
        $other = Applicant::where('id', '!=', $this->applicant->id)->firstOrFail();
        $otherId = \App\Models\Notification::create(['user_id' => $other->user_id, 'title' => 'Unassigned', 'message' => 'Test'])->id;
        $adminId = \App\Models\Notification::create(['user_id' => $this->adminUser->id, 'title' => 'Admin', 'message' => 'Test'])->id;
        $this->getJson('/api/staff/notifications')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $ownId);
        foreach ([$otherId, $adminId] as $id) $this->deleteJson("/api/staff/notifications/{$id}")->assertForbidden();
        $this->postJson('/api/staff/notifications', ['applicant_id' => $other->id, 'title' => 'Test', 'message' => 'Test'])->assertForbidden();
        $this->postJson('/api/staff/notifications', ['applicant_id' => $this->applicant->id, 'title' => 'Test', 'message' => 'Test'])->assertCreated();
    }

    public function test_staff_recommendation_cannot_finalize_a_scholarship_award(): void
    {
        [$user, $staff, $exam] = $this->staffExamFixture();
        Schema::table('scholarship_applications', function (Blueprint $table) {
            $table->string('staff_recommendation')->nullable();
            $table->text('staff_recommendation_remarks')->nullable();
            $table->unsignedBigInteger('staff_recommended_by')->nullable();
            $table->timestamp('staff_recommended_at')->nullable();
        });
        DB::table('staff_permissions')->update(['manage_scholarships' => true]);
        $scholarshipId = DB::table('scholarships')->insertGetId(['category' => 'other', 'is_active' => true, 'requires_online_exam' => true]);
        $id = DB::table('scholarship_applications')->insertGetId(['applicant_id' => $this->applicant->id, 'scholarship_id' => $scholarshipId, 'status' => 'pending']);
        $this->actingAs($user->fresh(), 'sanctum')->putJson("/api/staff/scholarship-applications/{$id}", ['staff_recommendation' => 'recommended', 'status' => 'approved'])
            ->assertOk()->assertJsonPath('data.status', 'under_review')->assertJsonPath('data.staff_recommendation', 'recommended');
        DB::table('scholarship_applications')->where('id', $id)->update(['status' => 'approved']);
        $this->putJson("/api/staff/scholarship-applications/{$id}", ['staff_recommendation' => 'not_recommended'])->assertConflict();
        $this->assertDatabaseHas('scholarship_applications', ['id' => $id, 'status' => 'approved']);
    }

    private function userProfileFixture(): array
    {
        [$user, $staff] = $this->staffExamFixture();
        Schema::table('staff', function (Blueprint $table) {
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('employee_id')->nullable();
        });
        $staff->update(['first_name' => 'Staff', 'last_name' => 'Reviewer', 'employee_id' => 'TEST-STAFF']);
        Schema::create('application_documents', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('admission_application_id');
        });
        return [$user, $staff];
    }

    public function test_admin_can_view_staff_and_applicant_profiles_without_exposing_credentials(): void
    {
        [$user, $staff] = $this->userProfileFixture();
        foreach (['active', 'inactive'] as $status) {
            $staff->update(['status' => $status]);
            $response = $this->actingAs($this->adminUser, 'sanctum')->getJson("/api/admin/staff/{$staff->id}")
                ->assertOk()->assertJsonPath('data.first_name', 'Staff')
                ->assertJsonPath('data.employee_id', 'TEST-STAFF')
                ->assertJsonPath('data.user.email', $user->email)
                ->assertJsonPath('data.status', $status)->assertJsonCount(1, 'data.academic_programs');
            $this->assertArrayNotHasKey('password', $response->json('data.user'));
            $this->assertArrayNotHasKey('remember_token', $response->json('data.user'));
        }
        $response = $this->getJson("/api/admin/applicants/{$this->applicant->id}")->assertOk()
            ->assertJsonPath('data.first_name', 'Test')->assertJsonPath('data.user.email', $this->applicantUser->email);
        $this->assertArrayNotHasKey('password', $response->json('data.user'));
        $this->assertArrayNotHasKey('remember_token', $response->json('data.user'));
    }

    public function test_staff_and_applicants_cannot_use_admin_profile_endpoints(): void
    {
        [$user, $staff] = $this->userProfileFixture();
        $paths = ["/api/admin/staff/{$staff->id}", "/api/admin/applicants/{$this->applicant->id}"];
        foreach ($paths as $path) $this->getJson($path)->assertUnauthorized();
        foreach ([$user, $this->applicantUser] as $identity) {
            $this->actingAs($identity, 'sanctum');
            foreach ($paths as $path) $this->getJson($path)->assertForbidden();
        }
        $this->actingAs($this->adminUser, 'sanctum')->getJson('/api/admin/staff/999999')->assertNotFound();
    }

    private function navigationExam(): array
    {
        $this->travelTo(now()->startOfSecond());
        $this->createEligibleExamSetup();
        $id = $this->actingAs($this->applicantUser, 'sanctum')->postJson('/api/applicant/online-exam/start')->assertCreated()->json('data.id');
        $data = $this->getJson("/api/applicant/online-exam/attempts/{$id}/questions")->assertOk()->json('data');
        return [$id, $data];
    }

    private function navigationRequest(int $id, array $data, string $direction): array
    {
        return ['direction' => $direction, 'question_id' => $data['questions'][0]['id'], 'expected_revision' => $data['attempt']['navigation_revision']];
    }

    public function test_next_carries_time_once_and_review_navigation_does_not_grant_time(): void
    {
        [$id, $first] = $this->navigationExam();
        $expiry = $first['attempt']['expires_at'];
        $this->travel(20)->seconds();
        $this->postJson("/api/applicant/online-exam/attempts/{$id}/answers", ['question_id' => $first['questions'][0]['id'], 'option_id' => $first['questions'][0]['options'][0]['id'], 'expected_revision' => 0])->assertOk();
        $payload = $this->navigationRequest($id, $first, 'next');
        $second = $this->postJson("/api/applicant/online-exam/attempts/{$id}/navigate", $payload)->assertOk()->assertJsonPath('data.attempt.remaining_seconds', 100)->assertJsonPath('data.attempt.active_question_index', 1)->json('data');
        $this->assertSame($expiry, $second['attempt']['expires_at']);
        $this->postJson("/api/applicant/online-exam/attempts/{$id}/navigate", $payload)->assertConflict();
        $review = $this->postJson("/api/applicant/online-exam/attempts/{$id}/navigate", $this->navigationRequest($id, $second, 'previous'))->assertOk()->assertJsonPath('data.attempt.is_reviewing', true)->assertJsonPath('data.questions.0.id', $first['questions'][0]['id'])->json('data');
        $forward = $this->postJson("/api/applicant/online-exam/attempts/{$id}/navigate", $this->navigationRequest($id, $review, 'next'))->assertOk()->json('data');
        $this->assertSame($second['attempt']['question_deadline_at'], $forward['attempt']['question_deadline_at']);
        $this->assertSame(100, $forward['attempt']['remaining_seconds']);
        $this->assertSame(1, $forward['attempt']['active_question_index']);
        $this->assertDatabaseCount('online_exam_attempt_questions', 100);
    }

    public function test_review_answers_are_editable_until_exactly_25_seconds_then_server_returns_to_active(): void
    {
        [$id, $first] = $this->navigationExam();
        $answer = ['question_id' => $first['questions'][0]['id'], 'option_id' => $first['questions'][0]['options'][0]['id'], 'expected_revision' => 0];
        $this->postJson("/api/applicant/online-exam/attempts/{$id}/answers", $answer)->assertOk();
        $second = $this->postJson("/api/applicant/online-exam/attempts/{$id}/navigate", $this->navigationRequest($id, $first, 'next'))->assertOk()->json('data');
        $this->travel(70)->seconds(); // Q1's former fixed window has passed; Q2 still has 50 seconds.
        $review = $this->postJson("/api/applicant/online-exam/attempts/{$id}/navigate", $this->navigationRequest($id, $second, 'previous'))->assertOk()->json('data');
        $answer['option_id'] = $first['questions'][0]['options'][1]['id'];
        $answer['expected_revision'] = $review['attempt']['navigation_revision'];
        $this->postJson("/api/applicant/online-exam/attempts/{$id}/answers", $answer)->assertOk();
        $this->travel(25)->seconds(); // Exactly 25 seconds on the active question.
        $current = $this->getJson("/api/applicant/online-exam/attempts/{$id}/questions")->assertOk()->assertJsonPath('data.attempt.current_question_index', 1)->assertJsonPath('data.attempt.is_reviewing', false)->assertJsonPath('data.attempt.can_previous', false)->assertJsonPath('data.attempt.remaining_seconds', 25)->json('data');
        $this->postJson("/api/applicant/online-exam/attempts/{$id}/answers", $answer)->assertUnprocessable();
        $this->postJson("/api/applicant/online-exam/attempts/{$id}/navigate", $this->navigationRequest($id, $current, 'previous'))->assertUnprocessable();
        $this->assertDatabaseHas('online_exam_answers', ['online_exam_attempt_id' => $id, 'online_exam_question_id' => $answer['question_id'], 'online_exam_option_id' => $answer['option_id']]);
    }

    public function test_navigation_rejects_unsaved_answers_stale_positions_and_client_timer_manipulation(): void
    {
        [$id, $first] = $this->navigationExam();
        $payload = $this->navigationRequest($id, $first, 'next') + ['remaining_seconds' => 999999, 'current_question_index' => 99];
        $this->postJson("/api/applicant/online-exam/attempts/{$id}/navigate", $payload)->assertUnprocessable();
        $this->postJson("/api/applicant/online-exam/attempts/{$id}/answers", ['question_id' => $first['questions'][0]['id'], 'option_id' => $first['questions'][0]['options'][0]['id']])->assertConflict();
        $this->postJson("/api/applicant/online-exam/attempts/{$id}/answers", ['question_id' => $first['questions'][0]['id'], 'option_id' => $first['questions'][0]['options'][0]['id'], 'expected_revision' => 0])->assertOk();
        $this->postJson("/api/applicant/online-exam/attempts/{$id}/navigate", $payload)->assertOk()->assertJsonPath('data.attempt.remaining_seconds', 120);
        $this->postJson("/api/applicant/online-exam/attempts/{$id}/navigate", $payload)->assertConflict();
        $this->assertSame(1, OnlineExamAttempt::findOrFail($id)->current_question_index);
    }

    public function test_navigation_clock_survives_refresh_network_gaps_and_final_expiration_without_exposing_results(): void
    {
        [$id, $first] = $this->navigationExam();
        $ids = DB::table('online_exam_attempt_questions')->where('online_exam_attempt_id', $id)->orderBy('position')->pluck('online_exam_question_id')->all();
        $this->travel(180)->seconds();
        $this->getJson("/api/applicant/online-exam/attempts/{$id}/questions")->assertOk()->assertJsonPath('data.attempt.current_question_index', 3)->assertJsonPath('data.attempt.remaining_seconds', 60);
        $this->assertSame($ids, DB::table('online_exam_attempt_questions')->where('online_exam_attempt_id', $id)->orderBy('position')->pluck('online_exam_question_id')->all());
        $this->travel(5820)->seconds();
        $this->getJson("/api/applicant/online-exam/attempts/{$id}")->assertOk()->assertJsonPath('data.status', 'expired')->assertJsonMissingPath('data.score');
        $this->postJson("/api/applicant/online-exam/attempts/{$id}/navigate", $this->navigationRequest($id, $first, 'next'))->assertUnprocessable();
        $this->assertDatabaseCount('online_exam_attempts', 1);
    }

    public function test_navigation_cannot_access_other_accounts_or_bypass_revoked_scholarship(): void
    {
        [$id, $data] = $this->navigationExam();
        $other = User::create(['name' => 'Other navigator', 'email' => 'other-navigation@example.test', 'password' => 'password', 'role' => 'applicant']);
        Applicant::create(['user_id' => $other->id, 'first_name' => 'Other']);
        $this->actingAs($other, 'sanctum')->postJson("/api/applicant/online-exam/attempts/{$id}/navigate", $this->navigationRequest($id, $data, 'next'))->assertForbidden();
        DB::table('scholarship_applications')->update(['status' => 'pending']);
        $this->actingAs($this->applicantUser, 'sanctum')->postJson("/api/applicant/online-exam/attempts/{$id}/navigate", $this->navigationRequest($id, $data, 'next'))->assertForbidden();
        $this->assertSame(0, OnlineExamAttempt::findOrFail($id)->current_question_index);
    }

    public function test_navigation_final_question_cannot_extend_attempt_and_can_be_submitted(): void
    {
        [$id] = $this->navigationExam();
        $this->travel(5940)->seconds();
        $last = $this->getJson("/api/applicant/online-exam/attempts/{$id}/questions")->assertOk()->assertJsonPath('data.attempt.active_question_index', 99)->json('data');
        $expiry = $last['attempt']['expires_at'];
        $this->postJson("/api/applicant/online-exam/attempts/{$id}/navigate", $this->navigationRequest($id, $last, 'next'))->assertUnprocessable();
        $this->postJson("/api/applicant/online-exam/attempts/{$id}/answers", ['question_id' => $last['questions'][0]['id'], 'option_id' => $last['questions'][0]['options'][0]['id'], 'expected_revision' => $last['attempt']['navigation_revision']])->assertOk();
        $this->postJson("/api/applicant/online-exam/attempts/{$id}/submit")->assertOk()->assertJsonPath('data.status', 'completed')->assertJsonMissingPath('data.score');
        $this->assertTrue(OnlineExamAttempt::findOrFail($id)->expires_at->equalTo($expiry));
    }

    public function test_existing_attempt_retains_fixed_windows_and_rejects_new_navigation(): void
    {
        [$id, $first] = $this->navigationExam();
        OnlineExamAttempt::whereKey($id)->update(['navigation_mode' => 1]);
        $this->postJson("/api/applicant/online-exam/attempts/{$id}/navigate", $this->navigationRequest($id, $first, 'next'))->assertUnprocessable();
        $this->travel(61)->seconds();
        $this->getJson("/api/applicant/online-exam/attempts/{$id}/questions")->assertOk()->assertJsonPath('data.attempt.navigation_enabled', false)->assertJsonPath('data.attempt.current_question_index', 1)->assertJsonPath('data.attempt.remaining_seconds', 59);
        $this->postJson("/api/applicant/online-exam/attempts/{$id}/answers", ['question_id' => $first['questions'][0]['id'], 'option_id' => $first['questions'][0]['options'][0]['id']])->assertUnprocessable();
    }

    public function test_eligible_applicant_can_start_first_exam(): void
    {
        $this->createEligibleExamSetup();

        $response = $this->actingAs($this->applicantUser, 'sanctum')
            ->postJson('/api/applicant/online-exam/start');

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Attempt started.')
            ->assertJsonPath('data.question_count', 100)
            ->assertJsonPath('data.seconds_per_question', 60);

        $this->assertDatabaseCount('online_exam_attempts', 1);
        $this->assertDatabaseCount('online_exam_attempt_questions', 100);
    }

    public function test_admin_timing_setting_is_validated_and_restricted_to_administrators(): void
    {
        $path = '/api/admin/online-exams/settings';
        $this->putJson($path, ['seconds_per_question' => 90])->assertUnauthorized();
        $this->actingAs($this->applicantUser, 'sanctum')->putJson($path, ['seconds_per_question' => 90])->assertForbidden();
        $staff = User::create(['name' => 'Staff', 'email' => 'timing-staff@example.test', 'password' => 'test-password', 'role' => 'staff']);
        $this->actingAs($staff, 'sanctum')->putJson($path, ['seconds_per_question' => 90])->assertForbidden();

        $this->actingAs($this->adminUser, 'sanctum');
        foreach ([null, 0, -1, 1.5, 3601, 'invalid'] as $seconds) {
            $this->putJson($path, ['seconds_per_question' => $seconds])->assertUnprocessable()->assertJsonValidationErrors('seconds_per_question');
        }
        $this->assertDatabaseHas('online_exam_settings', ['id' => 1, 'seconds_per_question' => 60]);
        foreach ([1, 3600, 90] as $seconds) {
            $this->putJson($path, ['seconds_per_question' => $seconds])->assertOk()->assertJsonPath('data.seconds_per_question', $seconds);
        }
        $this->getJson('/api/admin/online-exams/questions')->assertOk()->assertJsonPath('data.seconds_per_question', 90);
        $this->assertDatabaseHas('online_exam_settings', ['id' => 1, 'seconds_per_question' => 90, 'updated_by' => $this->adminUser->id]);
    }

    public function test_custom_timing_is_snapshotted_and_enforced_after_settings_change(): void
    {
        $this->createEligibleExamSetup();
        $this->actingAs($this->adminUser, 'sanctum')->putJson('/api/admin/online-exams/settings', ['seconds_per_question' => 90])->assertOk();
        $this->actingAs($this->applicantUser, 'sanctum')->getJson('/api/applicant/online-exam')->assertOk()->assertJsonPath('data.seconds_per_question', 90);
        $this->postJson('/api/applicant/online-exam/start', ['seconds_per_question' => 9999])->assertCreated()->assertJsonPath('data.seconds_per_question', 90);
        $attempt = OnlineExamAttempt::firstOrFail();
        $this->assertEquals(9000, $attempt->started_at->diffInSeconds($attempt->expires_at));
        $this->actingAs($this->adminUser, 'sanctum')->putJson('/api/admin/online-exams/settings', ['seconds_per_question' => 30])->assertOk();
        $this->actingAs($this->applicantUser, 'sanctum')->getJson('/api/applicant/online-exam')->assertOk()->assertJsonPath('data.seconds_per_question', 90);
        $this->assertSame(90, (int) $attempt->fresh()->seconds_per_question);
        $this->travelTo($attempt->started_at->copy()->addSeconds(91));
        $this->getJson('/api/applicant/online-exam/attempt')->assertOk()->assertJsonPath('data.seconds_per_question', 90)->assertJsonPath('data.current_question_index', 1);
        $this->travelTo($attempt->expires_at->copy()->addSecond());
        $this->getJson('/api/applicant/online-exam')->assertOk()->assertJsonPath('data.status', 'completed');
        $this->assertSame('expired', $attempt->fresh()->status);
    }

    public function test_exam_start_requires_approved_admission(): void
    {
        $this->createEligibleExamSetup(approvedAdmission: false);

        $response = $this->actingAs($this->applicantUser, 'sanctum')
            ->postJson('/api/applicant/online-exam/start');

        $response->assertForbidden()
            ->assertJsonPath(
                'message',
                'Your admission application must be approved before you can take the online examination.'
            );

        $this->assertDatabaseCount('online_exam_attempts', 0);
    }

    public function test_exam_start_requires_eligible_other_scholarship(): void
    {
        $this->createEligibleExamSetup(approvedOtherScholarship: false);

        $response = $this->actingAs($this->applicantUser, 'sanctum')
            ->postJson('/api/applicant/online-exam/start');

        $response->assertForbidden()
            ->assertJsonPath(
                'message',
                \App\Http\Controllers\Api\Applicant\OnlineExamController::SCHOLARSHIP_APPROVAL_MESSAGE
            );

        $this->assertDatabaseCount('online_exam_attempts', 0);
    }

    public function test_applicant_cannot_start_second_attempt_without_retake(): void
    {
        $this->createEligibleExamSetup();
        $this->createAttempt('completed');

        $response = $this->actingAs($this->applicantUser, 'sanctum')
            ->postJson('/api/applicant/online-exam/start');

        $response->assertForbidden()
            ->assertJsonPath(
                'message',
                'You have already used all of your allowed attempts.'
            );

        $this->assertDatabaseCount('online_exam_attempts', 1);
    }

    public function test_authorized_retake_can_be_used_once(): void
    {
        $this->createEligibleExamSetup();
        $this->createAttempt('completed');

        $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/admin/online-exams/retake-grants', [
                'applicant_id' => $this->applicant->id,
                'reason' => 'Approved retake for workflow testing.',
            ])
            ->assertCreated();

        // The applicant may now start the authorized second attempt.
        $this->actingAs($this->applicantUser, 'sanctum')
            ->postJson('/api/applicant/online-exam/start')
            ->assertCreated()
            ->assertJsonPath('message', 'Attempt started.');

        $this->assertDatabaseCount('online_exam_attempts', 2);
        $this->assertDatabaseCount('online_exam_attempt_questions', 100);

        // Complete the second attempt, then verify the consumed grant
        // does not authorize a third attempt.
        OnlineExamAttempt::where('applicant_id', $this->applicant->id)
            ->where('status', 'in_progress')
            ->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

        $this->actingAs($this->applicantUser, 'sanctum')
            ->postJson('/api/applicant/online-exam/start')
            ->assertForbidden()
            ->assertJsonPath(
                'message',
                'You have already used all of your allowed attempts.'
            );

        $this->assertDatabaseCount('online_exam_attempts', 2);
        $this->assertDatabaseCount('online_exam_retake_grants', 1);
    }

    public function test_revoked_scholarship_blocks_resume_questions_answers_submit_and_start_recovery(): void
    {
        $this->travelTo(now()->startOfSecond());
        $attempt = $this->createAttempt();
        [$questions, $options] = $this->assignOneHundredQuestions($attempt);
        $base = "/api/applicant/online-exam/attempts/{$attempt->id}";
        $answer = ['question_id' => $questions[0]->id, 'option_id' => $options[0]->id];
        $this->actingAs($this->applicantUser, 'sanctum')->postJson("{$base}/answers", $answer)->assertOk();
        $original = $attempt->fresh()->getAttributes();
        $order = DB::table('online_exam_attempt_questions')->where('online_exam_attempt_id', $attempt->id)->orderBy('position')->pluck('online_exam_question_id')->all();
        $applicationId = DB::table('scholarship_applications')->where('applicant_id', $this->applicant->id)->value('id');
        $this->actingAs($this->adminUser, 'sanctum')->putJson("/api/admin/scholarship-applications/{$applicationId}", ['status' => 'pending'])->assertOk();
        $this->actingAs($this->applicantUser, 'sanctum');

        foreach ([['GET', '/api/applicant/online-exam/attempt'], ['GET', $base], ['GET', "{$base}/questions"], ['POST', "{$base}/answers"], ['POST', "{$base}/submit"], ['POST', '/api/applicant/online-exam/start']] as [$method, $url]) {
            $response = $this->json($method, $url, $answer)->assertForbidden()->assertJsonPath('code', 'ONLINE_EXAM_SCHOLARSHIP_APPROVAL_REQUIRED');
            $this->assertArrayNotHasKey('data', $response->json());
        }
        $this->getJson('/api/applicant/online-exam')->assertOk()->assertJsonPath('data.eligible', false);
        $this->assertSame($original, $attempt->fresh()->getAttributes());
        $this->assertDatabaseCount('online_exam_attempts', 1);
        $this->assertDatabaseCount('online_exam_answers', 1);

        // Approval restoration resumes the same attempt without extending its deadlines.
        $this->travel(61)->seconds();
        DB::table('scholarship_applications')->where('applicant_id', $this->applicant->id)->update(['status' => 'approved']);
        $this->getJson("{$base}/questions")->assertOk()->assertJsonPath('data.questions.0.question_number', 2);
        $this->assertSame($original['started_at'], $attempt->fresh()->getAttributes()['started_at']);
        $this->assertSame($original['expires_at'], $attempt->fresh()->getAttributes()['expires_at']);
        $this->assertSame($order, DB::table('online_exam_attempt_questions')->where('online_exam_attempt_id', $attempt->id)->orderBy('position')->pluck('online_exam_question_id')->all());
        $this->postJson("{$base}/answers", $answer)->assertUnprocessable();
    }

    public function test_unapproved_statuses_and_inactive_scholarships_cannot_resume(): void
    {
        $attempt = $this->createAttempt();
        $this->actingAs($this->applicantUser, 'sanctum');
        foreach (['pending', 'under_review', 'rejected'] as $status) {
            DB::table('scholarship_applications')->update(['status' => $status]);
            $this->getJson('/api/applicant/online-exam/attempt')->assertForbidden();
        }
        DB::table('scholarship_applications')->update(['status' => 'approved']);
        DB::table('scholarships')->update(['is_active' => false]);
        $this->getJson('/api/applicant/online-exam/attempt')->assertForbidden();
        $this->assertSame('in_progress', $attempt->fresh()->status);
    }

    public function test_another_current_eligible_approval_preserves_existing_global_exam_eligibility(): void
    {
        $this->createAttempt();
        DB::table('scholarship_applications')->update(['status' => 'pending']);
        $id = DB::table('scholarships')->insertGetId(['category' => 'other', 'is_active' => true, 'requires_online_exam' => true]);
        DB::table('scholarship_applications')->insert(['applicant_id' => $this->applicant->id, 'scholarship_id' => $id, 'status' => 'approved']);
        $this->actingAs($this->applicantUser, 'sanctum')->getJson('/api/applicant/online-exam/attempt')->assertOk();
    }

    public function test_approval_revocation_does_not_hide_already_released_results(): void
    {
        $attempt = $this->createAttempt('completed');
        $attempt->update(['score' => 75, 'passed' => true, 'results_released_at' => now(), 'completed_at' => now()]);
        DB::table('scholarship_applications')->update(['status' => 'pending']);
        $this->actingAs($this->applicantUser, 'sanctum')->getJson("/api/applicant/online-exam/attempts/{$attempt->id}/result")->assertOk()->assertJsonPath('data.released', true);
    }
}
