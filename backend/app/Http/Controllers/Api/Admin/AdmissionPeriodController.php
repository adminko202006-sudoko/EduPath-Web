<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdmissionPeriod;
use Illuminate\Http\Request;

class AdmissionPeriodController extends Controller
{
    /**
     * Display all admission periods.
     */
    public function index()
    {
        $periods = AdmissionPeriod::orderBy('start_date', 'desc')->get();

        return response()->json($periods);
    }

    /**
     * Store a new admission period.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'nullable|in:open,closed',
        ]);

        $period = AdmissionPeriod::create([
            'name' => $validated['name'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'status' => $validated['status'] ?? 'closed',
        ]);

        return response()->json([
            'message' => 'Admission period created successfully.',
            'period' => $period,
        ], 201);
    }

    /**
     * Display a specific admission period.
     */
    public function show(AdmissionPeriod $admissionPeriod)
    {
        return response()->json($admissionPeriod);
    }

    /**
     * Update an admission period.
     */
    public function update(Request $request, AdmissionPeriod $admissionPeriod)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'status' => 'required|in:open,closed',
        ]);

        $admissionPeriod->update($validated);

        return response()->json([
            'message' => 'Admission period updated successfully.',
            'period' => $admissionPeriod,
        ]);
    }

    /**
     * Delete an admission period.
     */
    public function destroy(AdmissionPeriod $admissionPeriod)
    {
        $admissionPeriod->delete();

        return response()->json([
            'message' => 'Admission period deleted successfully.',
        ]);
    }

    /**
     * Open an admission period.
     */
    public function open(AdmissionPeriod $admissionPeriod)
    {
        $admissionPeriod->update([
            'status' => 'open',
        ]);

        return response()->json([
            'message' => 'Admission period opened successfully.',
            'period' => $admissionPeriod,
        ]);
    }

    /**
     * Close an admission period.
     */
    public function close(AdmissionPeriod $admissionPeriod)
    {
        $admissionPeriod->update([
            'status' => 'closed',
        ]);

        return response()->json([
            'message' => 'Admission period closed successfully.',
            'period' => $admissionPeriod,
        ]);
    }
}