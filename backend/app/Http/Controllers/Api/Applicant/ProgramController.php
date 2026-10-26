<?php

namespace App\Http\Controllers\Api\Applicant;

use App\Http\Controllers\Controller;
use App\Models\AcademicProgram;

class ProgramController extends Controller
{
    /**
     * Display active academic programs.
     */
    public function index(\Illuminate\Http\Request $request)
    {
        $identity = \App\Models\StudentVerification::where('applicant_id', $request->user()->applicant?->id)->first();
        if ($identity?->student_type === 'old') {
            return response()->json(['success' => true, 'data' => $identity->status === 'verified' && $identity->academic_program_id
                ? AcademicProgram::whereKey($identity->academic_program_id)->get() : []]);
        }
        $programs = AcademicProgram::where('is_active', true)
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Active academic programs retrieved successfully.',
            'data' => $programs,
        ]);
    }
}
