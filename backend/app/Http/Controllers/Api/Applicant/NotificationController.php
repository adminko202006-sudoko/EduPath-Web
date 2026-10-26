<?php

namespace App\Http\Controllers\Api\Applicant;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Notification;
use App\Services\AnnouncementDismissalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->whereNotExists(function ($query) use ($request) {
                $query->selectRaw('1')->from('announcement_dismissals')
                    ->whereColumn('announcement_dismissals.announcement_id', 'notifications.announcement_id')
                    ->where('announcement_dismissals.user_id', $request->user()->id);
            })
            ->with('announcement:id,title,status,published_at')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Notifications retrieved successfully.',
            'data' => $notifications,
            'unread_count' => $notifications->where('is_read', false)->count(),
        ]);
    }

    /** Return only announcements applicants are currently allowed to see. */
    public function announcements(Request $request)
    {
        $announcements = Announcement::query()
            ->whereNotIn('id', DB::table('announcement_dismissals')
                ->select('announcement_id')->where('user_id', $request->user()->id))
            ->where('status', 'published')
            ->where(function ($query) {
                $query->whereNull('published_at')
                    ->orWhere('published_at', '<=', now());
            })
            ->latest('published_at')
            ->latest('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Published announcements retrieved successfully.',
            'data' => $announcements,
        ]);
    }

    public function updateFcmToken(Request $request)
    {
        $validated = $request->validate([
            'fcm_token' => 'required|string',
        ]);

        // A shared phone token belongs to the currently registering account only.
        // Serialize reassignment so account switches cannot leave duplicate owners.
        \Illuminate\Support\Facades\Cache::lock('edupath:fcm:'.hash('sha256',$validated['fcm_token']),10)->block(5,function () use ($request,$validated) {
            DB::transaction(function () use ($request,$validated) {
                \App\Models\User::where('fcm_token',$validated['fcm_token'])->where('id','!=',$request->user()->id)->update(['fcm_token'=>null]);
                $request->user()->forceFill(['fcm_token'=>$validated['fcm_token']])->save();
            },3);
        });

        return response()->json([
            'success' => true,
            'message' => 'FCM token updated successfully.',
        ]);
    }

    public function markAsRead(Request $request, Notification $notification)
    {
        if ((int) $notification->user_id !== (int) $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized access.'], 403);
        }

        Notification::whereKey($notification->id)->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read.',
            'data' => $notification->refresh(),
        ]);
    }

    public function markAllAsRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return response()->json(['success' => true, 'message' => 'All notifications marked as read.']);
    }

    public function destroy(Request $request, Notification $notification)
    {
        if ((int) $notification->user_id !== (int) $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized access.'], 403);
        }

        if ($notification->announcement_id) {
            app(AnnouncementDismissalService::class)->dismiss($request->user()->id, $notification->announcement_id);
        } else {
            $notification->delete();
        }

        return response()->json(['success' => true, 'message' => 'Notification deleted successfully.']);
    }

    public function dismissAnnouncement(Request $request, Announcement $announcement)
    {
        abort_if($announcement->status !== 'published' || $announcement->published_at?->isFuture(), 404);
        app(AnnouncementDismissalService::class)->dismiss($request->user()->id, $announcement->id);

        return response()->json(['success' => true, 'message' => 'Announcement removed from your notifications.']);
    }
}
