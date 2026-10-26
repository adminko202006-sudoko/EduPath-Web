<?php
namespace App\Services;

use App\Models\Announcement;
use App\Models\Notification;
use Illuminate\Support\Facades\DB;

class NotificationDispatchService
{
    public function dispatch(int $limit=100): array
    {
        // Catch applicants approved before the question bank became available.
        app(OnlineExamAvailabilityService::class)->notifyEligibleApplicants();
        Announcement::where('dispatch_pending',true)->where('status','published')->where('published_at','<=',now())
            ->chunkById(100,function ($announcements) { foreach($announcements as $announcement) app(AnnouncementNotificationService::class)->syncPublishedAnnouncement($announcement); });
        $counts=['sent'=>0,'failed'=>0,'skipped'=>0];
        $ids=DB::table('notification_deliveries')->whereIn('status',['pending','failed'])->where('attempts','<',8)
            ->where('available_at','<=',now())->where(fn($q)=>$q->whereNull('locked_until')->orWhere('locked_until','<=',now()))->orderBy('id')->limit($limit)->pluck('id');
        foreach($ids as $id) {
            $claimed=DB::table('notification_deliveries')->where('id',$id)->whereIn('status',['pending','failed'])->where('attempts','<',8)->where('available_at','<=',now())->where(fn($q)=>$q->whereNull('locked_until')->orWhere('locked_until','<=',now()))
                ->update(['locked_until'=>now()->addMinutes(5),'attempts'=>DB::raw('attempts + 1'),'updated_at'=>now()]);
            if(!$claimed)continue;
            try {
                $notification=Notification::with('user','announcement')->find(DB::table('notification_deliveries')->where('id',$id)->value('notification_id'));
                $allowed=$notification && $notification->user && app(ApplicantNotificationService::class)->pushEnabled($notification->user_id,$notification->type);
                if($notification?->announcement_id) {
                    $allowed=$allowed && $notification->announcement?->status==='published' && !$notification->announcement?->published_at?->isFuture()
                        && !DB::table('announcement_dismissals')->where('user_id',$notification->user_id)->where('announcement_id',$notification->announcement_id)->exists();
                }
                if(!$allowed || !$notification->user->fcm_token) { $status='skipped'; }
                else {
                    $ok=app(FcmService::class)->sendNotification($notification->user->fcm_token,$notification->title,$notification->message,['notification_id'=>(string)$notification->id,'type'=>$notification->type ?? 'update']);
                    $status=$ok ? 'sent' : 'failed';
                }
            } catch (\Throwable $e) { report($e); $status='failed'; }
            DB::table('notification_deliveries')->where('id',$id)->update(['status'=>$status,'locked_until'=>null,'available_at'=>now()->addMinutes(5),'last_error'=>$status==='failed' ? 'Push delivery failed; check server delivery configuration.' : null,'updated_at'=>now()]);
            $counts[$status]++;
        }
        return $counts;
    }
}
