<?php

namespace App\Http\Controllers\Api\Applicant;

use App\Http\Controllers\Controller;
use App\Models\AcademicProgram;
use Illuminate\Http\Request;

class RequirementController extends Controller
{
    /**
     * Get all active academic programs.
     */
    public function index(Request $request)
    {
        $programs = AcademicProgram::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'code',
                'description',
                'is_active',
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Academic programs retrieved successfully.',
            'data' => $programs,
        ]);
    }

    /**
     * Get active admission requirements assigned to a specific program.
     */
    public function byProgram(
        Request $request,
        AcademicProgram $program
    ) {
        $requirements = $program->admissionRequirements()
            ->where('admission_requirements.is_active', true)
            ->orderByDesc('admission_requirements.is_required')
            ->orderBy('admission_requirements.name')
            ->get([
                'admission_requirements.id',
                'admission_requirements.name',
                'admission_requirements.description',
                'admission_requirements.file_path',
                'admission_requirements.is_required',
                'admission_requirements.is_active',
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Program admission requirements retrieved successfully.',
            'data' => $requirements->map(function ($requirement) {
                return [
                    'id' => $requirement->id,
                    'name' => $requirement->name,
                    'description' => $requirement->description,
                    'file_path' => $requirement->file_path,
                    'is_required' => (bool) $requirement->is_required,
                    'is_active' => (bool) $requirement->is_active,
                ];
            }),
        ]);
    }
}