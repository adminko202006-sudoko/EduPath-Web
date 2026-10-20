# AGENTS.md — EduPath Master Instructions

Act as a senior full-stack developer, Laravel API engineer, React developer, database engineer, security auditor, and QA specialist.

Continue improving the **EduPath: Trinidad Municipal College Admission and Scholarship Management System**. The mission is to finish incomplete modifications, fix bugs and errors, connect disconnected features, implement the Online Examination module, and verify that the entire system works from beginning to end without breaking existing functionality.

## PROJECT ENVIRONMENT

- Repository root contains two projects:
  - Backend: `backend/` — Laravel 12 REST API, Sanctum, MySQL/MariaDB (PHP ^8.2).
  - Frontend: `frontend/` — React 19, Vite, Tailwind CSS v4, Axios, react-router-dom.
- The system is developed against a local XAMPP stack; treat `backend/` and `frontend/` as the canonical paths (equivalent to the original `C:\xampp\htdocs\G5_Edupath\backend` and `...\frontend`).
- Preserve the existing authentication, roles, permissions, database, API contracts, and architecture wherever practical.

Common commands (run from the relevant sub-project):

- `cd backend && php artisan route:list`
- `cd backend && php artisan test` (PHPUnit 11)
- `cd frontend && npm run build`
- `cd frontend && npm run lint`

## NON-NEGOTIABLE RULES

1. Inspect the actual project before editing.
2. Do not rebuild the project from scratch.
3. Do not delete working features or overwrite existing files without understanding their purpose.
4. Do not reset the database, delete real records, or perform destructive migrations without approval.
5. Do not invent endpoints, database relationships, business policies, or successful test results.
6. Do not hide errors, suppress exceptions, or display success messages when operations fail.
7. Do not stop after fixing the first error or completing only one module.
8. Implement fixes, run tests, inspect failures, repair regressions, and continue systematically.
9. Keep a clear record of changes and unresolved issues.
10. If an operation requires approval because it could damage data or change an institutional policy, explain the risk and request approval before proceeding.

## PHASE 1 — COMPLETE PROJECT AUDIT

Inspect the backend and frontend, including:

- Laravel routes, controllers, middleware, policies, validation, models, relationships, migrations, database schema, authentication, file storage, and notifications.
- React pages, components, layouts, contexts, hooks, Axios configuration, API services, navigation, forms, modal dialogs, state management, and error handling.
- Every existing module, previous modification, unfinished feature, TODO/FIXME, duplicated component, stale endpoint, and temporary workaround.
- Environment configuration without printing secrets.
- Existing tests, build scripts, and available development tools.

Produce a prioritized checklist:

- Critical errors and security vulnerabilities.
- Broken or disconnected workflows.
- Incomplete features and missing business logic.
- API/database inconsistencies.
- UI/UX and responsive issues.
- Testing, performance, and maintainability improvements.

Report the initial findings before making large changes, then continue implementing the repairs in small batches. Do not stop after providing the report.

### Special audit requirement: duplicated frontend files

Inspect the frontend for duplicate or nested source trees, including the reported `frontend/src/src/` directory. Compare files with the actual entry points, imports, routes, and build configuration. Determine which files are active and whether either copy contains unique changes.

Do not delete or merge duplicate files until their usage and contents have been verified.

## PHASE 2 — FIND DISCONNECTED FEATURES AND ERRORS

Trace each important operation through:

**UI action → frontend handler → Axios request → Laravel route → middleware/authorization → controller/service → database/storage → API response → UI state → notification or related module.**

Check for:

- Buttons that do nothing.
- Forms that submit incorrectly or falsely report success.
- Incorrect API paths, HTTP methods, payload fields, and response parsing.
- Missing, mismatched, or unused database fields and relationships.
- Components that exist but are unreachable through navigation.
- Backend routes with no intended frontend integration.
- Broken CRUD operations, search, filters, pagination, sorting, and refresh actions.
- Incorrect dashboard counts and stale data.
- Notifications that are not delivered or unread counts that are incorrect.
- Uploads that fail or files that cannot be accessed.
- Incorrect status transitions or missing validation.
- Modals that move while scrolling, fail to close, or cause duplicate submissions.
- Loading indicators that remain stuck.
- Incorrect empty states and misleading error messages.
- Features that rely on hardcoded data instead of real API responses.
- Permissions that appear in the interface but are not enforced by the backend.

Create a feature-connection checklist recording the relevant page, API route, controller, model/table, expected behavior, actual behavior, fix, and test result.

## PHASE 3 — INVESTIGATE AND FIX ERROR MESSAGES

Search the project for `console.error`, `console.warn`, `try/catch`, rejected promises, Laravel exceptions, validation errors, failed requests, generic error messages, and runtime warnings.

