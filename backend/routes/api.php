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
use App\Http\Controllers\Api\Admin\ProfileController as AdminProfileController;
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
use App\Http\Controllers\Api\Applicant\OnlineExamController as ApplicantOnlineExamController;
use App\Http\Controllers\Api\Admin\OnlineExamController as AdminOnlineExamController;

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
Route::prefix('locations')->controller(\App\Http\Controllers\Api\LocationController::class)->group(function () {
    Route::get('/countries', 'countries');
    Route::get('/countries/{country}/provinces', 'provinces');
    Route::get('/countries/{country}/cities', 'cities');
});
// Program creation, updates, and deletion are available only through the
// authenticated /admin/programs resource below.



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
    ])->middleware('throttle:auth-register');

    // Login
    Route::post('/login', [
        AuthController::class,
        'login'
    ])->middleware('throttle:auth-login');

    // Request password reset OTP
    Route::post('/forgot-password', [
        AuthController::class,
        'forgotPassword'
    ])->middleware('throttle:auth-recovery');

    // Verify password reset OTP
    Route::post('/verify-reset-otp', [
        AuthController::class,
        'verifyOtp'
    ])->middleware('throttle:auth-verify');

    // Reset password using verified OTP
    Route::post('/reset-password-with-otp', [
        AuthController::class,
        'resetPasswordWithOtp'
    ])->middleware('throttle:auth-verify');

    // Temporary old reset-link route
    Route::post('/reset-password', [
        AuthController::class,
        'resetPassword'
    ])->middleware('throttle:auth-verify');

});


