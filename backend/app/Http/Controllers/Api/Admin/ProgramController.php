<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicProgram;
use Illuminate\Http\Request;

class ProgramController extends Controller
{
    /**
     * Display a listing of academic programs.
     */
    public function index()
    {
        $programs = AcademicProgram::latest()->get();

        return response()->json([
            'success' => true,
            'message' => 'Academic programs retrieved successfully.',
            'data' => $programs,
        ]);
    }

    /**
     * Store a newly created academic program.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:academic_programs,code',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $program = AcademicProgram::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Academic program created successfully.',
            'data' => $program,
        ], 201);
    }

    /**
     * Display the specified academic program.
     */
    public function show(AcademicProgram $program)
    {
        return response()->json([
            'success' => true,
            'message' => 'Academic program retrieved successfully.',
            'data' => $program,
        ]);
    }

    /**
     * Update the specified academic program.
     */
    public function update(Request $request, AcademicProgram $program)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => 'sometimes|required|string|max:50|unique:academic_programs,code,' . $program->id,
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $program->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Academic program updated successfully.',
            'data' => $program,
        ]);
    }

    /**
     * Remove the specified academic program.
     */
    public function destroy(AcademicProgram $program)
    {
        if ($program->admissionApplications()->exists() || \App\Models\StudentVerification::where('academic_program_id', $program->id)->exists()) {
            return response()->json(['message' => 'This program is linked to student records. Deactivate it instead.'], 409);
        }
        $program->delete();

        return response()->json([
            'success' => true,
            'message' => 'Academic program deleted successfully.',
        ]);
    }
}
