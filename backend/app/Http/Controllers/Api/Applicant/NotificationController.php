<?php

namespace App\Http\Controllers\Api\Applicant;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = Notification::where('user_id', $request->user()->id)
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
    public function announcements()
    {
        $announcements = Announcement::query()
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

        $request->user()->update([
            'fcm_token' => $validated['fcm_token'],
        ]);

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

        $notification->update(['is_read' => true, 'read_at' => now()]);

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

        $notification->delete();

        return response()->json(['success' => true, 'message' => 'Notification deleted successfully.']);
    }
}