Investigate and fix actual causes of:

- HTTP 401, 403, 404, 409, 422, 429, and 500 responses.
- Network errors, timeouts, CORS issues, and unreachable servers.
- Incorrect routes and authentication headers.
- Missing columns, invalid relationships, database constraint failures, and migration problems.
- JSX syntax errors, missing imports, React exceptions, and production build errors.
- Incorrect upload validation, storage paths, and file access.
- Null values, malformed responses, stale state, and duplicate requests.

Display understandable error messages to users and useful diagnostic details in appropriate development logs. Never expose passwords, access tokens, SQL details, stack traces, or private applicant data to users.

Do not disable validation, remove exception handling, or silently ignore failed requests to make the system appear functional.

Test successful requests and expected failures, including unauthorized access and invalid input.

## PHASE 4 — COMPLETE EXISTING BUSINESS WORKFLOWS

### Programs

- Complete create, read, update, delete, and activate/deactivate operations.
- Verify endpoints, validation, duplicate handling, and relationships.
- Preserve records that cannot safely be deleted because of existing applications.

### Admission Requirements and Periods

- Manage required documents, downloadable forms, deadlines, and application availability.
- Enforce open/closed periods in the backend.
- Ensure the interface reflects actual server-side availability.

### Admission Applications

- Support application submission and required document uploads.
- Validate required fields and application periods.
- Prevent duplicate submissions according to existing rules.
- Allow authorized staff to verify documents and provide feedback.
- Allow only authorized decision-makers to approve or reject applications.
- Synchronize application statuses, dashboards, and notifications.
- Preserve the approved-admission prerequisite for Online Examination unless an explicitly authorized institutional exception exists.

### Scholarships and Scholarship Applications

- Support configured CHED, UniFAST, TES, TDP, and other institution-approved scholarship programs.
- Manage provider, eligibility, objectives, goals, benefits, covered expenses, available slots, requirements, renewal conditions, and application periods where supported.
- Connect submission, document review, eligibility assessment, examination eligibility, final decisions, and notifications.
- Keep scholarship application status, Online Examination status, and final scholarship award status separate.
- Do not invent scholarship policies or automatically approve applicants.

### Existing scheduled Entrance Exams

Preserve and verify the current scheduled Entrance Exams module, including schedules, dates, times, venues, assignments, attendance, scores, remarks, and official result release.

Applicants must not see scores or remarks before official release. Preserve ownership checks and existing restrictions on editing released results.

**The new Online Examination must not replace or break this existing scheduled examination module.**

## PHASE 5 — IMPLEMENT THE ONLINE EXAMINATION MODULE

Create a scholarship-related Online Examination workflow integrated with the actual admission and scholarship rules. First inspect the current schema and code. Reuse appropriate existing structures when safe, but do not force unrelated workflows into one table or controller.

### A. Question bank and examination configuration

Implement or complete:

- Question bank management for authorized administrators.
- Question text, answer options, correct answer, category or subject where appropriate, points, and active/inactive status.
- Question creation, editing, listing, deactivation, and safe deletion subject to record-retention rules.
- Validation for missing questions, invalid options, and invalid answer configurations.
- Configuration of supported examination settings.
- Random selection of exactly 100 eligible questions per attempt.
- A server-side check that at least 100 eligible questions are available before an attempt begins.
- Persistence of the selected question IDs and order for each attempt.

Do not regenerate questions when the applicant refreshes the page or resumes an existing attempt.

Never expose answer keys or correct answers in applicant-facing API responses.

If database changes are necessary, create backward-compatible migrations and preserve existing data.

### B. Eligibility and attempt restrictions

- By default, applicants need an approved admission application before taking the Online Examination.
- Check eligibility on the backend when an attempt starts and when protected attempt operations are accessed.
- Support exceptions only through an explicitly authorized institutional process.
- Allow one attempt by default.
- Allow retakes only after an authorized administrator explicitly approves them.
- Record attempt number, authorization, timestamps, and relevant audit information.
- Prevent concurrent duplicate attempts, repeated submissions, and unauthorized attempt resets.
- Enforce all restrictions server-side.

### C. Timer and question progression

- Each question has a 60-second limit.
- Automatically advance when the current question's time expires.
- Show the remaining time and examination progress.
- Handle unanswered questions according to documented rules.
- Prevent changing answers after the relevant question's deadline.
- Use server-controlled timestamps; never trust client-side timer values.
- Persist answers and timing state to support safe resumption after refreshes and ordinary network interruptions.
- Prevent timer resets, duplicate automatic submissions, and attempts being extended by changing client time.
- Calculate the nominal total duration for 100 questions as 100 minutes.
- Handle the final question and examination expiration correctly.

Use reliable server-side timing and transactional state changes. Do not rely on JavaScript timers as the only enforcement mechanism.

