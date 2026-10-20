<?php

namespace App\Http\Controllers\Api\Applicant;

use App\Http\Controllers\Controller;
use App\Models\AdmissionPeriod;

class AdmissionPeriodController extends Controller
{
    /**
     * Get the currently active admission period.
     */
    public function current()
    {
        $today = now()->toDateString();

        $admissionPeriod = AdmissionPeriod::where('status', 'open')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->first();

        if (!$admissionPeriod) {
            return response()->json([
                'success' => false,
                'message' => 'There is currently no open admission period.',
                'data' => null,
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Current admission period retrieved successfully.',
            'data' => $admissionPeriod,
        ]);
    }
}
