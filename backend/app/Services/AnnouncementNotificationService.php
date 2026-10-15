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
            return;
        }

        $fcmTokens = [];

        DB::transaction(function () use ($announcement, &$fcmTokens) {
            $applicants = User::query()
                ->where('role', 'applicant')
                ->get(['id', 'fcm_token']);

            foreach ($applicants as $user) {
                Notification::updateOrCreate(
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

                if (!empty($user->fcm_token)) {
                    $fcmTokens[] = $user->fcm_token;
                }
            }
        });

        if (!empty($fcmTokens)) {
            $this->fcmService->sendNotification(
                tokens: array_unique($fcmTokens),
                title: '📢 ' . $announcement->title,
                body: $announcement->content,
                data: [
                    'type' => 'announcement',
                    'announcement_id' => (string) $announcement->id,
                ]
            );
        }
    }
}
