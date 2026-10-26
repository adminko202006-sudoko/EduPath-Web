<?php
namespace App\Services;

use App\Models\AdmissionApplication;
use App\Models\AdmissionApplicationHistory;
use App\Models\ScholarshipApplication;
use App\Models\User;
use App\Models\WorkflowEvent;
use App\Models\ApplicationDocument;
use App\Models\ApplicationDocumentHistory;
use Illuminate\Support\Facades\DB;

class WorkflowDecisionService
{
    public function admission(AdmissionApplication $application, string $status, ?string $remarks, User $actor): void
    {
        DB::transaction(function () use ($application,$status,$remarks,$actor) {
            \App\Models\Applicant::whereKey($application->applicant_id)->lockForUpdate()->firstOrFail();
            $locked=AdmissionApplication::whereKey($application->id)->lockForUpdate()->firstOrFail();
            abort_if($locked->status==='withdrawn',409,'A withdrawn application cannot receive a decision.');
            if ($locked->status===$status && ($status==='approved' || $locked->remarks===$remarks)) { $application->setRawAttributes($locked->getAttributes(),true); return; }
            if (in_array($status, AdmissionSubmissionService::ACTIVE_STATUSES, true)) {
                app(AdmissionSubmissionService::class)->ensureNoActiveApplication($locked->applicant_id, $locked->admission_period_id, $locked->id);
            }
            $old=$locked->status;
            $locked->update($status==='approved' ? ['status'=>$status] : ['status'=>$status,'remarks'=>$remarks]);
            AdmissionApplicationHistory::create(['admission_application_id'=>$locked->id,'user_id'=>$actor->id,'action'=>'status_updated','old_status'=>$old,'new_status'=>$status,'remarks'=>$remarks]);
            $this->event('admission',$locked->id,'decision',$old,$status,$remarks,$actor);
            app(ApplicantNotificationService::class)->create($locked->applicant->user_id,'Admission application '.$status,'Your admission application #'.$locked->id.' was '.$status.'.'.($remarks ? ' Remarks: '.$remarks : ''),'admission');
            $application->setRawAttributes($locked->getAttributes(),true);
            if ($status === 'approved') app(OnlineExamAvailabilityService::class)->notifyIfEligible($locked->applicant_id);
        });
    }

    public function scholarship(ScholarshipApplication $application, array $values, User $actor): void
    {
        DB::transaction(function () use ($application,$values,$actor) {
            \App\Models\Applicant::whereKey($application->applicant_id)->lockForUpdate()->firstOrFail();
            $locked=ScholarshipApplication::whereKey($application->id)->lockForUpdate()->firstOrFail();
            if ($values['status'] === 'approved') app(FheEntranceEligibilityService::class)->ensureEligible($locked);
            abort_if($locked->award_status==='awarded' && $values['status']!=='approved',409,'A final award is recorded. Record an explicit corrected award decision with a reason before changing application approval.');
            $remarks=$values['remarks'] ?? $locked->remarks;
            if ($locked->status===$values['status'] && $locked->remarks===$remarks) { $application->setRawAttributes($locked->getAttributes(),true); return; }
            $old=$locked->status;
            $locked->update($values);
            $this->event('scholarship',$locked->id,'application_review',$old,$locked->status,$remarks,$actor);
            $description=$locked->status==='approved' ? 'approved for eligibility review/examination where applicable. This is not a scholarship award' : str_replace('_',' ',$locked->status);
            app(ApplicantNotificationService::class)->create($locked->applicant->user_id,'Scholarship application updated','Your scholarship application #'.$locked->id.' is '.$description.'.'.($remarks ? ' Remarks: '.$remarks : ''),'scholarship');
            $application->setRawAttributes($locked->getAttributes(),true);
            if ($locked->status === 'approved') app(OnlineExamAvailabilityService::class)->notifyIfEligible($locked->applicant_id);
        });
    }

    public function event(string $type, int $id, string $action, ?string $old, ?string $new, ?string $remarks, User $actor): WorkflowEvent
    {
        return WorkflowEvent::create(['subject_type'=>$type,'subject_id'=>$id,'action'=>$action,'old_status'=>$old,'new_status'=>$new,'remarks'=>$remarks,'actor_id'=>$actor->id]);
    }

    public function documentReview(ApplicationDocument $document, array $values, User $actor): void
    {
        DB::transaction(function () use ($document,$values,$actor) {
            $locked=ApplicationDocument::whereKey($document->id)->lockForUpdate()->firstOrFail();
            $remarks=$values['remarks'] ?? null;
            if ($locked->status===$values['status'] && $locked->remarks===$remarks) { $document->setRawAttributes($locked->getAttributes(),true); return; }
            $old=$locked->status;
            $locked->update(['status'=>$values['status'],'remarks'=>$remarks]);
            ApplicationDocumentHistory::create(['application_document_id'=>$locked->id,'user_id'=>$actor->id,'action'=>'status_updated','old_status'=>$old,'new_status'=>$locked->status,'remarks'=>$remarks]);
            $this->event('document',$locked->id,'document_review',$old,$locked->status,$remarks,$actor);
            $userId=$locked->admissionApplication?->applicant?->user_id;
            if($userId)app(ApplicantNotificationService::class)->create($userId,'Document '.str_replace('_',' ',$locked->status),'Your '.$locked->document_name.' is '.str_replace('_',' ',$locked->status).'.'.($remarks ? ' Remarks: '.$remarks : ''),'admission');
            $document->setRawAttributes($locked->getAttributes(),true);
        });
    }
}
