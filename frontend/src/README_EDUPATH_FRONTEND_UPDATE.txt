EDUPATH FRONTEND SOURCE UPDATE
==============================

This archive contains the updated src/ directory from the provided frontend ZIP.
It is not a complete Vite project because the uploaded archive contained src/ only
and did not include package.json, Vite configuration, or installed dependencies.

WHAT CHANGED
------------
1. src/services/api.js
   - Supports VITE_API_BASE_URL as an override.
   - Defaults to the current browser hostname on port 8000, which is more suitable
     for LAN testing than hardcoding 127.0.0.1.
   - Keeps bearer-token attachment and FormData handling.
   - Adds a shared response collection normalizer and request timeout.

2. Filled previously empty service modules:
   - src/services/applicantService.js
   - src/services/programService.js
   - src/services/examService.js
   - src/services/scholarshipService.js
   - src/services/announcementService.js

3. Filled previously empty reusable components:
   - src/components/Footer.jsx
   - src/components/Loading.jsx
   - src/components/Modal.jsx

4. Added an applicant announcements page and connected it to the applicant route
   and sidebar:
   - src/pages/applicant/Announcements.jsx
   - src/routes/AppRoutes.jsx
   - src/components/Sidebar.jsx

IMPORTANT BACKEND GAP
---------------------
The supplied Laravel routes/api.php does not define GET /api/applicant/announcements.
The new page deliberately displays a clear backend-route message when Laravel returns
404 rather than pretending announcements are available. Add an applicant-authorized
route/controller action in Laravel before this page can show published announcements.
Do not point applicant pages at /admin/announcements; that route is privileged.

API ADDRESS CONFIGURATION
-------------------------
Optional: create .env.local in the full Vite frontend project root (not inside src)
with a URL reachable from the browser, for example:

VITE_API_BASE_URL=http://192.168.1.10:8000/api

Replace the IP with the actual PC/LAN address running Laravel. If the frontend and
backend run on the same computer and are accessed via localhost, the default may work.
For other devices, Laravel must listen on the LAN interface and Windows Firewall must
allow the port. Do not commit secrets into the frontend.

INSTALL
-------
1. Back up the current frontend/src directory.
2. Extract this archive and merge its src/ directory into:
   C:\xampp\htdocs\G5_Edupath\frontend\src
3. Keep your existing package.json, Vite config, public assets, and other project files.
4. From the full frontend project root, run:
   npm install
   npm run build
5. Resolve any errors from your existing project dependencies before deploying.

VALIDATION LIMITATION
---------------------
A production build could not be run here because the provided frontend archive contains
only src/ and does not include package.json, Vite configuration, or node_modules.
The existing API calls and backend behavior have not been runtime-tested against a live
Laravel server. Review the source diff and keep the backup until you have tested login,
admission, document upload/replacement, scholarships, exams, and role-based pages.