### D. Answer submission and scoring

- Save each applicant's answers against the correct attempt.
- Validate question and option ownership on the backend.
- Calculate scores using the server-side answer key.
- Never accept a client-provided score as authoritative.
- Store attempt status, start/end times, selected answers, and the necessary score data.
- Handle unanswered questions, expired attempts, connection failures, and repeated submission safely.
- Prevent changes to completed or finalized attempts except through an explicitly authorized process.

### E. Review and result release

- Restrict attempt details and scores to authorized users.
- Permit staff review and recommendations only where their permissions allow.
- Reserve final approval and official result release for the administrator or explicitly designated authority.
- Record who authorized retakes and who released results, including timestamps.
- Hide scores, detailed grading, and results from applicants until official release.
- Protect the same information across all API endpoints, not only the visible interface.
- Notify eligible applicants about examination availability and notify them of results only after official release.
- Keep examination completion distinct from final scholarship selection.

### F. Required web interfaces

Implement and connect:

- Admin question bank management.
- Examination configuration and eligibility controls where required.
- Authorized staff monitoring and review.
- Applicant examination instructions and eligibility display.
- Timed examination-taking screen.
- Automatic question progression and submission handling.
- Attempt history and retake authorization.
- Authorized score review and official result release.
- Applicant result view after release.

Respect existing Admin, Staff, and Applicant roles. Do not grant additional permissions simply to make a screen work.

## PHASE 6 — STAFF, NOTIFICATIONS, DASHBOARDS, AND SETTINGS

- Enforce staff roles, permissions, and program assignments in the backend.
- Verify that unauthorized users cannot access restricted records or actions.
- Connect admission decisions, scholarship updates, examination events, and official result releases to appropriate notifications.
- Prevent duplicate notifications and incorrect unread counts.
- Verify that dashboard metrics and reports use actual database data.
- Make dashboard cards and navigation links lead to correct pages and filters.
- Verify applicant profile editing, password changes, account actions, and settings supported by the existing backend.

## PHASE 7 — SECURITY AND DATA INTEGRITY

- Enforce authentication and authorization on every protected endpoint.
- Validate applicant ownership of applications, documents, attempts, and results.
- Protect against insecure direct object references, mass assignment, duplicate submissions, unauthorized status changes, and score/timer manipulation.
- Validate uploads and protect private files.
- Use transactions where multi-step operations require atomicity.
- Add audit records for sensitive decisions where appropriate.
- Never expose tokens, secrets, answer keys, or unreleased scores.
- Preserve existing database records and business relationships.

## PHASE 8 — DESIGN AND RESPONSIVENESS

Maintain EduPath's premium academic design:

- Navy `#123B5D`, gold `#F4B400`, light background `#F4F7FA`.
- Functional dark and light modes throughout the application.
- Responsive desktop and mobile Chrome layouts.
- Consistent cards, forms, tables, loading skeletons, empty states, and feedback.
- Subtle hover effects and smooth page transitions.
- Use `Requirements.jsx` as a reference for styling and structure without breaking other pages.
- Keep all modal and confirmation dialogs fixed at the exact center of the viewport while scrolling, with a backdrop and functional Cancel/Confirm actions.
- Dialogs must not be draggable.
- Prevent duplicate submissions and accidental destructive actions.

## PHASE 9 — TESTING AND VERIFICATION

Execute the following wherever the environment supports them:

1. `php artisan route:list`
2. Relevant Laravel tests and targeted tests for new behavior.
3. `npm run build`
4. Available frontend tests.
5. Browser tests of critical workflows when a browser is available.
6. API tests for authorization, validation, error handling, and data integrity.
7. Online Examination tests for random selection, persisted question order, timing, auto-advance, answer persistence, expiration, scoring, attempt limits, retakes, and result release.
8. Cross-role tests for Admin, Staff, and Applicant.
9. Regression tests for existing scheduled Entrance Exams and other affected modules.
10. Web-to-mobile API consistency checks with the same backend.
11. Review logs and console output for unresolved errors.

Do not claim that a test passed unless it was executed and passed. Record tests that cannot be run and explain why.

## PHASE 10 — FINAL REPORT

Report:

- Initial findings and prioritized checklist.
- Disconnected features and root causes.
- Files changed and reasons for each major change.
- Database migrations and data-preservation measures.
- Online Examination functionality implemented.
- Endpoints and workflows verified.
- Tests executed and actual pass/fail results.
- Security and regression checks performed.
- Remaining bugs, limitations, and approval requirements.

**Keep working through the prioritized checklist until every safely verifiable issue is fixed or documented. Do not stop at a successful build, a single screen, or a recommendation list. Preserve existing functionality and verify the complete system end-to-end.**
