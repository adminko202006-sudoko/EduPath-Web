<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\Applicant;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Display notifications sent to applicants
     * within the staff member's assigned programs.
     */
    public function index(Request $request)
    {
        $staff = $this->getActiveStaff($request);

        $programIds = $staff->academicPrograms()
            ->pluck('academic_programs.id');

        $notifications = Notification::with([
            'user.applicant',
        ])
            ->whereHas('user.applicant.admissionApplications', function ($query) use ($programIds) {
                $query->whereIn('academic_program_id', $programIds);
            })
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Notifications retrieved successfully.',
            'data' => $notifications,
        ]);
    }

    /**
     * Send a notification to an applicant.
     */
    public function store(Request $request)
    {
        $staff = $this->getActiveStaff($request);

        $programIds = $staff->academicPrograms()
            ->pluck('academic_programs.id');

        $validated = $request->validate([
            'applicant_id' => 'required|exists:applicants,id',
            'title' => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        $applicant = Applicant::with('user')
            ->findOrFail($validated['applicant_id']);

        $belongsToAssignedProgram = $applicant
            ->admissionApplications()
            ->whereIn('academic_program_id', $programIds)
            ->exists();

        if (!$belongsToAssignedProgram) {
            return response()->json([
                'success' => false,
                'message' =>
                    'You are not authorized to notify this applicant.',
            ], 403);
        }

        $notification = Notification::create([
            'user_id' => $applicant->user_id,
            'title' => $validated['title'],
            'message' => $validated['message'],
            'is_read' => false,
            'read_at' => null,
        ]);

        $notification->load('user.applicant');

        return response()->json([
            'success' => true,
            'message' => 'Notification sent successfully.',
            'data' => $notification,
        ], 201);
    }

    /**
     * Delete a notification sent to an applicant
     * within the staff member's assigned programs.
     */
    public function destroy(
        Request $request,
        Notification $notification
    ) {
        $staff = $this->getActiveStaff($request);

        $programIds = $staff->academicPrograms()
            ->pluck('academic_programs.id');

        $belongsToAssignedProgram = $notification
            ->user
            ?->applicant
            ?->admissionApplications()
            ?->whereIn('academic_program_id', $programIds)
            ?->exists() ?? false;

        if (!$belongsToAssignedProgram) {
            return response()->json([
                'success' => false,
                'message' =>
                    'You are not authorized to delete this notification.',
            ], 403);
        }

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification deleted successfully.',
        ]);
    }

    /**
     * Get the active staff member.
     */
    private function getActiveStaff(Request $request)
    {
        $staff = $request->user()->staff;

        if (!$staff) {
            abort(response()->json([
                'success' => false,
                'message' => 'Staff profile not found.',
            ], 403));
        }

        if ($staff->status !== 'active') {
            abort(response()->json([
                'success' => false,
                'message' => 'Your staff account is inactive.',
            ], 403));
        }

        return $staff;
    }
}
