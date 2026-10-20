<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Staff;
use App\Models\StaffPermission;
use App\Models\User;
use App\Rules\UniqueAccountEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class StaffController extends Controller
{
    /**
     * Allowed staff roles.
     *
     * Keep these synchronized with the
     * Admin Staff Management role dropdown.
     */
    private const STAFF_ROLES = [
        'Admission Staff',
        'Scholarship Staff',
        'Registrar Staff',
        'Student Affairs Staff',
        'Exam Staff',
    ];

    /**
     * Display a listing of staff.
     */
    public function index()
    {
        $staff = Staff::with([
            'user',
            'academicPrograms',
            'permissions',
        ])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Staff retrieved successfully.',
            'data' => $staff,
        ]);
    }

    /**
     * Store a newly created staff member.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'bail',
                'required',
                'email',
                'max:255',
                new UniqueAccountEmail(),
            ],

            'password' => [
                'required',
                'string',
                'min:8',
            ],

            'employee_id' => [
                'required',
                'string',
                'max:255',
                'unique:staff,employee_id',
            ],

            'staff_role' => [
                'required',
                Rule::in(self::STAFF_ROLES),
            ],

            'first_name' => [
                'required',
                'string',
                'max:255',
            ],

            'middle_name' => [
                'nullable',
                'string',
                'max:255',
            ],

            'last_name' => [
                'required',
                'string',
                'max:255',
            ],

            'position' => [
                'nullable',
                'string',
                'max:255',
            ],

            'status' => [
                'nullable',
                Rule::in([
                    'active',
                    'inactive',
                ]),
            ],

            /*
             * Programs Served
             *
             * A staff member can be assigned
             * to one or multiple academic programs.
             */
            'program_ids' => [
                'nullable',
                'array',
            ],

            'program_ids.*' => [
                'integer',
                'exists:academic_programs,id',
            ],
        ]);

        $result = DB::transaction(function () use ($validated) {

            /*
             * Create staff login account.
             */
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make(
                    $validated['password']
                ),
                'role' => 'staff',
            ]);

            /*
             * Create staff profile.
             */
            $staff = Staff::create([
                'user_id' => $user->id,

                'employee_id' =>
                    $validated['employee_id'],

                'staff_role' =>
                    $validated['staff_role'],

                'first_name' =>
                    $validated['first_name'],

                'middle_name' =>
                    $validated['middle_name'] ?? null,

                'last_name' =>
                    $validated['last_name'],

                'position' =>
                    $validated['position'] ?? null,

                'status' =>
                    $validated['status'] ?? 'active',
            ]);

            /*
             * Assign Programs Served.
             */
            if (
                array_key_exists(
                    'program_ids',
                    $validated
                )
            ) {
                $staff->academicPrograms()->sync(
                    $validated['program_ids'] ?? []
                );
            }

            /*
             * Create default permissions.
             */
            StaffPermission::create([
                'staff_id' => $staff->id,
            ]);

            app(\App\Services\WorkflowDecisionService::class)->event('staff',$staff->id,'staff_created',null,$staff->status,null,request()->user());
            return $staff;
        });

        $result->load([
            'user',
            'academicPrograms',
            'permissions',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Staff created successfully.',
            'data' => $result,
        ], 201);
    }

    /**
     * Display the specified staff member.
     */
    public function show(Staff $staff)
    {
        $staff->load([
            'user',
            'academicPrograms',
            'permissions',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Staff retrieved successfully.',
            'data' => $staff,
        ]);
    }

    /**
     * Update the specified staff member.
     */
    public function update(
        Request $request,
        Staff $staff
    ) {
        $validated = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'bail',
                'sometimes',
                'required',
                'email',
                'max:255',
                new UniqueAccountEmail($staff->user_id),
            ],

            'password' => [
                'nullable',
                'string',
                'min:8',
            ],

            'employee_id' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique(
                    'staff',
                    'employee_id'
                )->ignore($staff->id),
            ],

            'staff_role' => [
                'sometimes',
                'required',
                Rule::in(self::STAFF_ROLES),
            ],

            'first_name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'middle_name' => [
                'nullable',
                'string',
                'max:255',
            ],

            'last_name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'position' => [
                'nullable',
                'string',
                'max:255',
            ],

            'status' => [
                'sometimes',
                'required',
                Rule::in([
                    'active',
                    'inactive',
                ]),
            ],

            /*
             * Programs Served
             */
            'program_ids' => [
                'nullable',
                'array',
            ],

            'program_ids.*' => [
                'integer',
                'exists:academic_programs,id',
            ],

            /*
             * Staff permissions
             */
            'manage_admissions' => [
                'sometimes',
                'boolean',
            ],

            'verify_documents' => [
                'sometimes',
                'boolean',
            ],

            'manage_exams' => [
                'sometimes',
                'boolean',
            ],

            'review_online_exams' => ['sometimes', 'boolean'],

            'manage_scholarships' => [
                'sometimes',
                'boolean',
            ],

            'manage_announcements' => [
                'sometimes',
                'boolean',
            ],

            'send_notifications' => [
                'sometimes',
                'boolean',
            ],

            'view_reports' => [
                'sometimes',
                'boolean',
            ],
        ]);

        DB::transaction(function () use (
            $validated,
            $staff
        ) {

            /*
             * Update user account.
             */
            $userData = [];

            if (
                array_key_exists(
                    'name',
                    $validated
                )
            ) {
                $userData['name'] =
                    $validated['name'];
            }

            if (
                array_key_exists(
                    'email',
                    $validated
                )
            ) {
                $userData['email'] =
                    $validated['email'];
            }

            if (
                !empty(
                    $validated['password']
                )
            ) {
                $userData['password'] =
                    Hash::make(
                        $validated['password']
                    );
            }

            /*
             * Staff accounts must always remain
             * staff accounts.
             */
            $userData['role'] = 'staff';

            if (!empty($userData)) {
                $staff->user->update(
                    $userData
                );
            }

            /*
             * Update staff profile.
             *
             * Department has intentionally been
             * removed from the system.
             */
            $staffData = collect($validated)
                ->only([
                    'employee_id',
                    'staff_role',
                    'first_name',
                    'middle_name',
                    'last_name',
                    'position',
                    'status',
                ])
                ->toArray();

            if (!empty($staffData)) {
                $staff->update(
                    $staffData
                );
            }

            /*
             * Update Programs Served.
             *
             * Supplying an empty array removes
             * all current program assignments.
             */
            if (
                array_key_exists(
                    'program_ids',
                    $validated
                )
            ) {
                $staff->academicPrograms()->sync(
                    $validated['program_ids'] ?? []
                );
            }

            /*
             * Update permissions.
             */
            $permissionFields = [
                'manage_admissions',
                'verify_documents',
                'manage_exams',
                'review_online_exams',
                'manage_scholarships',
                'manage_announcements',
                'send_notifications',
                'view_reports',
            ];

            $permissionData = collect($validated)
                ->only($permissionFields)
                ->toArray();

            if (!empty($permissionData)) {
                $staff->permissions()->updateOrCreate(
                    [
                        'staff_id' => $staff->id,
                    ],
                    $permissionData
                );
            }
            app(\App\Services\WorkflowDecisionService::class)->event('staff',$staff->id,'account_permissions_or_assignments_updated',null,$staff->status,'Account, permission, or program assignment updated.',request()->user());
        });

        /*
         * Return the complete updated staff record.
         */
        $staff->load([
            'user',
            'academicPrograms',
            'permissions',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Staff updated successfully.',
            'data' => $staff,
        ]);
    }

    /**
     * Remove the specified staff member.
     */
    public function destroy(Staff $staff)
    {
        DB::transaction(function () use ($staff) {

            $user = $staff->user;
            app(\App\Services\WorkflowDecisionService::class)->event('staff',$staff->id,'staff_deleted',$staff->status,null,'Account removed by an administrator.',request()->user());

            /*
             * Delete staff profile first.
             *
             * staff_programs and permissions should
             * have cascadeOnDelete relationships.
             */
            $staff->delete();

            /*
             * Delete associated login account.
             */
            if ($user) {
                $user->delete();
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Staff deleted successfully.',
        ]);
    }
}
