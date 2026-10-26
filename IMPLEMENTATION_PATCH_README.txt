EDUPATH - ADMIN SCHOLARSHIP + ONLINE EXAM FOUNDATION PATCH

This patch was prepared from the uploaded EduPath_Three_Projects.zip. It is an incremental change, not a replacement project. It does not include or overwrite any .env files, database dumps, vendor folders, node_modules, or user uploads.

CHANGES INCLUDED
1. Adds scholarship category fields: UniFAST, TES/TDP, Other Scholarships; exam workflow flags; unlimited-award rule; approved-admission prerequisite; fixed online-exam settings.
2. Adds persistent per-attempt question assignments so new attempts randomly select 100 active questions and grading uses those same assigned questions even if the bank later changes.
3. Enforces the Other Scholarship online-exam rule in the applicant API: admission must be approved, an Other Scholarship application must exist, at least 100 active questions must be available, and default attempt/retake rules still apply.
4. Adds Admin API endpoints for question-bank management, viewing attempts, granting retakes with a reason, and officially releasing results with the releasing Admin recorded.
5. Adds an Admin Online Scholarship Examination page and navigation entry.
6. Adds scholarship category selection and admission-approval exception control to the Admin Scholarships form.
7. Category rules are enforced by the backend, not only by the UI. UniFAST uses face-to-face exam; TES/TDP does not automatically use the online exam; Other Scholarships use the 100-question/60-second/50% online exam and cannot be blocked by a fixed slot count.

IMPORTANT BEFORE APPLYING
- Back up your current database and project folders first.
- Inspect the migration before running it. It adds columns/tables and classifies existing scholarships using recognizable UniFAST/TES/TDP names/providers; unrecognized existing records default to Other. Review the category values after migration and correct them in Admin if needed.
- Existing scholarship rows with category Other will have the unlimited-award rule applied by the API, but this migration does not delete their existing available_slots values.
- The question bank currently has fewer than 100 sample questions in the uploaded source. The exam intentionally remains unavailable until an Admin adds at least 100 active questions. Do not use invented/sample questions for a real selection exam; enter institution-approved questions.
- The existing project was statically inspected, but this patch could not be tested against your live database or browser. PHP syntax checks passed for changed backend files. Frontend production build was not run because node_modules is not included in the uploaded archive.

APPLY
1. Extract this patch ZIP into C:\xampp\htdocs\G5_Edupath (or the folder that contains your existing backend and frontend folders), preserving the backend/ and frontend/ paths. Allow it to overwrite only the listed source files.
2. Back up your database first using phpMyAdmin or mysqldump.
3. In PowerShell:
   cd C:\xampp\htdocs\G5_Edupath\backend
   php artisan migrate --pretend
   Review the output, then run:
   php artisan migrate
4. In a second PowerShell window:
   cd C:\xampp\htdocs\G5_Edupath\frontend
   npm install
   npm run build
5. Start Laravel and Vite using your normal commands, log in as Admin, open Scholarships and Online Scholarship Exam, then add approved questions until the active bank contains at least 100.
6. Test with a non-production applicant account before using the feature for real decisions.

API ROUTES ADDED (Admin role required)
GET    /api/admin/online-exams/questions
POST   /api/admin/online-exams/questions
PUT    /api/admin/online-exams/questions/{question}
DELETE /api/admin/online-exams/questions/{question}
GET    /api/admin/online-exams/attempts
POST   /api/admin/online-exams/retake-grants
POST   /api/admin/online-exams/attempts/{attempt}/release

KNOWN FOLLOW-UP WORK
- Send notification automatically when results are released or scholarship decisions change.
- Finish the staff recommendation / Admin final-decision workflow and audit trail.
- Add scholarship-specific document verification and stronger eligibility checks based on each official program's actual rules.
- Adapt applicant React and Flutter exam screens to display only the currently timed question rather than the entire assigned question set, then run cross-client tests.
- The online exam currently has one applicant-level attempt history for the Other category, not a separate attempt per individual Other Scholarship. If separate exam attempts per scholarship are required, add scholarship_id to attempts and update both clients in a coordinated follow-up.
