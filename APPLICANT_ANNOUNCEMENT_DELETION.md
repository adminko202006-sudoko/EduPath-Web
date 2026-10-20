# Applicant announcement deletion

Applicants can delete announcements from their own Notifications in the web and native Android apps. The original college announcement, other applicants' copies, and existing notification records remain intact. This dismissal persists across devices and future edits of the same announcement. There is currently no undo/restore control.

## Changes

- `backend/database/migrations/2026_10_18_000003_create_announcement_dismissals_table.php`: additive account/announcement dismissal table with foreign keys and a unique account/announcement pair.
- `backend/app/Services/AnnouncementDismissalService.php`: idempotent dismissal serialized with publication sync using the announcement row lock.
- `backend/app/Http/Controllers/Api/Applicant/NotificationController.php`: filter dismissed announcements from both feeds and unread counts; dismiss a linked announcement when its notification is deleted. Ordinary personal notifications retain their existing delete behavior.
- `backend/app/Services/AnnouncementNotificationService.php`: skip dismissed accounts when refreshing announcement notifications and sending new pushes.
- `backend/routes/api.php`: authenticated applicant-only `DELETE /api/applicant/announcements/{announcement}`. Draft, future, and missing announcements return 404. Existing notification endpoints retain their routes and response contracts.
- `backend/tests/Feature/OnlineExamIntegrityTest.php`: isolated SQLite migration and dismissal tests for ownership, persistence, resync, push exclusion, idempotence, visibility, authentication, and general notification deletion.
- `frontend/src/pages/applicant/Notifications.jsx`: centered confirmation, announcement-specific accessible delete label, duplicate-click guard, and protection against older refresh responses restoring a deleted item. Only the active source tree was changed.
- Native Flutter project `C:\Users\oseas\StudioProjects\edupath_mobile`: updated `lib/core/api/api_config.dart`, `lib/features/notifications/models/notification_model.dart`, `lib/features/notifications/notifications_provider.dart`, and `lib/features/notifications/screens/notifications_screen.dart`; added `test/announcement_dismissal_test.dart`. Announcements now have a trash button with confirmation, both feeds update after confirmed server success, and stale refresh responses cannot restore dismissed items. Notification feed requests bypass the offline HTTP cache so cached lists cannot resurrect dismissals. Already loaded lists remain visible on network failure with an error.

## Setup and verification

The following targeted migration was executed successfully against the configured local database (batch 22); no reset, seeding, or deletion of existing data was performed:

```powershell
cd C:\xampp\htdocs\G5_Edupath\backend
C:\xampp\php\php.exe artisan migrate --path=database/migrations/2026_10_18_000003_create_announcement_dismissals_table.php --force
```

For another installation, apply that migration before deploying these backend changes.

Executed checks:

- Laravel full suite: 108 passed, 739 assertions. After adding the anonymous-access regression and strengthening push exclusion, the affected feature suite was rerun: 42 passed, 298 assertions.
- `php artisan route:list`: 155 routes; new applicant DELETE route confirmed. Targeted migration status: Ran.
- Web ESLint, 26 Node tests, and production build passed. Final web build repeated after the accessible-label adjustment.
- Native notification tests: 9 passed, including confirmation cancel/confirm, failed/malformed saves, fresh loads, duplicate deletes, and stale refresh protection.
- Full native suite: 76 passed, 1 optional live API probe skipped.
- Native analysis: initially found one missing-braces style warning in the new test; corrected and rerun with no issues.
- Android debug APK built successfully at `C:\Users\oseas\StudioProjects\edupath_mobile\build\app\outputs\flutter-apk\app-debug.apk`.

Backups of the four changed native files and verification logs are retained under `storage/announcement-delete-update/`. Physical-device and live browser acceptance have not been performed.

## Try it

Install the rebuilt APK or restart the Flutter development app. Sign in as an existing applicant, open Notifications, select Announcements, tap the trash icon, and confirm Delete. Refresh or sign out and back in: it should stay removed. Another applicant should still see it. Web applicants can use the trash icon on announcement notifications with the same account-specific effect.
