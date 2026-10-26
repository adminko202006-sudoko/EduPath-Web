<?php
namespace Tests\Feature;

use App\Models\AdmissionApplication;
use App\Models\Announcement;
use App\Models\Applicant;
use App\Models\ScholarshipApplication;
use App\Models\Notification;
use App\Models\User;
use App\Models\WorkflowEvent;
use App\Services\AnnouncementNotificationService;
use App\Services\ApplicantNotificationService;
use App\Services\NotificationDispatchService;
use App\Services\WorkflowDecisionService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class WorkflowAccountabilityTest extends TestCase
{
    use \Tests\Support\InstallsWorkflowSchema;
    private User $admin;
    private User $applicant;

    protected function setUp(): void
    {
        parent::setUp();
        config(['database.default'=>'sqlite','database.connections.sqlite.database'=>':memory:','database.connections.sqlite.foreign_key_constraints'=>false,'cache.default'=>'array']);
        DB::purge('sqlite');DB::setDefaultConnection('sqlite');
        Schema::create('users',function(Blueprint $t){$t->id();$t->string('name');$t->string('email');$t->string('password');$t->string('role');$t->string('fcm_token')->nullable();$t->timestamps();});
        Schema::create('applicants',function(Blueprint $t){$t->id();$t->unsignedBigInteger('user_id');$t->string('first_name');$t->string('last_name');$t->timestamps();});
        Schema::create('academic_programs',function(Blueprint $t){$t->id();$t->string('name');$t->timestamps();});
        Schema::create('admission_periods',function(Blueprint $t){$t->id();$t->string('name');$t->timestamps();});
        Schema::create('admission_applications',function(Blueprint $t){$t->id();$t->unsignedBigInteger('applicant_id');$t->unsignedBigInteger('academic_program_id');$t->unsignedBigInteger('admission_period_id');$t->string('status');$t->text('remarks')->nullable();$t->timestamp('submitted_at')->nullable();$t->timestamps();});
        Schema::create('admission_application_histories',function(Blueprint $t){$t->id();$t->unsignedBigInteger('admission_application_id');$t->unsignedBigInteger('user_id');$t->string('action');$t->string('old_status')->nullable();$t->string('new_status')->nullable();$t->text('remarks')->nullable();$t->timestamps();});
        Schema::create('scholarships',function(Blueprint $t){$t->id();$t->string('name');$t->timestamps();});
        Schema::create('scholarship_applications',function(Blueprint $t){$t->id();$t->unsignedBigInteger('applicant_id');$t->unsignedBigInteger('scholarship_id');$t->string('status');$t->text('remarks')->nullable();$t->timestamp('submitted_at')->nullable();$t->timestamps();});
        Schema::create('application_documents',function(Blueprint $t){$t->id();$t->unsignedBigInteger('admission_application_id');$t->string('document_name');$t->string('status');$t->text('remarks')->nullable();$t->timestamps();});
        Schema::create('application_document_histories',function(Blueprint $t){$t->id();$t->unsignedBigInteger('application_document_id');$t->unsignedBigInteger('user_id');$t->string('action');$t->string('old_status')->nullable();$t->string('new_status')->nullable();$t->text('remarks')->nullable();$t->timestamps();});
        Schema::create('admission_requirements',function(Blueprint $t){$t->id();$t->string('name');$t->boolean('is_required');$t->boolean('is_active');});
        Schema::create('admission_requirement_program',function(Blueprint $t){$t->unsignedBigInteger('admission_requirement_id');$t->unsignedBigInteger('academic_program_id');});
        Schema::create('announcement_dismissals',function(Blueprint $t){$t->id();$t->unsignedBigInteger('user_id');$t->unsignedBigInteger('announcement_id');});
        $this->installWorkflowSchema();
        $this->admin=User::create(['name'=>'Administrator','email'=>'admin@example.test','password'=>'test-password','role'=>'admin']);
        $this->applicant=User::create(['name'=>'=FORMULA','email'=>'applicant@example.test','password'=>'test-password','role'=>'applicant','fcm_token'=>'fake-test-token']);
        $this->applicant->forceFill(['fcm_token'=>'fake-test-token'])->save();
        $person=Applicant::create(['user_id'=>$this->applicant->id,'first_name'=>'Test','last_name'=>'Applicant']);
        DB::table('academic_programs')->insert(['id'=>1,'name'=>'Test Program']);DB::table('admission_periods')->insert(['id'=>1,'name'=>'Test Period']);DB::table('scholarships')->insert(['id'=>1,'name'=>'Test Scholarship']);
        AdmissionApplication::create(['applicant_id'=>$person->id,'academic_program_id'=>1,'admission_period_id'=>1,'status'=>'pending','submitted_at'=>now()->subHours(3)]);
        ScholarshipApplication::create(['applicant_id'=>$person->id,'scholarship_id'=>1,'status'=>'pending','submitted_at'=>now()]);
    }

    public function test_admission_decision_records_history_and_notifies_once(): void
    {
        $this->actingAs($this->admin)->putJson('/api/admin/admission-applications/1/approve')->assertOk();
        $this->putJson('/api/admin/admission-applications/1/approve')->assertOk();
        $this->assertSame(1,WorkflowEvent::count());$this->assertSame(1,Notification::count());
        $this->assertSame(1,DB::table('admission_application_histories')->count());
        $this->assertSame(1,DB::table('notification_deliveries')->count());
        $this->assertSame($this->applicant->id,Notification::first()->user_id);
    }

    public function test_notification_failure_rolls_back_status_and_history(): void
    {
        $this->mock(ApplicantNotificationService::class)->shouldReceive('create')->once()->andThrow(new \RuntimeException('Simulated notification failure'));
        try { app(WorkflowDecisionService::class)->admission(AdmissionApplication::first(),'approved',null,$this->admin);$this->fail('Expected exception'); } catch(\RuntimeException $e) { $this->assertSame('Simulated notification failure',$e->getMessage()); }
        $this->assertSame('pending',AdmissionApplication::first()->status);$this->assertSame(0,WorkflowEvent::count());$this->assertSame(0,DB::table('admission_application_histories')->count());
    }

    public function test_application_approval_is_separate_from_explicit_admin_award(): void
    {
        $this->actingAs($this->admin)->putJson('/api/admin/scholarship-applications/1',['status'=>'approved','remarks'=>'Eligible for examination'])->assertOk()->assertJsonPath('data.award_status','undecided');
        $this->putJson('/api/admin/scholarship-applications/1/award',['award_status'=>'awarded','remarks'=>'Official committee decision','expected_revision'=>0])->assertOk()->assertJsonPath('data.award_status','awarded')->assertJsonPath('data.award_revision',1);
        $this->putJson('/api/admin/scholarship-applications/1/award',['award_status'=>'not_awarded','remarks'=>'Stale tab','expected_revision'=>0])->assertConflict();
        $this->getJson('/api/admin/scholarship-applications/1/history')->assertOk()->assertJsonCount(2,'data');
        $this->actingAs($this->applicant)->putJson('/api/admin/scholarship-applications/1/award',['award_status'=>'awarded','remarks'=>'Unauthorized','expected_revision'=>1])->assertForbidden();
    }

    public function test_official_scholarship_award_sends_congratulations_once_to_the_applicant(): void
    {
        $this->actingAs($this->admin)->putJson('/api/admin/scholarship-applications/1', [
            'status' => 'approved', 'remarks' => 'Eligible for examination',
        ])->assertOk();
        $this->assertSame(0, Notification::where('title', 'Congratulations! Scholarship granted')->count());

        $decision = ['award_status' => 'awarded', 'remarks' => 'Official committee decision', 'expected_revision' => 0];
        $this->putJson('/api/admin/scholarship-applications/1/award', $decision)->assertOk();
        $notice = Notification::where('title', 'Congratulations! Scholarship granted')->sole();
        $this->assertSame($this->applicant->id, $notice->user_id);
        $this->assertSame('scholarship', $notice->type);
        $this->assertFalse($notice->is_read);
        $this->assertStringContainsString('Test Scholarship', $notice->message);
        $this->assertStringContainsString('Official committee decision', $notice->message);
        $this->assertSame(1, DB::table('notification_deliveries')->where('notification_id', $notice->id)->count());

        $this->putJson('/api/admin/scholarship-applications/1/award', $decision)->assertConflict();
        $decision['expected_revision'] = 1;
        $this->putJson('/api/admin/scholarship-applications/1/award', $decision)->assertOk();
        $this->assertSame(1, Notification::where('title', 'Congratulations! Scholarship granted')->count());
        $this->actingAs($this->applicant)->getJson('/api/applicant/notifications')
            ->assertOk()->assertJsonFragment(['title' => 'Congratulations! Scholarship granted', 'type' => 'scholarship']);
    }

    public function test_non_award_and_unauthorized_staff_do_not_send_congratulations(): void
    {
        ScholarshipApplication::first()->update(['status' => 'approved']);
        $staff = User::create(['name' => 'Staff', 'email' => 'staff@example.test', 'password' => 'test-password', 'role' => 'staff']);
        $this->actingAs($staff)->putJson('/api/admin/scholarship-applications/1/award', [
            'award_status' => 'awarded', 'remarks' => 'Unauthorized award', 'expected_revision' => 0,
        ])->assertForbidden();
        $this->assertSame(0, Notification::count());
        $this->actingAs($this->admin)->putJson('/api/admin/scholarship-applications/1/award', [
            'award_status' => 'not_awarded', 'remarks' => 'No available slot', 'expected_revision' => 0,
        ])->assertOk();
        $notice = Notification::sole();
        $this->assertSame('Scholarship award decision', $notice->title);
        $this->assertStringNotContainsString('Congratulations', $notice->message);
        $this->assertSame('not_awarded', ScholarshipApplication::first()->award_status);
    }

    public function test_preferences_are_account_scoped_versioned_and_do_not_suppress_in_app_records(): void
    {
        $preferences=['applicationStatus'=>false,'scholarshipUpdates'=>true,'entranceExamUpdates'=>true,'announcements'=>true];
        $this->actingAs($this->applicant)->getJson('/api/notification-preferences')->assertOk()->assertJsonPath('data.revision',0);
        $this->putJson('/api/notification-preferences',['preferences'=>$preferences,'revision'=>0])->assertOk()->assertJsonPath('data.revision',1);
        $this->putJson('/api/notification-preferences',['preferences'=>$preferences,'revision'=>0])->assertConflict();
        $this->actingAs($this->admin)->getJson('/api/notification-preferences')->assertJsonPath('data.preferences.applicationStatus',true);
        app(WorkflowDecisionService::class)->admission(AdmissionApplication::first(),'approved',null,$this->admin);
        $this->assertSame(1,Notification::count());
        $this->assertSame(1,app(NotificationDispatchService::class)->dispatch()['skipped']);
    }

    public function test_future_announcements_dispatch_when_due_and_delivery_retry_is_idempotent(): void
    {
        $announcement=Announcement::create(['title'=>'Scheduled','content'=>'Test announcement','status'=>'published','published_at'=>now()->addHour()]);
        app(AnnouncementNotificationService::class)->syncPublishedAnnouncement($announcement);$this->assertSame(0,Notification::count());
        $this->assertTrue((bool)$announcement->fresh()->dispatch_pending);
        $this->travel(61)->minutes();
        $fcm=$this->mock(\App\Services\FcmService::class);$fcm->shouldReceive('sendNotification')->once()->andReturn(false);
        $this->assertSame(1,app(NotificationDispatchService::class)->dispatch()['failed']);
        $this->assertSame(1,Notification::count());
        $this->assertSame(['sent'=>0,'failed'=>0,'skipped'=>0],app(NotificationDispatchService::class)->dispatch());
        $this->travel(6)->minutes();
        $fcm->shouldReceive('sendNotification')->once()->andReturn(true);
        $this->assertSame(1,app(NotificationDispatchService::class)->dispatch()['sent']);
        $this->assertSame(1,Notification::count());
        $this->assertSame(['sent'=>0,'failed'=>0,'skipped'=>0],app(NotificationDispatchService::class)->dispatch());
    }

    public function test_philippine_publication_offset_is_stored_as_utc_and_visible_when_due(): void
    {
        $this->travelTo(\Illuminate\Support\Carbon::parse('2026-10-20T09:00:00Z'));
        $response = $this->actingAs($this->admin)->postJson('/api/admin/announcements', [
            'title' => 'Test publication time', 'content' => 'Fictional announcement', 'status' => 'published',
            'published_at' => '2026-10-20T16:47:00+08:00',
        ])->assertCreated()->assertJsonPath('message', 'Announcement published successfully.');
        $this->assertDatabaseHas('announcements', ['id' => $response->json('data.id'), 'published_at' => '2026-10-20 08:47:00']);
        $this->assertDatabaseCount('notifications', 1);
        $this->assertDatabaseCount('notification_deliveries', 1);
        $this->actingAs($this->applicant)->getJson('/api/applicant/announcements')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_future_philippine_publication_is_scheduled_and_not_visible_early(): void
    {
        $this->travelTo(\Illuminate\Support\Carbon::parse('2026-10-20T09:00:00Z'));
        $response = $this->actingAs($this->admin)->postJson('/api/admin/announcements', [
            'title' => 'Scheduled test', 'content' => 'Fictional announcement', 'status' => 'published',
            'published_at' => '2026-10-20T18:00:00+08:00',
        ])->assertCreated()->assertJsonPath('message', 'Announcement scheduled successfully.');
        $this->assertDatabaseHas('announcements', ['id' => $response->json('data.id'), 'published_at' => '2026-10-20 10:00:00', 'dispatch_pending' => true]);
        $this->assertDatabaseCount('notifications', 0);
        $this->actingAs($this->applicant)->getJson('/api/applicant/announcements')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_invalid_publication_dates_do_not_silently_publish_now(): void
    {
        $this->actingAs($this->admin);
        foreach (['not-a-date', '2040-01-01T00:00:00Z', '2019-01-01T00:00:00Z'] as $date) {
            $this->postJson('/api/admin/announcements', [
                'title' => 'Invalid date test', 'content' => 'Fictional announcement', 'status' => 'published', 'published_at' => $date,
            ])->assertUnprocessable()->assertJsonValidationErrors('published_at');
        }
        $this->assertDatabaseCount('announcements', 0);
        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_reports_are_admin_only_paginated_filterable_and_exports_escape_formulas(): void
    {
        $this->actingAs($this->applicant)->getJson('/api/admin/reports')->assertForbidden();
        $this->actingAs($this->admin)->getJson('/api/admin/reports')->assertOk()->assertJsonPath('data.admissions.total',1)->assertJsonPath('data.scholarships.awarded',0);
        $this->getJson('/api/admin/reports?status=rejected')->assertOk()->assertJsonPath('data.admissions.total',0);
        $response=$this->get('/api/admin/reports/export?dataset=admissions')->assertOk();
        $this->assertStringContainsString("'=FORMULA",$response->streamedContent());
        $this->getJson('/api/admin/activity')->assertOk();
        $this->getJson('/api/admin/notification-deliveries')->assertOk();
    }

    public function test_registered_push_token_is_really_persisted_and_cannot_target_another_account(): void
    {
        $this->admin->forceFill(['fcm_token'=>'updated-test-token'])->save();
        $this->actingAs($this->applicant)->postJson('/api/applicant/fcm-token',['fcm_token'=>'updated-test-token','user_id'=>$this->admin->id])->assertOk();
        $this->assertSame('updated-test-token',$this->applicant->fresh()->fcm_token);
        $this->assertNull($this->admin->fresh()->fcm_token);
    }

    public function test_awarded_application_cannot_be_demoted_without_explicit_award_correction(): void
    {
        $application=ScholarshipApplication::first();
        $application->forceFill(['status'=>'approved','award_status'=>'awarded'])->save();
        $this->actingAs($this->admin)->putJson('/api/admin/scholarship-applications/1',['status'=>'rejected'])->assertConflict();
        $this->assertSame('approved',$application->fresh()->status);
    }

    public function test_document_review_records_actor_history_and_notifies_once(): void
    {
        $document=\App\Models\ApplicationDocument::create(['admission_application_id'=>1,'document_name'=>'Report card','status'=>'pending']);
        $service=app(WorkflowDecisionService::class);
        $service->documentReview($document,['status'=>'rejected','remarks'=>'Please replace the unreadable scan.'],$this->admin);
        $service->documentReview($document,['status'=>'rejected','remarks'=>'Please replace the unreadable scan.'],$this->admin);
        $this->assertSame(1,DB::table('application_document_histories')->count());
        $this->assertSame(1,WorkflowEvent::where('subject_type','document')->count());
        $this->assertSame(1,Notification::count());
    }

    public function test_existing_future_announcements_are_queued_without_replaying_old_publications(): void
    {
        $past=Announcement::create(['title'=>'Old','content'=>'Old','status'=>'published','published_at'=>now()->subDay()]);
        $future=Announcement::create(['title'=>'Future','content'=>'Future','status'=>'published','published_at'=>now()->addDay()]);
        (require database_path('migrations/2026_10_18_000006_queue_existing_future_announcements.php'))->up();
        $this->assertFalse((bool)$past->fresh()->dispatch_pending);
        $this->assertTrue((bool)$future->fresh()->dispatch_pending);
        $this->assertSame(0,Notification::count());
    }

    public function test_staff_permission_changes_and_deletion_keep_an_admin_attributed_audit_record(): void
    {
        Schema::create('staff',function(Blueprint $t){$t->id();$t->unsignedBigInteger('user_id');$t->string('first_name');$t->string('last_name');$t->string('status');$t->timestamps();});
        Schema::create('staff_permissions',function(Blueprint $t){$t->id();$t->unsignedBigInteger('staff_id');foreach(['manage_admissions','verify_documents','manage_exams','manage_scholarships','manage_announcements','send_notifications','view_reports'] as $flag)$t->boolean($flag)->default(false);$t->timestamps();});
        Schema::create('staff_programs',function(Blueprint $t){$t->unsignedBigInteger('staff_id');$t->unsignedBigInteger('academic_program_id');});
        $user=User::create(['name'=>'Test Staff','email'=>'staff@example.test','password'=>'test-password','role'=>'staff']);
        $staff=\App\Models\Staff::create(['user_id'=>$user->id,'first_name'=>'Test','last_name'=>'Staff','status'=>'active']);
        $this->actingAs($this->admin)->putJson('/api/admin/staff/'.$staff->id,['manage_admissions'=>true,'program_ids'=>[1]])->assertOk();
        $this->assertTrue($staff->fresh()->permissions->manage_admissions);
        $this->assertSame(1,$staff->academicPrograms()->count());
        $this->deleteJson('/api/admin/staff/'.$staff->id)->assertOk();
        $this->assertSame(2,WorkflowEvent::where('subject_type','staff')->where('actor_id',$this->admin->id)->count());
        $this->getJson('/api/admin/activity?subject_type=staff&actor_id='.$this->admin->id)->assertOk()->assertJsonCount(2,'data.data');
    }
}
