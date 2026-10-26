# Mobile home entrance-exam card

Root cause: `_UpcomingExamCard` in `dashboard_screen.dart` rendered a `ListTile` with a chevron but no `onTap`. Its subtitle displayed the API's raw date/time strings.

Changes in `C:\Users\oseas\StudioProjects\edupath_mobile`:
- `lib/features/dashboard/dashboard_screen.dart`: tapping the home exam card opens the existing `ExamsScreen`; the schedule displays `October 24, 2026 | 2:37 PM`, with the venue retained.
- `lib/features/exams/exam_schedule_format.dart`: shared English month names and 12-hour times; supports date-only, Laravel ISO dates and SQL date strings, validates invalid calendar/time values, and displays TBA for missing values. Campus calendar dates are not shifted through device time zones.
- `lib/features/exams/screens/exams_screen.dart`: reuses the formatter for exam cards, details and digital permits. Start/end times display AM/PM. Filters and action buttons wrap on narrow screens, fixing two overflows reproduced by the navigation test.
- `test/dashboard_exam_navigation_test.dart`: tests formatting, invalid/missing input, home-card navigation and back navigation at 360px in light/dark mode.

No backend routes, permissions, assignment rules, records, result-release restrictions, or online-exam settings changed. The home card uses the existing scheduled-examination workflow.

Verification: 17 tests passed across the new dashboard regression, scheduled-exam models, roster models, and notification navigation suites. Final `flutter analyze --no-pub` found no issues. Test output is in `storage/exam-home-fix/flutter-tests.log`. No physical device check was performed.
