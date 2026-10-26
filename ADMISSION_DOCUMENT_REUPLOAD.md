# Admission document corrections — 2026-10-24

Scope: applicant admission documents on the React web app, Flutter mobile app, and shared Laravel API.

## Findings and completed checklist

- [x] Web showed Delete for every status; restrict it to rejected documents.
- [x] Mobile details showed replacement and deletion for every status; restrict both to rejected documents.
- [x] API permitted applicants to delete approved/pending documents; enforce rejected-only deletion with ownership checks and a row lock.
- [x] Web used native browser confirmation; use the existing centered portal dialog with Cancel/Delete and busy state.
- [x] Mobile already had confirmation; preserve it, explicitly center it, use Cancel/Delete, and prevent overlapping requests.
- [x] Web replacement handler shadowed browser `document`, breaking scroll-to-file-input; correct the reference.
- [x] Use Re-upload labels and explain replacement returns to pending review.
- [x] Allow mobile list actions to wrap on narrow screens.
- [x] Verify entry points: main.jsx → App.jsx → routes/AppRoutes.jsx → pages/applicant/Documents.jsx. The separate src/src copy differs and was neither changed nor removed.

## Feature connections

| Action | Existing API | Controller/table | Result |
| --- | --- | --- | --- |
| Re-upload | POST /api/applicant/documents/{document}/replace | Applicant DocumentController::replace / application_documents | Existing validation and pending transition preserved; selected document ID retained. |
| Delete confirmation | DELETE /api/applicant/documents/{document} | Applicant DocumentController::destroy / application_documents and application_document_histories | Owner only; rejected only; deletion and history atomic; stale status rejected with 422. |
| Refresh | GET /api/applicant/documents; GET /api/applicant/documents/{document} | Applicant DocumentController | Existing refresh behavior retained. |

## Files changed

- frontend/src/pages/applicant/Documents.jsx: rejected-only deletion, shared modal, duplicate-operation guards, Re-upload labels, scroll fix, wrapping actions.
- backend/app/Http/Controllers/Api/Applicant/DocumentController.php: transactional rejected-only deletion with status recheck and audit history.
- backend/tests/Feature/ApplicantDocumentAccessTest.php: deletion status, ownership, repeated request and rollback regressions.
- C:/Users/oseas/StudioProjects/edupath_mobile/lib/features/documents/screens/document_details_screen.dart: rejected-only actions, centered confirmation, operation guards, pending-review feedback.
- C:/Users/oseas/StudioProjects/edupath_mobile/lib/features/documents/screens/documents_screen.dart: Re-upload label, duplicate picker/request guard, responsive action wrapping.
- C:/Users/oseas/StudioProjects/edupath_mobile/test/document_actions_test.dart: six widget tests for visibility, cancellation, in-flight disabling and failure feedback.

No migrations or changes to existing records were performed. Deleted rejected documents are removed from the active application; underlying files remain retained under the existing replacement-file retention approach, pending separately authorized cleanup. Deleted records can no longer serve those files through document endpoints.

## Executed verification

- php artisan route:list --path=applicant/documents: six existing routes present.
- php artisan test --filter=ApplicantDocumentAccessTest: 18 passed, 79 assertions, using in-memory SQLite and fake storage.
- npm run build: passed, including after the final duplicate re-upload guard.
- npm test: 70 passed.
- npx eslint src/pages/applicant/Documents.jsx: passed.
- flutter analyze lib/features/documents/screens/document_details_screen.dart lib/features/documents/screens/documents_screen.dart: no issues found.
- flutter test --no-pub test/document_actions_test.dart: six passed.
- Initial sandboxed build/test processes encountered process-launch restrictions; successful checks were rerun outside that sandbox.

Browser discovery returned no connected browsers. Interactive web visual verification and physical-device upload testing were not executed. Full system audit and unrelated modules were outside this focused change.
