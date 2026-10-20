<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdmissionApplication;
use App\Models\ApplicationDocument;
use App\Models\ScholarshipApplication;
use App\Models\WorkflowEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $filters=$this->filters($request);
        $admissions=$this->admissions($filters);
        $scholarships=$this->scholarships($filters);
        return response()->json(['success'=>true,'data'=>[
            'admissions'=>['total'=>(clone $admissions)->count(),'pending'=>(clone $admissions)->whereIn('status',['pending','under_review'])->count(),'approved'=>(clone $admissions)->where('status','approved')->count()],
            'scholarships'=>['total'=>(clone $scholarships)->count(),'pending'=>(clone $scholarships)->whereIn('status',['pending','under_review'])->count(),'awarded'=>(clone $scholarships)->where('award_status','awarded')->count()],
            'admission_records'=>$admissions->with('applicant.user:id,name,email','academicProgram:id,name')->latest()->paginate(20,['*'],'admission_page'),
            'scholarship_records'=>$scholarships->with('applicant.user:id,name,email','scholarship:id,name')->latest()->paginate(20,['*'],'scholarship_page'),
            'pending_documents'=>ApplicationDocument::whereIn('status',['pending','under_review'])->whereHas('admissionApplication', fn($q)=>$q->whereIn('id',$this->admissions($filters)->select('id')))->count(),
            'missing_required_documents'=>$this->missingDocuments($filters),
            'workload'=>WorkflowEvent::with('actor:id,name,role')->select('actor_id',DB::raw('COUNT(*) as actions'))->when($filters['from'] ?? null,fn($q,$v)=>$q->whereDate('created_at','>=',$v))->when($filters['to'] ?? null,fn($q,$v)=>$q->whereDate('created_at','<=',$v))->groupBy('actor_id')->get(),
            'average_decision_hours'=>$this->decisionHours($filters),
        ]]);
    }

    public function activity(Request $request)
    {
        $v=$request->validate(['actor_id'=>'nullable|integer|min:1','subject_type'=>'nullable|in:admission,scholarship,document,online_exam,staff,scheduled_exam','from'=>'nullable|date','to'=>'nullable|date|after_or_equal:from','page'=>'nullable|integer|min:1']);
        return response()->json(['success'=>true,'data'=>WorkflowEvent::with('actor:id,name,role')
            ->when($v['actor_id'] ?? null,fn($q,$x)=>$q->where('actor_id',$x))->when($v['subject_type'] ?? null,fn($q,$x)=>$q->where('subject_type',$x))
            ->when($v['from'] ?? null,fn($q,$x)=>$q->whereDate('created_at','>=',$x))->when($v['to'] ?? null,fn($q,$x)=>$q->whereDate('created_at','<=',$x))->latest('id')->paginate(25)]);
    }

    public function deliveries(Request $request)
    {
        $v=$request->validate(['status'=>'nullable|in:pending,sent,failed,skipped','page'=>'nullable|integer|min:1']);
        return response()->json(['success'=>true,'data'=>DB::table('notification_deliveries')->select('id','notification_id','status','attempts','available_at','last_error','updated_at')->when($v['status'] ?? null,fn($q,$x)=>$q->where('status',$x))->orderByDesc('id')->paginate(25)]);
    }

    public function retry(int $delivery)
    {
        $changed=DB::table('notification_deliveries')->where('id',$delivery)->where('status','failed')->where(fn($q)=>$q->whereNull('locked_until')->orWhere('locked_until','<=',now()))->update(['status'=>'pending','attempts'=>0,'available_at'=>now(),'last_error'=>null,'updated_at'=>now()]);
        abort_unless($changed,409,'Only an unlocked failed delivery can be retried.');
        return response()->json(['success'=>true,'message'=>'Delivery queued for retry.']);
    }

    public function export(Request $request)
    {
        $filters=$this->filters($request);
        $type=$request->validate(['dataset'=>'required|in:admissions,scholarships'])['dataset'];
        $query=$type==='admissions' ? $this->admissions($filters)->with('applicant.user','academicProgram') : $this->scholarships($filters)->with('applicant.user','scholarship');
        abort_if((clone $query)->count()>10000,422,'Narrow the filters to export 10,000 or fewer records.');
        return response()->streamDownload(function () use ($query,$type) {
            $stream=fopen('php://output','w');
            fputcsv($stream,['Record ID','Applicant','Email','Program or scholarship','Application status','Award status','Submitted at'],',','"','');
            $query->orderBy('id')->chunkById(200,function($rows)use($stream,$type){foreach($rows as $row){
                $cells=[$row->id,$row->applicant?->user?->name,$row->applicant?->user?->email,$type==='admissions'?$row->academicProgram?->name:$row->scholarship?->name,$row->status,$type==='scholarships'?$row->award_status:'',$row->submitted_at?->toIso8601String()];
                fputcsv($stream,array_map([self::class,'safeCell'],$cells),',','"','');
            }});fclose($stream);
        },'edupath-'.$type.'-'.now()->format('Y-m-d').'.csv',['Content-Type'=>'text/csv; charset=UTF-8','Cache-Control'=>'no-store']);
    }

    public static function safeCell($value): string
    {
        $text=(string)$value;
        return preg_match('/^[\s\x00-\x1f]*[=+@-]/u',$text) ? "'".$text : $text;
    }

    private function filters(Request $r): array
    {
        return $r->validate(['academic_program_id'=>'nullable|integer|exists:academic_programs,id','admission_period_id'=>'nullable|integer|exists:admission_periods,id','scholarship_id'=>'nullable|integer|exists:scholarships,id','status'=>'nullable|in:pending,under_review,approved,rejected,withdrawn','from'=>'nullable|date','to'=>'nullable|date|after_or_equal:from','admission_page'=>'nullable|integer|min:1','scholarship_page'=>'nullable|integer|min:1']);
    }
    private function admissions(array $f)
    {
        return AdmissionApplication::query()->when($f['academic_program_id'] ?? null,fn($q,$v)=>$q->where('academic_program_id',$v))->when($f['admission_period_id'] ?? null,fn($q,$v)=>$q->where('admission_period_id',$v))->when($f['status'] ?? null,fn($q,$v)=>$q->where('status',$v))->when($f['from'] ?? null,fn($q,$v)=>$q->whereDate('created_at','>=',$v))->when($f['to'] ?? null,fn($q,$v)=>$q->whereDate('created_at','<=',$v));
    }
    private function scholarships(array $f)
    {
        return ScholarshipApplication::query()->when($f['scholarship_id'] ?? null,fn($q,$v)=>$q->where('scholarship_id',$v))->when($f['status'] ?? null,fn($q,$v)=>$q->where('status',$v))->when(($f['academic_program_id'] ?? null)||($f['admission_period_id'] ?? null),fn($q)=>$q->whereHas('applicant.admissionApplications',fn($a)=>$a->when($f['academic_program_id'] ?? null,fn($x,$v)=>$x->where('academic_program_id',$v))->when($f['admission_period_id'] ?? null,fn($x,$v)=>$x->where('admission_period_id',$v))))->when($f['from'] ?? null,fn($q,$v)=>$q->whereDate('created_at','>=',$v))->when($f['to'] ?? null,fn($q,$v)=>$q->whereDate('created_at','<=',$v));
    }
    private function decisionHours(array $f): ?float
    {
        $total=0; $count=0;
        WorkflowEvent::where('subject_type','admission')->where('action','decision')->whereIn('new_status',['approved','rejected'])->whereIn('subject_id',$this->admissions($f)->select('id'))->orderBy('id')->chunkById(200,function($events)use(&$total,&$count){
            $applications=AdmissionApplication::whereIn('id',$events->pluck('subject_id'))->get()->keyBy('id');
            foreach($events as $event){$start=$applications[$event->subject_id]->submitted_at ?? null;if($start){$total+=max(0,$start->diffInSeconds($event->created_at,false))/3600;$count++;}}
        });
        return $count ? round($total/$count,2) : null;
    }
    private function missingDocuments(array $f): array
    {
        // Live requirement configuration is used; no new admission eligibility rule is imposed.
        return $this->admissions($f)->whereNotIn('status',['withdrawn','rejected'])->whereExists(function($q){
            $q->selectRaw('1')->from('admission_requirements as r')->join('admission_requirement_program as rp','rp.admission_requirement_id','=','r.id')
                ->whereColumn('rp.academic_program_id','admission_applications.academic_program_id')->where('r.is_required',true)->where('r.is_active',true)
                ->whereNotExists(fn($d)=>$d->selectRaw('1')->from('application_documents as doc')->whereColumn('doc.admission_application_id','admission_applications.id')->whereColumn('doc.document_name','r.name')->where('doc.status','verified'));
        })->select('id','applicant_id','academic_program_id','status')->with('applicant.user:id,name','academicProgram:id,name')->orderBy('id')->limit(50)->get()->toArray();
    }
}
