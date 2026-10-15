<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdmissionRequirement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class RequirementController extends Controller
{
    /**
     * Display all admission requirements.
     */
    public function index()
    {
        $requirements = AdmissionRequirement::with([
            'academicPrograms:id,name,code',
        ])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Admission requirements retrieved successfully.',
            'data' => $requirements,
        ]);
    }

    /**
     * Store a new admission requirement.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file' => 'nullable|file|mimes:pdf|max:5120',
            'is_required' => 'boolean',
            'is_active' => 'boolean',
            'program_ids' => 'nullable|array',
            'program_ids.*' => 'integer|exists:academic_programs,id',
        ]);

        $filePath = null;

        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store(
                'admission-forms',
                'public'
            );
        }

        $requirement = AdmissionRequirement::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'file_path' => $filePath,
            'is_required' => $validated['is_required'] ?? true,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        /*
         * Assign the requirement to programs if program IDs
         * were included in the request.
         */
        if (array_key_exists('program_ids', $validated)) {
            $requirement->academicPrograms()->sync(
                $validated['program_ids'] ?? []
            );
        }

        $requirement->load([
            'academicPrograms:id,name,code',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Admission requirement created successfully.',
            'data' => $requirement,
        ], 201);
    }

    /**
     * Display a specific admission requirement.
     */
    public function show(AdmissionRequirement $requirement)
    {
        $requirement->load([
            'academicPrograms:id,name,code',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Admission requirement retrieved successfully.',
            'data' => $requirement,
        ]);
    }

    /**
     * Update an admission requirement.
     */
    public function update(
        Request $request,
        AdmissionRequirement $requirement
    ) {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'file' => 'nullable|file|mimes:pdf|max:5120',
            'is_required' => 'boolean',
            'is_active' => 'boolean',
            'program_ids' => 'nullable|array',
            'program_ids.*' => 'integer|exists:academic_programs,id',
        ]);

        $updateData = [
            'name' => $validated['name'] ?? $requirement->name,
            'description' => $validated['description'] ?? null,
            'is_required' => $validated['is_required'] ?? $requirement->is_required,
            'is_active' => $validated['is_active'] ?? $requirement->is_active,
        ];

        /*
         * If a new file was uploaded, delete the old file
         * and store the new admission form.
         */
        if ($request->hasFile('file')) {
            if ($requirement->file_path) {
                Storage::disk('public')->delete($requirement->file_path);
            }

            $updateData['file_path'] = $request->file('file')->store(
                'admission-forms',
                'public'
            );
        }

        $requirement->update($updateData);

        /*
         * Only synchronize programs when program_ids was actually
         * supplied. This prevents an ordinary requirement edit
         * from accidentally removing existing assignments.
         */
        if (array_key_exists('program_ids', $validated)) {
            $requirement->academicPrograms()->sync(
                $validated['program_ids'] ?? []
            );
        }

        $requirement->load([
            'academicPrograms:id,name,code',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Admission requirement updated successfully.',
            'data' => $requirement->fresh([
                'academicPrograms:id,name,code',
            ]),
        ]);
    }

    /**
     * Update only the programs assigned to a requirement.
     */
    public function updatePrograms(
        Request $request,
        AdmissionRequirement $requirement
    ) {
        $validated = $request->validate([
            'program_ids' => 'required|array',
            'program_ids.*' => 'integer|exists:academic_programs,id',
        ]);

        $requirement->academicPrograms()->sync(
            $validated['program_ids']
        );

        $requirement->load([
            'academicPrograms:id,name,code',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Requirement program assignments updated successfully.',
            'data' => $requirement,
        ]);
    }

    /**
     * Delete an admission requirement.
     */
    public function destroy(AdmissionRequirement $requirement)
    {
        if ($requirement->file_path) {
            Storage::disk('public')->delete($requirement->file_path);
        }

        $requirement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Admission requirement deleted successfully.',
        ]);
    }
}