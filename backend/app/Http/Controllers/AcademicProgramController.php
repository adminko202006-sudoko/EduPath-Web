<?php

namespace App\Http\Controllers;

use App\Models\AcademicProgram;
use Illuminate\Http\Request;

class AcademicProgramController extends Controller
{
    public function index()
    {
        $programs = AcademicProgram::orderBy('name')->get();

        return response()->json([
            'success' => true,
            'programs' => $programs,
        ]);
    }

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
            'program' => $program,
        ], 201);
    }

    public function update(Request $request, AcademicProgram $academicProgram)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:academic_programs,code,' . $academicProgram->id,
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $academicProgram->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Academic program updated successfully.',
            'program' => $academicProgram,
        ]);
    }



    public function destroy(AcademicProgram $academicProgram)
    {
        $academicProgram->delete();

        return response()->json([
            'success' => true,
            'message' => 'Academic program deleted successfully.',
        ]);
    }


}
