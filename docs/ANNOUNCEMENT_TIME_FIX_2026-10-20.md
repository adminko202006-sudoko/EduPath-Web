# Mobile announcement visibility — October 20, 2026

The owner reported that an admin-created announcement was missing inside the mobile app, not just missing its push pop-up.

## Confirmed cause

Read-only diagnostics found latest announcement #22 marked published but stored at `2026-10-20T16:47:00Z`. At inspection, server time was `2026-10-20T08:59:31Z`. Its scheduled time is therefore **October 21 at 12:47 AM Asia/Manila**. It had zero in-app notification rows and `dispatch_pending=true`. The applicant announcements API intentionally excludes publications before their scheduled instant.

Both web announcement forms sent `datetime-local` values unchanged, without an offset. The backend parsed these as UTC. A Philippine local selection of October 20 at 4:47 PM consequently became eight hours later than intended. Edit forms also used `substring(0,16)` on UTC values, showing the wrong local time.

## Repairs

- Added `frontend/src/services/publicationTime.js` to serialize local form times as UTC ISO strings and convert API instants back into local form values.
- Updated both Admin and Staff announcement forms to use these conversions.
- Admin helper text explains local-time entry and leaving the date blank to publish immediately.
- Both backend announcement controllers normalize explicit offsets to UTC before saving, validate publication dates, reject unsupported years with HTTP 422, and distinguish scheduling from immediate publication in creation responses. Invalid dates no longer silently become an immediate publication.
- No existing publication time was changed automatically. Announcement #22 remains scheduled until its owner explicitly edits it or its stored publication instant arrives.

## Verification executed

- Frontend suite: **56 passed**, including Philippine-time conversion, date rollover, editing round-trip, blank date and malformed input.
- Laravel targeted regression: `WorkflowAccountabilityTest|OnlineExamIntegrityTest|StaffAccessTest` — **78 passed, 733 assertions**. Includes due Philippine-offset publication visible to applicants, future publication hidden, date validation and existing notification/authorization coverage.
- Initial isolated workflow suite: **14 passed, 91 assertions**; these cases are included in the later 78-test run.
- Frontend lint: passed.
- Production build: passed, 1,981 modules; Vite reported 5.78 seconds. Nonfatal plugin-timing diagnostic emitted.
- PHP syntax checks: both announcement controllers passed.

No mobile source changes, database reset, live announcement publication, push send or dispatcher run occurred. Tests used the isolated in-memory test database. Physical-phone display has not yet been retested.

## Retest the existing announcement

1. Refresh the web Admin page so it loads the updated code.
2. Edit the intended announcement, retain status Published, and clear its publication date/time to explicitly publish now (or choose the intended local time).
3. Save, then open mobile Notifications/Announcements and pull down to refresh. The foreground app also polls approximately every 30 seconds while signed in.
4. If it remains missing, inspect the mobile screen's connection/error message and verify it uses the same backend as web.

## Separate push-delivery finding

At inspection, 28 notification deliveries were pending with zero attempts. This proves that these queued deliveries had not been processed; it does not independently prove why the dispatcher had not processed them. A registered schedule alone is insufficient to establish a running scheduler. Only two applicant accounts had registered device tokens.

The missing in-app announcement was explained by publication timing and does not require push delivery to become visible after an explicit publish-now action. Running the dispatcher/scheduler can deliver queued messages to real applicants, so it was not started during diagnosis. Confirm intended recipients and pending backlog before a controlled push test.

Reusable read-only diagnostics: `php storage/diagnose-announcement-delivery.php`. It reports statuses/times/aggregate counts without applicant identities, announcement contents, device tokens or credentials.
