<?php

namespace App\Services;

use App\Models\Announcement;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AnnouncementNotificationService
{
    protected FcmService $fcmService;

    public function __construct(FcmService $fcmService)
    {
        $this->fcmService = $fcmService;
    }

    /**
     * Create or refresh one in-app notification per applicant for a published announcement.
     * Also sends FCM push notifications to registered applicant devices.
     */
    public function syncPublishedAnnouncement(Announcement $announcement): void
    {
        if ($announcement->status !== 'published') {
            return;
        }

        // A scheduled announcement should not notify applicants before its publication time.
        if ($announcement->published_at && $announcement->published_at->isFuture()) {
            $announcement->forceFill(['dispatch_pending'=>true])->save();
            return;
        }

        DB::transaction(function () use ($announcement) {
            // Serialize syncs for this announcement without a schema change.
            $announcement = Announcement::whereKey($announcement->id)->lockForUpdate()->firstOrFail();
            if ($announcement->status !== 'published' || $announcement->published_at?->isFuture()) return;
            $applicants = User::query()
                ->where('role', 'applicant')
                ->whereNotIn('id', DB::table('announcement_dismissals')->select('user_id')
                    ->where('announcement_id', $announcement->id))
                ->get(['id', 'fcm_token']);

            foreach ($applicants as $user) {
                $notification = Notification::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'announcement_id' => $announcement->id,
                    ],
                    [
                        'title' => $announcement->title,
                        'message' => $announcement->content,
                        'type' => 'announcement',
                    ]
                );

                app(ApplicantNotificationService::class)->queuePush($notification);
            }
            $announcement->forceFill(['dispatch_pending'=>false])->save();
        });
    }
}
