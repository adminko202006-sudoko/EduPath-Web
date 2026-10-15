<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Services\AnnouncementNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AnnouncementController extends Controller
{
    public function index()
    {
        return response()->json([
            'success' => true,
            'message' => 'Announcements retrieved successfully.',
            'data' => Announcement::latest()->get(),
        ]);
    }

    public function show(Announcement $announcement)
    {
        return response()->json([
            'success' => true,
            'message' => 'Announcement retrieved successfully.',
            'data' => $announcement,
        ]);
    }

    public function store(Request $request, AnnouncementNotificationService $notificationService)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'status' => 'required|in:draft,published',
            'published_at' => 'nullable',
        ]);

        $validated['published_at'] = $this->formatPublishedAt(
            $validated['published_at'] ?? null,
            $validated['status']
        );

        $announcement = DB::transaction(function () use ($validated, $notificationService) {
            $announcement = Announcement::create($validated);
            $notificationService->syncPublishedAnnouncement($announcement);
            return $announcement->refresh();
        });

        return response()->json([
            'success' => true,
            'message' => $announcement->status === 'published'
                ? 'Announcement published successfully.'
                : 'Announcement saved as draft.',
            'data' => $announcement,
        ], 201);
    }

    public function update(Request $request, Announcement $announcement, AnnouncementNotificationService $notificationService)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'content' => 'sometimes|required|string',
            'status' => 'sometimes|required|in:draft,published',
            'published_at' => 'nullable',
        ]);

        $status = $validated['status'] ?? $announcement->status;
        $rawPublishedAt = array_key_exists('published_at', $validated)
            ? $validated['published_at']
            : $announcement->published_at;

        $validated['published_at'] = $this->formatPublishedAt($rawPublishedAt, $status);

        DB::transaction(function () use ($announcement, $validated, $notificationService) {
            $announcement->update($validated);
            $notificationService->syncPublishedAnnouncement($announcement->refresh());
        });

        return response()->json([
            'success' => true,
            'message' => 'Announcement updated successfully.',
            'data' => $announcement->refresh(),
        ]);
    }

    public function destroy(Announcement $announcement)
    {
        $announcement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Announcement deleted successfully.',
        ]);
    }

    /**
     * Sanitize and format published_at timestamp to prevent MySQL 1292 invalid datetime errors.
     * MySQL TIMESTAMP columns only support years up to 2038 (Year 2038 problem).
     */
    private function formatPublishedAt($publishedAt, string $status)
    {
        if (empty($publishedAt)) {
            return $status === 'published' ? now() : null;
        }

        try {
            $parsed = Carbon::parse($publishedAt);
            if ($parsed->year < 2020 || $parsed->year > 2037) {
                return $status === 'published' ? now() : null;
            }
            return $parsed;
        } catch (\Exception $e) {
            return $status === 'published' ? now() : null;
        }
    }
}
