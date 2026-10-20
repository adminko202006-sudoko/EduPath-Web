<?php

namespace App\Services;

use App\Models\Announcement;
use Illuminate\Support\Facades\DB;

class AnnouncementDismissalService
{
    public function dismiss(int $userId, int $announcementId): void
    {
        DB::transaction(function () use ($userId, $announcementId) {
            // Use the same lock as publication sync so it cannot recreate a dismissed item.
            Announcement::whereKey($announcementId)->lockForUpdate()->firstOrFail();
            DB::table('announcement_dismissals')->insertOrIgnore([
                'user_id' => $userId,
                'announcement_id' => $announcementId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });
    }
}
