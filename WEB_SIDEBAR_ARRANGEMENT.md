# Web sidebar arrangement

Updated the active shared `frontend/src/components/Sidebar.jsx`, used by the Admin, Staff, and Applicant layouts. The inactive nested source tree is unchanged.

Common section order:
1. Overview — Dashboard, then Reports when available.
2. Admissions — Programs, Requirements, Applicants, Admission Applications, Documents when available.
3. Scholarships — Scholarships, then Scholarship Applications.
4. Examinations — Entrance Exams, then Online Scholarship Exam / staff Online Exam Review.
5. Updates — Announcements, then Notifications.
6. Administration — Staff Management for administrators.
7. Account & Help — My Profile, Settings, How to Use EduPath, About EduPath when available.

Empty groups are hidden after the existing staff-permission filtering. All roles and web viewport sizes share the same section definitions and link styling. Labels wrap instead of truncating. Documents and reports use matching icons across roles. Existing badges, active states, tutorial targets, route preloads, drawer closing behavior, and scrolling remain intact.

Corrected Admin and Applicant About links from nonexistent role-specific paths to the existing `/about` route. No new routes or permissions were introduced.

Executed checks: full web ESLint, production build, and all 76 existing web tests passed. Additional source verification (`storage/sidebar-arrangement/verify-navigation.mjs`) confirmed 16 Admin, 13 Staff, and 14 Applicant links are each grouped exactly once, every destination exists, and each individual staff permission retains access to only its existing feature link. Diff whitespace check passed. No interactive browser visual check was performed.
