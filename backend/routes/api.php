<?php

use Illuminate\Support\Facades\Route;

// Academic Program Controller
use App\Http\Controllers\AcademicProgramController;

// Authentication
use App\Http\Controllers\Api\Auth\AuthController;

// Admin Controllers
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\ProgramController;
use App\Http\Controllers\Api\Admin\RequirementController;
use App\Http\Controllers\Api\Admin\ApplicantController as AdminApplicantController;
use App\Http\Controllers\Api\Admin\ScholarshipController as AdminScholarshipController;
use App\Http\Controllers\Api\Admin\ExamController as AdminExamController;
use App\Http\Controllers\Api\Admin\AnnouncementController as AdminAnnouncementController;
use App\Http\Controllers\Api\Admin\DocumentController as AdminDocumentController;
use App\Http\Controllers\Api\Admin\AdmissionApplicationController;
use App\Http\Controllers\Api\Admin\AdmissionPeriodController;
use App\Http\Controllers\Api\Admin\StaffController as AdminStaffController;

// Applicant Controllers
use App\Http\Controllers\Api\Applicant\ProfileController;
use App\Http\Controllers\Api\Applicant\AdmissionController;
use App\Http\Controllers\Api\Applicant\DocumentController;
use App\Http\Controllers\Api\Applicant\ProgramController as ApplicantProgramController;
use App\Http\Controllers\Api\Applicant\ScholarshipController as ApplicantScholarshipController;
use App\Http\Controllers\Api\Applicant\ExamController as ApplicantExamController;
use App\Http\Controllers\Api\Applicant\NotificationController;
use App\Http\Controllers\Api\Applicant\AdmissionPeriodController as ApplicantAdmissionPeriodController;
use App\Http\Controllers\Api\Applicant\RequirementController as ApplicantRequirementController;

// Staff Controllers
use App\Http\Controllers\Api\Staff\AdmissionApplicationController as StaffAdmissionApplicationController;
use App\Http\Controllers\Api\Staff\DashboardController as StaffDashboardController;
use App\Http\Controllers\Api\Staff\DocumentController as StaffDocumentController;
use App\Http\Controllers\Api\Staff\ProfileController as StaffProfileController;
use App\Http\Controllers\Api\Staff\ExamController as StaffExamController;
use App\Http\Controllers\Api\Staff\ScholarshipController as StaffScholarshipController;
use App\Http\Controllers\Api\Staff\AnnouncementController as StaffAnnouncementController;
use App\Http\Controllers\Api\Staff\NotificationController as StaffNotificationController;


/*
|--------------------------------------------------------------------------
| Academic Program Controller Routes
|--------------------------------------------------------------------------
*/

Route::get('/programs', [AcademicProgramController::class, 'index']);
Route::post('/programs', [AcademicProgramController::class, 'store']);
Route::put('/programs/{academicProgram}', [AcademicProgramController::class, 'update']);
Route::delete('/programs/{academicProgram}', [AcademicProgramController::class, 'destroy']);



