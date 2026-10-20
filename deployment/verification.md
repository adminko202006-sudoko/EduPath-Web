# Deployment preparation verification

Prepared October 20, 2026. The application has not been published.

## Executed checks

- `php artisan route:list --except-vendor`: 170 routes listed successfully.
- `php artisan test`: 206 passed, 1,674 assertions.
- `npm run lint`: passed.
- `node --test --test-isolation=none tests/*.test.mjs`: 69 passed.
- `deployment/Build-Release.ps1`: Vite production build passed, with `/api`
  explicitly selected instead of any local environment override.
- `deployment/package.php`: created a ZIP, verified every included file against
  SHA-256, and rejected live `.env`, credentials, logs, SQL, backups and dependency
  directory entries. Live storage/data were excluded by the allowlist.
- PowerShell deployment helpers parsed successfully. The mobile helper rejected
  HTTP input before launching Flutter. PHP package-script syntax check passed.
- Flutter analysis: no issues found.
- Full Flutter tests: 135 passed, 1 skipped, 0 failed.
- Flutter tests with `EDUPATH_API_BASE_URL=https://edupath.example/api`: all 3
  deployment-configuration tests passed; this fixture does not contact that
  address. Additional configuration/connection tests: 10 passed, 1 skipped.

Flutter changes were tested in a workspace copy. The application changes are
limited to `lib/core/api/api_config.dart`,
`lib/core/settings/app_settings_provider.dart`, and
`test/deployment_config_test.dart` in the actual mobile project. Application
copies are hash-checked and originals backed up under
`storage/online-hosting-mobile-originals`.

## Connection fixes

- Production React builds resolve the API at the current HTTPS origin by default
  and reject insecure or credential-bearing API URLs. Development LAN behavior
  remains available through the development build.
- Backend CORS uses configured exact origins; production excludes development
  network patterns. Existing bearer authentication remains enforced.
- Password reset emails/redirects read the frontend address from cached Laravel
  configuration instead of hardcoded localhost or runtime `env()` calls.
- Flutter accepts a valid compiled HTTPS endpoint on release initialization;
  missing configuration and saved HTTP endpoints continue to report errors.

No live data was moved, database migration was executed, secret was exported,
or host/account/domain was created.

## Checks pending a real host

- Nginx syntax validation and reload, PHP-FPM, certificate issuance and DNS.
- Remote installation of locked Composer dependencies and platform checks.
- SQL/storage transfer, checksums, migration review, restore verification.
- Scheduler/queue execution, SMTP recovery mail and real-device Firebase delivery.
- Outside-network mobile acceptance against the real HTTPS endpoint.
- Android release signing and the final endpoint-specific APK build.

The one skipped Flutter test requires `EDUPATH_LIVE_API_BASE_URL`. The Nginx and
Supervisor examples have not been run on a server; they require the real host's
paths, domain, TLS certificate and service versions.
