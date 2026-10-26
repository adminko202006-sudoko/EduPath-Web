<?php
namespace App\Services;

use App\Models\Notification;
use Illuminate\Support\Facades\DB;

class ApplicantNotificationService
{
    public function create(int $userId, string $title, string $message, string $type): Notification
    {
        $notification = Notification::create(['user_id'=>$userId,'title'=>$title,'message'=>$message,'type'=>$type,'is_read'=>false]);
        $this->queuePush($notification);
        return $notification;
    }

    public function queuePush(Notification $notification): void
    {
        DB::table('notification_deliveries')->insertOrIgnore([
            'notification_id'=>$notification->id,'status'=>'pending','attempts'=>0,'available_at'=>now(),'created_at'=>now(),'updated_at'=>now(),
        ]);
    }

    public function pushEnabled(int $userId, ?string $type): bool
    {
        $row=DB::table('notification_preferences')->where('user_id',$userId)->first();
        $preferences=$row ? json_decode($row->preferences,true) : [];
        $key=match($type) { 'admission'=>'applicationStatus', 'scholarship'=>'scholarshipUpdates', 'exam'=>'entranceExamUpdates', 'announcement'=>'announcements', default=>null };
        return !$key || ($preferences[$key] ?? true);
    }
}
