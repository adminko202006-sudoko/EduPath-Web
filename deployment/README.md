# EduPath online deployment

This is a prepared release kit, not a running internet deployment. No hosting,
domain, database transfer, public endpoint, or purchase was created. All
`edupath.example` addresses below are placeholders. Keep using the existing
local launch commands while development continues.

## Deployment layout

Use a Linux host that supports PHP 8.2+ (the example uses PHP 8.3 FPM), Composer
2, MySQL/MariaDB, persistent storage, Nginx, a queue worker, and a scheduler.
The web app and API share one HTTPS domain:

- `https://YOUR-DOMAIN/`: React application, including the admin website.
- `https://YOUR-DOMAIN/api`: Laravel API used by both web and Flutter.
- Database and private uploads stay on the server's private side.

Do not host this Laravel backend as a static-only site. Do not expose MySQL or
use `php artisan serve` / Vite's development server as production services.

## Prepare a release on this computer

From the repository root:

```powershell
.\deployment\Build-Release.ps1
```

This explicitly builds the frontend with `/api`, preventing a local
`.env.local` server address from being embedded in the release. It creates a
timestamped ZIP and prints its SHA-256 checksum under `output/`.

The ZIP includes Laravel source, lockfiles, blank environment examples, compiled
React assets, server templates, and a file checksum manifest. It excludes live
`.env` files, credentials, databases, uploads, logs, caches, backups, installed
dependencies, nested duplicate frontend sources, and temporary `.bak` copies.
Dependencies are installed on the server using `composer.lock`.

## Configure the chosen host

1. Point your domain's DNS to the chosen server and obtain a valid HTTPS
   certificate. Keep the site's service limited to ports 80 and 443. Your
   hosting provider must supply persistent database/storage and service access.
2. Upload the ZIP over an authenticated private connection, verify its checksum,
   and unpack it under `/var/www/edupath`. On later releases, preserve
   `backend/.env`, `backend/storage`, and the existing application key.
3. Install locked PHP dependencies in `backend`:

   ```sh
   composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction
   ```

   PHP needs Laravel's extensions plus `pdo_mysql`, `zip`, and `gd` for this
   project. Check `composer check-platform-reqs --no-dev`. Copy
   `php-overrides.ini.example` into the relevant FPM configuration after review.
4. Copy `backend/.env.production.example` to `backend/.env`. Fill in the actual
   HTTPS `APP_URL`, `FRONTEND_URL`, and exact `CORS_ALLOWED_ORIGINS`, database
   credentials, SMTP delivery settings, and private Firebase credential path.
   Use the existing `APP_KEY` when moving existing data; generate a key only for
   a genuinely new installation. Never put secrets in the React or Flutter app.
5. Transfer existing data separately and privately. First create and verify a
   SQL/storage backup. Import the SQL into the intended target database while
   preserving the original local database. Copy both `storage/app/private` and
   `storage/app/public` with their relative paths preserved, then compare file
   counts and hashes. Preserve historical uploads and records. Ensure the
   service user can write `storage` and `bootstrap/cache`.
6. Review pending migrations using `php artisan migrate:status` and
   `php artisan migrate --pretend`. Apply only reviewed, authorized migrations
   after a verified backup. Do not run `migrate:fresh`, `db:wipe`, sample seeders,
   or automatic administrative-account creation against institutional data.
7. Adjust and install `nginx.conf.example`: real domain, TLS certificate paths,
   project directory, and actual PHP FPM socket. Obtain the certificate before
   enabling the HTTPS block. Run `nginx -t` before reloading the server. The
   private-document deny rules must stay ahead of public storage handling.
8. Install the Supervisor worker from `supervisor.conf.example` and the scheduler
   entry from `cron.example`, using the application service account. The
   scheduler runs EduPath's existing notification-dispatch command each minute.
   Configure log rotation and private off-server backups with your host.
9. After configuration and migrations, run:

   ```sh
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   php artisan queue:restart
   php artisan edupath:operations-check --production --url=https://YOUR-DOMAIN
   ```

   Resolve failed readiness checks; this command does not repair records or
   replace institutional examination policy. A health page alone does not prove
   database, mail, notifications, or document access work.

If a hosting provider terminates HTTPS in a separate proxy, configure Laravel's
trusted proxy addresses to match that provider before launch. The supplied
Nginx example terminates TLS directly and does not require trusting arbitrary
forwarded headers.

## Build the applicant mobile app

The existing mobile app supports the compile-time `EDUPATH_API_BASE_URL` setting.
Its release initialization now accepts a valid compiled HTTPS endpoint without
asking every applicant to enter a server URL. Debug builds retain LAN discovery.

After the real HTTPS API is deployed and tested:

```powershell
.\deployment\Build-Mobile.ps1 -ApiBaseUrl 'https://YOUR-DOMAIN/api'
```

The helper rejects HTTP and placeholder `.example` domains. The mobile project
currently uses **debug signing for release builds**. Configure the institution's
private release keystore before public distribution; keep the key outside source
control. No signing key or production APK has been generated by this preparation.
Previously saved local server settings may need to be changed in the app's
Settings. Never bypass the HTTPS or connection checks.

## Verify from outside the college network

Use mobile data, not the administrator computer's Wi-Fi:

- Register/login as an applicant and confirm protected endpoints reject guests.
- Submit an admission application and upload/download a document as its owner.
- Verify cross-applicant document access is denied. Direct
  `/storage/documents/<file>` access must return 403/404, including legacy files.
- Have authorized staff/admin review an application from another connection and
  confirm the applicant sees the new status and notification.
- Verify password recovery mail contains the real HTTPS domain and push delivery
  reaches a test device. Check the scheduler, queue failures and private logs.
- Verify scholarship application, online exam start/resume/submit, official
  result release, and the existing scheduled Entrance Exams workflow.
- Restart server services and confirm the database and uploaded files persist.
- Check that `/.env`, `/storage/app/private`, backups, and source files are not
  downloadable. Keep a tested rollback to the prior code version and backup.

Live acceptance and phone testing remain pending until hosting and a real domain
are available. Automated local tests are recorded in `verification.md`.
