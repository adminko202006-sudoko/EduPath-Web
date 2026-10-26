# Applicant and staff online indicators

Small green indicators now appear on applicant avatars in Admin Applicants and staff avatars in both the desktop table and responsive cards of Admin Staff Management. Green means a valid signed-in device recently sent a heartbeat. Gray means offline or currently unavailable; accessible labels and tooltips distinguish an unavailable lookup. Staff account Active/Inactive badges remain separate.

## Behavior

- Visible web clients and foreground mobile clients renew presence every 30 seconds. Background/hidden or signed-out clients stop renewing it.
- Heartbeats expire after 90 seconds. The admin lists refresh online state about every 30 seconds, so display changes may lag until the next poll. This is recent activity, not an exact connection or human-attention measurement.
- Only the current authenticated bearer token can send its own heartbeat. Client-provided user IDs and online flags cannot mark another account online.
- Presence uses existing application cache storage and existing Sanctum tokens. No migration or applicant/staff data rewrite is required.
- The admin lookup checks that a token still exists and is unexpired. Signing out or revoking a device token removes that device from eligibility, even if its cache entry has not expired. Another online device can keep the account online.
- Inactive staff are excluded immediately by the API and shown offline by the staff list. Unknown IDs and administrators do not receive applicant/staff online status.
- Cached/offscreen web pages do not poll. Hidden browser tabs and background mobile apps do not heartbeat. Returning to a visible page or resuming the app refreshes activity.
- Failed lookups clear the green indicators instead of retaining a false success. Background presence failures retry independently of admissions, exams and other workflows. Presence requests do not broadcast global data refreshes.

## Connections and changed files

| Area | Connection |
| --- | --- |
| Heartbeat API | POST `/api/auth/presence`, authenticated, rate limited |
| Admin lookup | GET `/api/admin/presence?user_ids[]=...`, admin role required, up to 200 IDs per batch |
| Server state | `backend/app/Services/OnlinePresence.php`, `backend/app/Http/Controllers/Api/PresenceController.php`, `backend/routes/api.php` |
| Web heartbeat | `frontend/src/context/AuthContext.jsx`, `frontend/src/services/presenceHeartbeat.js` |
| Web indicators | `frontend/src/hooks/useOnlinePresence.js`, `frontend/src/components/ui/OnlineDot.jsx`, Admin `Applicants.jsx` and `StaffManagement.jsx` |
| Mobile activity | `lib/core/realtime/online_presence_service.dart`, wired to authentication and app lifecycle in `lib/main.dart` in `C:/Users/oseas/StudioProjects/edupath_mobile` |

Presence is only exposed to administrators who already have the applicant and staff lists. No exact last-seen timestamps, device identifiers, tokens or additional private fields are returned. Applicant/staff access rules are unchanged.

## Executed checks

- Full Laravel suite: **241 passed, 1,943 assertions**. New API tests cover anonymous/non-admin access, validation, self-only heartbeat, expiration, multiple devices, logout, deactivated staff, expired tokens and unknown accounts.
- Route list: both presence endpoints registered with the intended authentication and admin restrictions.
- Frontend suite: **76 passed**. New heartbeat tests cover visibility, network reconnection, cleanup, non-overlapping requests and recovery after failure.
- Web lint and production build: passed. The presence hook was linted again after its final account-isolation and hidden-page handling changes.
- Flutter presence service: **2 tests passed**, including foreground/background transitions, account changes, disposal, pending requests and failed-request recovery.
- Flutter analyzer: **no issues found**.

No connected browser or physical phone was available for a manual multi-device session. API, lifecycle unit tests and web compilation were executed; manual live-dot verification is not claimed.

Refresh the website and hot-restart/relaunch Flutter so each client starts sending heartbeats. No database command is needed.
