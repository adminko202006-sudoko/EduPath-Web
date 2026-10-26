<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ScholarshipApplication;
use App\Models\WorkflowEvent;
use App\Services\ApplicantNotificationService;
use App\Services\WorkflowDecisionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScholarshipAwardController extends Controller
{
    public function history(ScholarshipApplication $application)
    {
        return response()->json(['success'=>true,'data'=>WorkflowEvent::with('actor:id,name,role')->where('subject_type','scholarship')->where('subject_id',$application->id)->orderBy('id')->get()]);
    }

    public function update(Request $request, ScholarshipApplication $application)
    {
        $values=$request->validate(['award_status'=>'required|in:awarded,not_awarded','remarks'=>'required|string|max:2000','expected_revision'=>'required|integer|min:0']);
        return DB::transaction(function () use ($request,$application,$values) {
            $locked=ScholarshipApplication::whereKey($application->id)->lockForUpdate()->firstOrFail();
            abort_unless($locked->award_revision===(int)$values['expected_revision'],409,'Award decision changed. Refresh before recording another decision.');
            abort_unless($locked->status==='approved',422,'Approve the application review before recording a separate award decision.');
            if ($values['award_status'] === 'awarded') app(\App\Services\FheEntranceEligibilityService::class)->ensureEligible($locked);
            $old=$locked->award_status;
            if ($old===$values['award_status']) return response()->json(['success'=>true,'data'=>$locked]);
            // Deliberately manual: exam completion/passing never automatically grants an award.
            $locked->forceFill(['award_status'=>$values['award_status'],'award_remarks'=>$values['remarks'],'award_decided_by'=>$request->user()->id,'award_decided_at'=>now(),'award_revision'=>$locked->award_revision+1])->save();
            app(WorkflowDecisionService::class)->event('scholarship',$locked->id,'award_decision',$old,$locked->award_status,$values['remarks'],$request->user());
            $awarded = $locked->award_status === 'awarded';
            $title = $awarded ? 'Congratulations! Scholarship granted' : 'Scholarship award decision';
            $message = $awarded
                ? 'Congratulations! You have been granted the '.$locked->scholarship->name.' scholarship. Remarks: '.$values['remarks']
                : 'Scholarship application #'.$locked->id.': '.str_replace('_',' ',$locked->award_status).'. Remarks: '.$values['remarks'];
            app(ApplicantNotificationService::class)->create($locked->applicant->user_id, $title, $message, 'scholarship');
            return response()->json(['success'=>true,'data'=>$locked->load('scholarship','applicant.user')]);
        });
    }
}
