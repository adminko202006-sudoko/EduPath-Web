<?php

namespace App\Http\Controllers\Api\Applicant;

use App\Http\Controllers\Controller;
use App\Models\AcademicProgram;

class ProgramController extends Controller
{
    /**
     * Display active academic programs.
     */
    public function index()
    {
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