# Admission form simplification

Removed unsupported study preferences from new mobile admission applications. Existing stored applications remain unchanged.

Mobile project: `C:\Users\oseas\StudioProjects\edupath_mobile`

- `lib/features/admission/screens/apply_admission_screen.dart`: changed four steps to **Program → Documents → Review**. Optional notes appear after the document checklist and are labeled **Additional information (optional)**. Removed the full-time/day-shift defaults, preferences controls, and preferences review row. Submission sends only trimmed applicant-entered text through the existing `remarks` field, or null when blank. Back navigation preserves notes. Program selection, attachments, declaration, confirmation, and submission/error handling remain in place. Date-row and dialog-title text now wraps within the viewport.
- `test/admission_simple_flow_test.dart`: verifies blank notes can reach Review, entered notes survive Back navigation, submission contains only the entered text (or null), and failed submission retains the form.

Web:

- `frontend/src/pages/applicant/AdmissionApplication.jsx`: matched the optional Additional information label, reduced textarea height, and added the backend's existing 1,000-character limit. The web form did not contain study-preference controls.

No migrations, database edits, API contract changes, or institutional admission requirement changes.

Checks: two focused mobile tests passed; web build and targeted ESLint passed. Full Flutter suite: 176 passed, 1 existing live-API test skipped because no API URL was configured. Final Flutter analysis: no issues. Logs are in `storage/admission-simple-flow/`. No physical-device check was performed.
