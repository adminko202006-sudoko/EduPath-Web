<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationPreferenceController extends Controller
{
    private const DEFAULTS=['applicationStatus'=>true,'scholarshipUpdates'=>true,'entranceExamUpdates'=>true,'announcements'=>true];

    public function show(Request $request)
    {
        $row=DB::table('notification_preferences')->where('user_id',$request->user()->id)->first();
        return response()->json(['success'=>true,'data'=>['preferences'=>$row ? array_merge(self::DEFAULTS,json_decode($row->preferences,true)) : self::DEFAULTS,'revision'=>$row->revision ?? 0]]);
    }

    public function update(Request $request)
    {
        $values=$request->validate([
            'revision'=>'required|integer|min:0','preferences'=>'required|array:applicationStatus,scholarshipUpdates,entranceExamUpdates,announcements',
            'preferences.applicationStatus'=>'required|boolean','preferences.scholarshipUpdates'=>'required|boolean',
            'preferences.entranceExamUpdates'=>'required|boolean','preferences.announcements'=>'required|boolean',
        ]);
        return DB::transaction(function () use ($request,$values) {
            User::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            $row=DB::table('notification_preferences')->where('user_id',$request->user()->id)->first();
            if ((int)($row->revision ?? 0)!==(int)$values['revision']) return response()->json(['message'=>'Preferences changed in another session. Reload preferences before saving.'],409);
            DB::table('notification_preferences')->updateOrInsert(['user_id'=>$request->user()->id],['preferences'=>json_encode($values['preferences']),'revision'=>$values['revision']+1,'updated_at'=>now(),'created_at'=>$row->created_at ?? now()]);
            return $this->show($request);
        });
    }
}