/*
|--------------------------------------------------------------------------
| Public Authentication Routes
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->group(function () {

    // Register
    Route::post('/register', [
        AuthController::class,
        'register'
    ]);

    // Login
    Route::post('/login', [
        AuthController::class,
        'login'
    ]);

    // Request password reset OTP
    Route::post('/forgot-password', [
        AuthController::class,
        'forgotPassword'
    ]);

    // Verify password reset OTP
    Route::post('/verify-reset-otp', [
        AuthController::class,
        'verifyOtp'
    ]);

    // Reset password using verified OTP
    Route::post('/reset-password-with-otp', [
        AuthController::class,
        'resetPasswordWithOtp'
    ]);

    // Temporary old reset-link route
    Route::post('/reset-password', [
        AuthController::class,
        'resetPassword'
    ]);

});


/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    */

    Route::put('/auth/change-password', [
        AuthController::class,
        'changePassword'
    ]);

    Route::post('/auth/logout', [
        AuthController::class,
        'logout'
    ]);

    Route::get('/auth/user', [
        AuthController::class,
        'user'
    ]);


    /*
    |--------------------------------------------------------------------------
    | Staff Routes
    |--------------------------------------------------------------------------
    */

    Route::prefix('staff')
        ->middleware('role:staff')
        ->group(function () {

            /*
            |--------------------------------------------------------------------------
            | Profile
            |--------------------------------------------------------------------------
            */

            Route::get('/profile', [
                StaffProfileController::class,
                'show'
            ]);

            Route::put('/profile', [
                StaffProfileController::class,
                'update'
            ]);


            /*
            |--------------------------------------------------------------------------
            | Dashboard
            |--------------------------------------------------------------------------
            */

            Route::get('/dashboard', [
                StaffDashboardController::class,
                'index'
            ]);


            /*
            |--------------------------------------------------------------------------
            | Admission Applications
            |--------------------------------------------------------------------------
            */

            Route::middleware('permission:manage_admissions')->group(function () {

                Route::get('/admission-applications', [
                    StaffAdmissionApplicationController::class,
                    'index'
                ]);

                Route::get('/admission-applications/{application}', [
                    StaffAdmissionApplicationController::class,
                    'show'
                ]);

                Route::put('/admission-applications/{application}/approve', [
                    StaffAdmissionApplicationController::class,
                    'approve'
                ]);

                Route::put('/admission-applications/{application}/reject', [
                    StaffAdmissionApplicationController::class,
                    'reject'
                ]);

            });


            /*
            |--------------------------------------------------------------------------
            | Documents
            |--------------------------------------------------------------------------
            */

            Route::middleware('permission:verify_documents')->group(function () {

                Route::get('/documents', [
                    StaffDocumentController::class,
                    'index'
                ]);

                Route::get('/documents/{document}', [
                    StaffDocumentController::class,
                    'show'
                ]);

                Route::put('/documents/{document}', [
                    StaffDocumentController::class,
                    'update'
                ]);

            });


            /*
            |--------------------------------------------------------------------------
            | Exams
            |--------------------------------------------------------------------------
            */

            Route::middleware('permission:manage_exams')->group(function () {

                Route::get('/exams', [
                    StaffExamController::class,
                    'index'
                ]);

                Route::get('/exams/{exam}', [
                    StaffExamController::class,
                    'show'
                ]);

                Route::put('/exams/{exam}', [
                    StaffExamController::class,
                    'update'
                ]);

                Route::delete('/exams/{exam}', [
                    StaffExamController::class,
                    'destroy'
                ]);

            });


            /*
            |--------------------------------------------------------------------------
            | Scholarships
            |--------------------------------------------------------------------------
            */

            Route::middleware('permission:manage_scholarships')->group(function () {

                Route::get('/scholarship-applications', [
                    StaffScholarshipController::class,
                    'index'
                ]);

                Route::get('/scholarship-applications/{application}', [
                    StaffScholarshipController::class,
                    'show'
                ]);

                Route::put('/scholarship-applications/{application}', [
                    StaffScholarshipController::class,
                    'update'
                ]);

            });


            /*
            |--------------------------------------------------------------------------
            | Announcements
            |--------------------------------------------------------------------------
            */

            Route::middleware('permission:manage_announcements')->group(function () {

                Route::get('/announcements', [
                    StaffAnnouncementController::class,
                    'index'
                ]);

                Route::get('/announcements/{announcement}', [
                    StaffAnnouncementController::class,
                    'show'
                ]);

                Route::post('/announcements', [
                    StaffAnnouncementController::class,
                    'store'
                ]);

                Route::put('/announcements/{announcement}', [
                    StaffAnnouncementController::class,
                    'update'
                ]);

                Route::delete('/announcements/{announcement}', [
                    StaffAnnouncementController::class,
                    'destroy'
                ]);

            });


            /*
            |--------------------------------------------------------------------------
            | Notifications
            |--------------------------------------------------------------------------
            */

            Route::middleware('permission:send_notifications')->group(function () {

                Route::get('/notifications', [
                    StaffNotificationController::class,
                    'index'
                ]);

                Route::post('/notifications', [
                    StaffNotificationController::class,
                    'store'
                ]);

                Route::delete('/notifications/{notification}', [
                    StaffNotificationController::class,
                    'destroy'
                ]);

            });


            /*
            |--------------------------------------------------------------------------
            | Reports
            |--------------------------------------------------------------------------
            */

            Route::middleware('permission:view_reports')->group(function () {

                Route::get('/reports', [
                    \App\Http\Controllers\Api\Staff\ReportController::class,
                    'index'
                ]);

            });

        });


    /*
    |--------------------------------------------------------------------------
    | Admin Routes
    |--------------------------------------------------------------------------
    */

    Route::prefix('admin')
        ->middleware('role:admin')
        ->group(function () {




            /*
            |--------------------------------------------------------------------------
            | Dashboard
            |--------------------------------------------------------------------------
            */

            Route::get('/dashboard', [
                DashboardController::class,
                'index'
            ]);


            /*
            |--------------------------------------------------------------------------
            | Staff Management
            |--------------------------------------------------------------------------
            */

            Route::apiResource(
                'staff',
                AdminStaffController::class
            );


            /*
            |--------------------------------------------------------------------------
            | Academic Programs
            |--------------------------------------------------------------------------
            */

            Route::apiResource(
                'programs',
                ProgramController::class
            );


            /*
            |--------------------------------------------------------------------------
            | Admission Requirements
            |--------------------------------------------------------------------------
            */

            Route::apiResource(
                'requirements',
                RequirementController::class
            );

            Route::put(
                'requirements/{requirement}/programs',
                [RequirementController::class, 'updatePrograms']
            );

            /*
            |--------------------------------------------------------------------------
            | Admission Periods
            |--------------------------------------------------------------------------
            */

            Route::apiResource(
                'admission-periods',
                AdmissionPeriodController::class
            );

            Route::put(
                'admission-periods/{admissionPeriod}/open',
                [
                    AdmissionPeriodController::class,
                    'open'
                ]
            );

            Route::put(
                'admission-periods/{admissionPeriod}/close',
                [
                    AdmissionPeriodController::class,
                    'close'
                ]
            );


            /*
            |--------------------------------------------------------------------------
            | Applicants
            |--------------------------------------------------------------------------
            */


            // Archived applicants
            Route::get(
                'applicants/archived',
                [
                    AdminApplicantController::class,
                    'archived'
                ]
            );

            // Applicant resource routes
            Route::apiResource(
                'applicants',
                AdminApplicantController::class
            )->except([
                'store'
            ]);

            // Restore archived applicant
            Route::put(
                'applicants/{applicant}/restore',
                [
                    AdminApplicantController::class,
                    'restore'
                ]
            );


            /*
            |--------------------------------------------------------------------------
            | Scholarship Applications
            |--------------------------------------------------------------------------
            */

            Route::get('/scholarship-applications', [
                AdminScholarshipController::class,
                'applications'
            ]);

            Route::put('/scholarship-applications/{application}', [
                AdminScholarshipController::class,
                'updateApplication'
            ]);


            /*
            |--------------------------------------------------------------------------
            | Scholarships
            |--------------------------------------------------------------------------
            */

            Route::apiResource(
                'scholarships',
                AdminScholarshipController::class
            );


            /*
            |--------------------------------------------------------------------------
            | Admission Applications
            |--------------------------------------------------------------------------
            */

            Route::get('/admission-applications', [
                AdmissionApplicationController::class,
                'index'
            ]);

            Route::get('/admission-applications/{application}', [
                AdmissionApplicationController::class,
                'show'
            ]);

            Route::put('/admission-applications/{application}/approve', [
                AdmissionApplicationController::class,
                'approve'
            ]);

            Route::put('/admission-applications/{application}/reject', [
                AdmissionApplicationController::class,
                'reject'
            ]);


            /*
            |--------------------------------------------------------------------------
            | Entrance Exams
            |--------------------------------------------------------------------------
            */

            Route::apiResource(
                'exams',
                AdminExamController::class
            );


            /*
            |--------------------------------------------------------------------------
            | Announcements
            |--------------------------------------------------------------------------
            */

            Route::apiResource(
                'announcements',
                AdminAnnouncementController::class
            );


            /*
            |--------------------------------------------------------------------------
            | Applicant Documents
            |--------------------------------------------------------------------------
            */

            Route::apiResource(
                'documents',
                AdminDocumentController::class
            )->only([
                'index',
                'show',
                'update',
                'destroy'
            ]);

        });


    /*
    |--------------------------------------------------------------------------
    | Applicant Routes
    |--------------------------------------------------------------------------
    */

    Route::prefix('applicant')
        ->middleware('role:applicant')
        ->group(function () {

            Route::post('/documents/{document}/replace', [
                DocumentController::class,
                'replace'
            ]);

            Route::get(
                '/programs/{program}/requirements',
                [ApplicantRequirementController::class, 'byProgram']
            );

            /*
            |--------------------------------------------------------------------------
            | Profile
            |--------------------------------------------------------------------------
            */



            Route::get('/profile', [
                ProfileController::class,
                'show'
            ]);

            Route::put('/profile', [
                ProfileController::class,
                'update'
            ]);


            /*
            |--------------------------------------------------------------------------
            | Academic Programs
            |--------------------------------------------------------------------------
            */

            Route::get('/programs', [
                ApplicantRequirementController::class,
                'index'
            ]);
            Route::get(
                '/programs/{program}/requirements',
                [ApplicantRequirementController::class, 'byProgram']
            );

            /*
            |--------------------------------------------------------------------------
            | Admission Applications
            |--------------------------------------------------------------------------
            */

            Route::get('/admission-period', [
                ApplicantAdmissionPeriodController::class,
                'current'
            ]);

            Route::get('/admissions', [
                AdmissionController::class,
                'index'
            ]);

            Route::post('/admissions', [
                AdmissionController::class,
                'store'
            ]);

            Route::get('/admissions/{application}', [
                AdmissionController::class,
                'show'
            ]);


            /*
            |--------------------------------------------------------------------------
            | Documents
            |--------------------------------------------------------------------------
            */

            Route::get('/documents', [
                DocumentController::class,
                'index'
            ]);

            Route::post('/documents', [
                DocumentController::class,
                'store'
            ]);

            Route::get('/documents/{document}', [
                DocumentController::class,
                'show'
            ]);

            Route::delete('/documents/{document}', [
                DocumentController::class,
                'destroy'
            ]);


            /*
            |--------------------------------------------------------------------------
            | Scholarships
            |--------------------------------------------------------------------------
            */

            Route::get('/scholarships', [
                ApplicantScholarshipController::class,
                'index'
            ]);

            Route::get('/scholarships/{scholarship}', [
                ApplicantScholarshipController::class,
                'show'
            ]);

            Route::post('/scholarships/{scholarship}/apply', [
                ApplicantScholarshipController::class,
                'apply'
            ]);

            Route::get('/scholarship-applications', [
                ApplicantScholarshipController::class,
                'myApplications'
            ]);

            Route::get('/scholarship-applications/{application}', [
                ApplicantScholarshipController::class,
                'application'
            ]);


            /*
            |--------------------------------------------------------------------------
            | Entrance Exams
            |--------------------------------------------------------------------------
            */

            Route::get('/exams', [
                ApplicantExamController::class,
                'index'
            ]);

            Route::get('/exams/{assignment}', [
                ApplicantExamController::class,
                'show'
            ]);


            /*
            |--------------------------------------------------------------------------
            | Notifications
            |--------------------------------------------------------------------------
            */

            Route::get('/announcements', [
                NotificationController::class,
                'announcements'
            ]);

            Route::get('/notifications', [
                NotificationController::class,
                'index'
            ]);

            Route::post('/fcm-token', [
                NotificationController::class,
                'updateFcmToken'
            ]);

            Route::put('/notifications/{notification}/read', [
                NotificationController::class,
                'markAsRead'
            ]);

            Route::put('/notifications/read-all', [
                NotificationController::class,
                'markAllAsRead'
            ]);

            Route::delete('/notifications/{notification}', [
                NotificationController::class,
                'destroy'
            ]);

        });

});
