# Free school demonstration

This setup uses your computer and existing MySQL database through a free Cloudflare
Quick Tunnel. No Railway resources, hosting subscription, domain, or payment card
are needed. It is intended for demonstrations, not continuous institutional hosting.

## Start

From PowerShell in `C:\xampp\htdocs\G5_Edupath`:

1. Make sure the **MySQL Server** used by your MySQL Workbench connection is
   running. This computer has a Windows service named `MySQL80`; check it in
   Windows **Services** if needed. Keep your existing backend `.env` and database.
   Workbench is the database management application and does not need to stay
   open for EduPath to work. XAMPP's Apache and MySQL services are not required:
   the launcher starts PHP itself and uses Laravel's existing database connection.
2. Install the portable official tunnel client once:

   ```powershell
   .\deployment\Install-Cloudflared.ps1
   ```

   This downloads the latest Windows x64 binary from Cloudflare's GitHub releases,
   checks its published SHA-256 digest, and saves it under ignored `storage/tools`.
   It does not install a Windows service or create a Cloudflare account.
3. Start the demo:

   ```powershell
   .\deployment\Start-FreeDemo.ps1
   ```

   The script builds the current React application into `output/demo-frontend`
   with same-origin `/api`, obtains a temporary HTTPS URL, starts a loopback-only
   PHP server, checks `/api/programs`, and runs Laravel's queue worker and scheduler.
   PHP, Node/npm and the project's installed dependencies must already be available.
   Do not run multiple demo launchers together. If Laravel configuration is cached,
   run `php artisan config:clear` from `backend` before starting.
4. Share the printed **Web** URL with your group. Admin, staff and applicants use
   their existing accounts and permissions. Web and API use the same address.
5. On a phone, open the mobile login screen's **Server Settings** icon (or
   **Settings > Server Connection** when signed in). Paste the printed **Mobile API**
   address ending in `/api`, then choose **Test & Save / Test Connection & Save**.
   Both mobile data and another Wi-Fi network should work while the host is running.
   No mobile rebuild is necessary if the installed app already has these controls.

   The Flutter source currently defaults plain `flutter run` to the temporary API
   `https://pub-ist-affected-twiki.trycloudflare.com/api` for debug builds. The first
   debug launch with a newly configured default replaces an older saved address;
   subsequent manual Server Settings changes are preserved. When this tunnel ends,
   paste the next Mobile API address into Server Settings. An explicit
   `--dart-define=EDUPATH_API_BASE_URL=https://NEW-HOST/api` also overrides the debug
   default. Release builds still require an explicit HTTPS address.
6. Keep the terminal, host computer, MySQL and internet running. Stop with Ctrl+C.
   The launcher stops only its own processes and removes its active connection file.
   Every new tunnel has a different hostname: share the new web link and update
   the phone's Server Settings each time. Existing web login state belongs to the
   old hostname, so sign in again at the new address.

If an older installed APK lacks Server Settings, build the current Flutter project
against the displayed address:

```powershell
.\deployment\Build-Mobile.ps1 -ApiBaseUrl https://YOUR-TEMPORARY-HOST.trycloudflare.com/api
```

This project currently uses debug signing; that is for school testing. The APK is
under the mobile project's `build/app/outputs/flutter-apk/app-release.apk`.

## Behavior and limits

- There are no migrations, database resets, record transfers, key replacements or
  edits to your local `.env`. Demo settings exist only in child process environments.
- Everyone uses the same local records. Use school demonstration accounts/data:
  anyone with the URL can reach the normal login and public registration pages.
- Laravel debug output is off for the demo process. Dotfiles, PHP source, private
  document storage and path traversal are blocked by the demo router. Documents
  remain accessible only through the existing authorized API routes.
- The demo trusts forwarding headers only from the local connector, allowing
  Laravel-generated links to use HTTPS and rate limits to identify remote users.
- Your existing `start-edupath.sh`, Apache, and local mobile discovery still work.
  The demo uses port 8088 by default; use `-Port 8090` if it is occupied.
- The queue/scheduler use your existing email and Firebase settings. This does not
  add a paid messaging provider. They may process existing queued notifications.
  Use `-SkipBackgroundJobs` for a connection-only check; scheduled delivery will
  not run in that mode.
- `storage/free-demo/connection.json` contains the active address; local logs are
  in the same ignored directory. Do not distribute logs containing private data.
- Quick Tunnels have no uptime guarantee, support up to 200 concurrent in-flight
  requests, and do not support SSE. Do not use Cloudflare's email-browser gate for
  this mobile API: it requires an interactive browser and blocks native API clients.
- If a `.cloudflared/config.yml` or `config.yaml` already exists, the launcher stops
  without changing it. Consult Cloudflare's instructions before using Quick Tunnels.
- Existing Railway subscriptions/services are separate; this launcher does not
  create, cancel or change them.

## Connection check

Open the printed Web address on a phone with Wi-Fi disabled. Test login and a
non-destructive action such as viewing programs. In the mobile app, test the same
API address and sign in. Confirm admin and applicant see the same intended records.
The script's startup check verifies the local API, not successful remote delivery.

For a local check without exposing the app or processing notifications:

```powershell
.\deployment\Start-FreeDemo.ps1 -LocalOnly -SkipBackgroundJobs -RunSeconds 20
```

Local HTTP is for checking API/router responses; the production web bundle requires
HTTPS, so open the website through the tunnel for real browser use.

Official references: [Quick Tunnels](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/),
[cloudflared downloads](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/downloads/).
