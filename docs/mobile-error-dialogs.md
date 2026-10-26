# Flutter error dialogs — October 20, 2026

Implemented in `C:/Users/oseas/StudioProjects/edupath_mobile`.

## Findings

Errors were presented as floating snackbars, inline text, and separate error-state widgets. A scholarship application bottom sheet could cover a snackbar. Form validation did not show a summary above the form. Some notification actions silently returned after failure, and admission attachment failures were omitted from the submission feedback.

## Implementation

- `lib/shared/widgets/error_dialog.dart` provides a centered, scrollable Material dialog on the root Navigator. It supports light/dark themes, OK/Android Back dismissal, optional retry, duplicate suppression, and a queue for different failures.
- Inline errors publish once per message. Dismissed errors can be reopened; ordinary widget rebuilds do not repeatedly open them. Hidden IndexedStack tabs wait until visible.
- Admission, scholarships, documents, profile, authentication/recovery, programs, exam roster downloads, notifications, settings, welcome, and tutorial error displays use this dialog.
- Field validators remain authoritative. Invalid forms display their existing validation messages in a modal while keeping field hints and entered values.
- Success snackbars retain their existing presentation. A scholarship attachment failure is acknowledged before closing the application sheet, so closing the sheet cannot accidentally pop the error dialog.
- Exam completion removes its own error dialog before closing the runner. The server timing and scoring logic were not changed.
- Admission submission now reports failed attached uploads separately from the successfully submitted admission application.
- Notification preference and admission-detail navigation tests now acknowledge the error before testing the underlying controls.
- No backend, API contracts, permissions, database, credentials, dependency versions, or institutional policies changed.

## Files and preservation

The exact 31 source/test files and their before/after SHA-256 hashes are recorded in `storage/mobile-error-dialogs-manifest.json`. The staged files were analyzed and tested before copying. The apply script checked all original hashes before writing, saved existing files under `storage/mobile-error-dialog-originals`, and verified every copied hash afterward.

## Verification

- `flutter analyze --no-pub`: passed, no issues found.
- `flutter test --no-pub --reporter expanded`: 132 passed, 1 skipped, 0 failed. The skipped test requires an explicitly configured live API URL.
- Twelve dialog widget tests cover sheets, preserved input, duplicate suppression, queued errors, retry, rebuilds, invalid forms, success feedback, automatic exam completion, hidden tabs, Android Back, and 320-pixel screens in light/dark modes.
- Full test output: `storage/mobile-error-dialogs/test-results.log`.
- Changes applied to the actual Flutter project and all copied hashes verified.
- No physical-device installation or live API test was performed. Hot restart or rebuild the mobile application to load the changes.
