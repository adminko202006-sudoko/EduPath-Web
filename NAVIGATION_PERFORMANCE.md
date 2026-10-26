# Navigation loading improvements

## Findings

- The app already preserves visited pages in KeepAliveOutlet; this was retained.
- Page chunks were only preloaded on sidebar hover/focus/press, leaving first visits waiting for code downloads.
- Concurrent identical GET requests could each reach the server, including requests from multiple components and development StrictMode effects.
- Application badges polled full dashboard responses, loading unrelated metrics and recent applicant records.
- Some background refreshes replaced previously loaded content with skeletons.
- Page entrance animations took 360 ms on desktop and 240 ms on mobile.

## Changes

- frontend/src/services/routePreload.js and frontend/src/components/Sidebar.jsx: warm the visible role's permitted navigation modules sequentially during idle time, with cleanup on account/menu changes. Hidden tabs and data-saving/2G connections pause speculative downloads. This imports code only; it does not mount pages or prefetch private records.
- frontend/src/services/inFlightRequests.js and frontend/src/services/api.js: combine only simultaneous identical GET requests, keyed by URL/query, request headers including authorization, response type, timeout, and credentials. Responses are removed when the request settles. Writes invalidate pending sharing on start and completion. Cancellable requests, custom parameter serialization, download-progress requests, authentication, and online examination clocks bypass sharing. Errors still propagate, and subsequent retries contact the server.
- backend Admin/Staff DashboardController applicationCounts methods and backend/routes/api.php: add GET /api/admin/application-counts and GET /api/staff/application-counts. Return only pending admission and scholarship counts. Admin remains role-protected; Staff counts require an active profile, the specific feature permission, and assigned programs. No applicant records are returned.
- frontend/src/hooks/useApplicationCounts.js: badge polling now uses the count-only endpoint.
- frontend/src/pages/admin/OnlineExamManagement.jsx: automatic and post-save refreshes retain the loaded question bank and attempts while refreshing. Initial loads and filter changes still show loading feedback.
- frontend/src/pages/applicant/Scholarships.jsx: refreshes retain loaded scholarship cards rather than replacing them with the initial loader.
- frontend/src/index.css: shorten page transitions to 140 ms desktop / 120 ms mobile; retain reduced-motion support.

No migrations, record changes, authentication bypasses, stored API response caches, or changes to examination timing were introduced. Backend data fetching still runs when required; an immediate first load cannot be guaranteed on a slow server or connection.

## Verification

- npm test: 48 passed, including new concurrent-request, error/retry, write-invalidation, account/filter separation, preload cleanup, tab visibility, and data-saving checks.
- Targeted ESLint for all changed JavaScript/JSX source files: passed.
- npm run build: passed (1974 modules transformed).
- php artisan route:list --path=application-counts: both protected count routes confirmed.
- php artisan test --filter=StaffAccessTest: 11 passed, 226 assertions; includes new count endpoint role, permission, status, and program-scope coverage using isolated SQLite.
- Browser runtime had no available connections in this session. Authenticated navigation timings and visual behavior were not measured; no before/after speed claim is made.