/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/email-verification/send', [\App\Http\Controllers\Api\Auth\EmailVerificationController::class, 'send'])->middleware(['role:applicant', 'throttle:email-verification-send']);
    Route::post('/auth/email-verification/verify', [\App\Http\Controllers\Api\Auth\EmailVerificationController::class, 'verify'])->middleware(['role:applicant', 'throttle:10,1']);
    Route::prefix('applicant/verification')->middleware('role:applicant')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\Applicant\VerificationController::class, 'show']);
        Route::post('/', [\App\Http\Controllers\Api\Applicant\VerificationController::class, 'submit'])->middleware('throttle:5,1');
        Route::get('/file', [\App\Http\Controllers\Api\Applicant\VerificationController::class, 'file']);
    });
    Route::prefix('admin/student-verifications')->middleware('role:admin')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\Admin\StudentVerificationController::class, 'index']);
        Route::put('/{verification}', [\App\Http\Controllers\Api\Admin\StudentVerificationController::class, 'review']);
        Route::get('/{verification}/file', [\App\Http\Controllers\Api\Admin\StudentVerificationController::class, 'file']);
        Route::get('/{verification}/history', [\App\Http\Controllers\Api\Admin\StudentVerificationController::class, 'history']);
    });
    Route::post('/auth/presence', [\App\Http\Controllers\Api\PresenceController::class, 'heartbeat'])->middleware('throttle:30,1');
    Route::get('/scholarship-applications/{application}/attachment', \App\Http\Controllers\Api\ScholarshipAttachmentController::class);
    Route::get('/scholarship-applications/{application}/requirements/{index}', \App\Http\Controllers\Api\ScholarshipAttachmentController::class)->whereNumber('index');

    Route::get('/notification-preferences', [\App\Http\Controllers\Api\NotificationPreferenceController::class, 'show']);
    Route::put('/notification-preferences', [\App\Http\Controllers\Api\NotificationPreferenceController::class, 'update']);

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

            // Multipart photo uploads use POST; regular edits retain PUT.
            Route::post('/profile', [StaffProfileController::class, 'update']);


            /*
            |--------------------------------------------------------------------------
            | Dashboard
            |--------------------------------------------------------------------------
            */

            Route::get('/application-counts', [\App\Http\Controllers\Api\Staff\DashboardController::class, 'applicationCounts']);
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

                Route::get('/documents/{document}/file', [
                    StaffDocumentController::class,
                    'file'
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

            Route::middleware('permission:review_online_exams')->group(function () {
                Route::get('/online-exams/attempts', [\App\Http\Controllers\Api\Staff\OnlineExamReviewController::class, 'index']);
                Route::put('/online-exams/attempts/{attempt}/review', [\App\Http\Controllers\Api\Staff\OnlineExamReviewController::class, 'review']);
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
            Route::get('/presence', [\App\Http\Controllers\Api\PresenceController::class, 'index']);

            Route::get('/profile', [AdminProfileController::class, 'show']);
            Route::get('/reports', [\App\Http\Controllers\Api\Admin\ReportController::class, 'index']);
            Route::get('/reports/export', [\App\Http\Controllers\Api\Admin\ReportController::class, 'export']);
            Route::get('/activity', [\App\Http\Controllers\Api\Admin\ReportController::class, 'activity']);
            Route::get('/application-counts', [\App\Http\Controllers\Api\Admin\DashboardController::class, 'applicationCounts']);
            Route::get('/notification-deliveries', [\App\Http\Controllers\Api\Admin\ReportController::class, 'deliveries']);
            Route::post('/notification-deliveries/{delivery}/retry', [\App\Http\Controllers\Api\Admin\ReportController::class, 'retry']);
            Route::get('/scholarship-applications/{application}/history', [\App\Http\Controllers\Api\Admin\ScholarshipAwardController::class, 'history']);
            Route::put('/scholarship-applications/{application}/award', [\App\Http\Controllers\Api\Admin\ScholarshipAwardController::class, 'update']);
            Route::post('/profile', [AdminProfileController::class, 'update']);




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

            Route::post('/admission-applications', [
                AdmissionApplicationController::class,
                'store'
            ]);

            Route::get('/admission-applications', [
                AdmissionApplicationController::class,
                'index'
            ]);

            Route::get('/admission-applications/{application}', [
                AdmissionApplicationController::class,
                'show'
            ]);

            Route::put('/admission-applications/{application}', [
                AdmissionApplicationController::class,
                'update'
            ]);

            Route::delete('/admission-applications/{application}', [
                AdmissionApplicationController::class,
                'destroy'
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

            Route::get('exams/{exam}/candidates', [AdminExamController::class, 'candidates']);
            Route::post('exams/{exam}/roster', [\App\Http\Controllers\Api\Admin\ExamRosterController::class, 'store']);
            Route::get('exams/{exam}/roster', [\App\Http\Controllers\Api\Admin\ExamRosterController::class, 'show']);
            Route::post('exams/{exam}/assignments', [AdminExamController::class, 'assignApplicants']);

            Route::put('exams/{exam}/assignments/{assignment}', [
                AdminExamController::class,
                'updateAssignment',
            ]);

            Route::post('exams/{exam}/release-results', [
                AdminExamController::class,
                'releaseResults',
            ]);

            Route::apiResource(
                'exams',
                AdminExamController::class
            );

            /*
            |--------------------------------------------------------------------------
            | Online Examination - official result release
            |--------------------------------------------------------------------------
            */

            Route::put('online-exams/settings', [AdminOnlineExamController::class, 'updateSettings']);
            Route::get('online-exams/questions', [AdminOnlineExamController::class, 'questions']);
            Route::post('online-exams/questions', [AdminOnlineExamController::class, 'storeQuestion']);
            Route::put('online-exams/questions/{question}', [AdminOnlineExamController::class, 'updateQuestion']);
            Route::delete('online-exams/questions/{question}', [AdminOnlineExamController::class, 'destroyQuestion']);
            Route::get('online-exams/attempts', [AdminOnlineExamController::class, 'attempts']);
            Route::post('online-exams/retake-grants', [AdminOnlineExamController::class, 'grantRetake']);
            Route::post(
                'online-exams/attempts/{attempt}/release',
                [AdminOnlineExamController::class, 'release']
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

            /*
            |--------------------------------------------------------------
            | Authenticated file streaming (private applicant uploads)
            |--------------------------------------------------------------
            */

            Route::get('/documents/{document}/file', [
                AdminDocumentController::class,
                'file'
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

            Route::get('/onboarding', [\App\Http\Controllers\Api\Applicant\OnboardingController::class, 'show']);
            Route::patch('/onboarding', [\App\Http\Controllers\Api\Applicant\OnboardingController::class, 'update']);
            Route::post('/onboarding/restart', [\App\Http\Controllers\Api\Applicant\OnboardingController::class, 'restart'])->name('applicant.onboarding.restart');

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
                ApplicantProgramController::class,
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

            Route::delete('/admissions/{application}', [
                AdmissionController::class,
                'withdraw'
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

            Route::get('/documents/{document}/file', [
                DocumentController::class,
                'file'
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

            Route::get('/exams/{assignment}/roster', [ApplicantExamController::class, 'roster']);
            Route::get('/exams/{assignment}', [
                ApplicantExamController::class,
                'show'
            ]);

            /*
            |--------------------------------------------------------------------------
            | Online Examination (computer-based)
            |--------------------------------------------------------------------------
            |
            | Contract: ONLINE_EXAM_API_CONTRACT.md. The mobile client treats a
            | missing route as "not enabled yet".
            */

            Route::get('/online-exam', [
                ApplicantOnlineExamController::class,
                'index'
            ]);

            Route::post('/online-exam/start', [
                ApplicantOnlineExamController::class,
                'start'
            ]);

            Route::get('/online-exam/attempt', [
                ApplicantOnlineExamController::class,
                'activeAttempt'
            ]);

            Route::get('/online-exam/attempts/{attempt}', [
                ApplicantOnlineExamController::class,
                'attempt'
            ]);

            Route::get('/online-exam/attempts/{attempt}/questions', [
                ApplicantOnlineExamController::class,
                'questions'
            ]);

            Route::post('/online-exam/attempts/{attempt}/answers', [
                ApplicantOnlineExamController::class,
                'saveAnswer'
            ]);

            Route::post('/online-exam/attempts/{attempt}/navigate', [
                ApplicantOnlineExamController::class,
                'navigate'
            ]);

            Route::post('/online-exam/attempts/{attempt}/submit', [
                ApplicantOnlineExamController::class,
                'submit'
            ]);

            Route::get('/online-exam/attempts/{attempt}/result', [
                ApplicantOnlineExamController::class,
                'result'
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

            Route::delete('/announcements/{announcement}', [
                NotificationController::class,
                'dismissAnnouncement'
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
