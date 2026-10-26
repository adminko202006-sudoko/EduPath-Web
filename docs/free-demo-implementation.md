# Free remote school demo implementation - 2026-10-21

## Findings and scope

The system had production HTTPS API configuration and editable Flutter server
settings, but no no-cost launcher for remote demonstrations. The ordinary local
launcher starts separate HTTP Vite/PHP services. Exposing only one of those would
not give both the production web app and native mobile app a usable common origin.
No schema, examination policy, role, admission rule or record changes were needed.

The user requires no billing. This change creates no hosted resources and leaves
existing Railway services/subscriptions untouched.

Database setup clarification: the user manages MySQL through Workbench, rather
than XAMPP's MySQL control panel. A read-only Windows service check found `MySQL80`
running. Demo instructions and messages now refer to that existing MySQL Server;
the launcher continues using the unchanged Laravel database configuration.

## Changes

- `deployment/Start-FreeDemo.ps1`: builds same-origin web assets into a separate
  demo output directory, runs an exclusive launcher lock, starts a free temporary
  tunnel and loopback PHP server, checks the existing public programs API, and
  optionally runs the existing queue/scheduler. Child processes have debug off and
  the current public URL in process-only configuration. Failures stop owned
  processes; successful shutdown also removes the active address file. No local
  `.env` edits or config-cache changes are made.
- `deployment/Install-Cloudflared.ps1`: portable official Windows client installation
  with release-published SHA-256 verification and bounded network timeouts.
- `deployment/DemoRouter.php` and `demo-router.php`: web history routes and built
  assets served on the API origin, appropriate MIME types, private document and
  traversal blocking, no PHP-source/static-server bypass, missing-resource errors.
- `backend/bootstrap/app.php`: opt-in loopback-only proxy trust for HTTPS links
  and client IP handling; other launch modes retain their previous configuration.
- `backend/tests/Feature/FreeDemoRouterTest.php` and `FreeDemoProxyTest.php`:
  routing/file isolation and proxy trust checks, including spoofed remote headers.
- `frontend/tests/apiBaseUrl.test.mjs`: same-origin HTTPS API resolution for both
  initial and restarted demo hostnames.
- Flutter project: connection guidance in login/settings, scrollable login server
  dialog, clearer offline/timeout feedback, and a test that a replacement HTTPS
  tunnel address persists across settings initialization. Originals are preserved
  in `storage/free-demo-mobile-originals` in this workspace.
- `commands`, `.gitignore`, deployment README and `FREE-DEMO.md`: launch commands,
  runtime/build exclusions, instructions, stopping and limitations.

## Verification executed

- Demo build: Vite production build passed (1,987 modules), with `/api` explicitly
  overriding local frontend configuration. Output is `output/demo-frontend`.
- Frontend: 70 tests passed using `node --test --test-isolation=none
  tests/*.test.mjs`; lint passed. The ordinary runner initially failed because this
  restricted Windows environment refused child-process spawning (`EPERM`).
- PHP syntax and PowerShell parser checks passed for the new runtime scripts.
- Deployment/router/proxy tests: 9 passed, 69 assertions. A test initially used
  Laravel's default localhost test host; changing its request to an explicit
  fixture hostname corrected the test setup, after which HTTPS/link checks passed.
- Existing scheduled/online examinations: 79 tests passed, 685 assertions.
- `php artisan route:list --path=api --except-vendor`: succeeded, 168 routes.
- Local running HTTP server: `/`, `/admin/online-exams`, `/reset-password/demo-token`
  and `/api/programs` returned 200. Anonymous applicant admissions returned 401,
  an unknown API route and missing asset returned 404, private documents and `.env`
  returned 403. The built JavaScript entry returned 200 with JavaScript MIME type.
- Verified portable cloudflared 2026.10.2, SHA-256
  `12c7c887f8aaab779aef1dfa9b60673530a5adb88ecc55dd6df8f56e0b70f199`.
  Initial download was interrupted because it was slow; the timeout-bounded retry
  using Windows curl completed and its digest matched the official release.
- Actual public temporary HTTPS tunnel: web root/admin route/programs API returned
  200; anonymous protected admissions returned 401; `.env` and private documents
  returned 403. No authentication tokens or private files were used in these checks.
- Flutter connection/configuration tests: 11 passed, with the unconfigured live
  test skipped. A subsequent run supplied the actual temporary HTTPS API address:
  all 5 server connection tests passed, including the live Flutter/Dio request.
- Flutter analysis passed after the mobile guidance/persistence changes and again
  after the scrollable-dialog adjustment (`No issues found`, final run 18.3 seconds).
- Timed demo shutdown completed: the active connection file was removed, no
  cloudflared processes remained, and the loopback demo port stopped responding.

## Follow-up: default address for `flutter run`

At the user's request, Flutter debug builds now default to
`https://pub-ist-affected-twiki.trycloudflare.com/api`. This address was checked
against `/api/programs` and returned the expected HTTP 200 EduPath response.
An explicit `EDUPATH_API_BASE_URL` dart-define still overrides it. Release builds
do not inherit this temporary debug default.

Debug settings initialization adopts a changed configured default once, replacing
an old saved LAN/tunnel address, and records that default. Later manual settings
remain saved across restarts. A focused test covers both behaviors. Originals
are saved under `storage/mobile-demo-default-originals`.

All 13 mobile configuration/connection tests passed, including the live HTTPS
Dio request to this address. Flutter analysis passed with no issues (21.4 seconds).
The user's running demo session was left untouched.

## Limits and remaining verification

- Startup checks prove local API availability. The separately executed HTTPS/Dio
  checks prove this test tunnel worked; they do not guarantee later uptime.
- Cloudflared logged a local DNS resolver initialization timeout after registering
  its QUIC connection. The same connection still served every tested HTTPS request,
  including the Flutter live check. Monitor tunnel logs if a later run fails.
- Queue/scheduler execution was disabled during the smoke tests to avoid processing
  real pending notifications. Actual email/push receipt was not retested here.
- No physical phone/cellular test, interactive cross-role browser session or new
  APK installation was performed. Use the documented phone acceptance steps.
- The public tunnel used for verification is temporary and is stopped after the
  timed test. Run the launcher to get a fresh address; update mobile Server Settings
  when the hostname changes. No permanent domain or always-on server is supplied.
- The current installed APK must have the editable server controls. If older, build
  and install the current Flutter project using the instructions in `FREE-DEMO.md`.
- No migrations, real record edits, database reset, Railway changes or Git pushes
  were made for this update. The earlier deployment branch does not contain this
  new local demo work unless published separately.
