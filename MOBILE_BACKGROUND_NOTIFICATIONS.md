# Mobile notifications while EduPath is closed

The existing Android app uses Firebase Cloud Messaging (FCM), requests notification permission, creates `edupath_channel_id`, and registers its device token after authentication. Visible FCM notification payloads allow Android to display notices without the Flutter app polling in the foreground.

## Changes

- `start-edupath.sh` now starts Laravel `schedule:work` alongside the API and frontend. The existing once-per-minute dispatch task processes pending push deliveries. The launcher stops its own processes on exit and shuts down if one exits unexpectedly.
- Staff-created applicant notices now create their pending push delivery inside the same database transaction. Existing permissions and assigned-program checks remain enforced.
- FCM payloads include Android high priority, the existing notification channel, and default sound. Provider failures remain failures and use the existing retry mechanism.
- No database migration, credentials replacement, or mobile source change was needed. Existing installed-app versions still need to include the Firebase support present in the current Flutter source.

## Verification

- Private credential structure and matching Firebase project were checked without displaying secrets. Five accounts have registered tokens; that does not prove the tokens remain valid or that devices receive pushes.
- `php artisan test --filter="FcmDeliveryTest|StaffAccessTest"`: 17 tests passed, 254 assertions. Provider calls in these tests are faked; real accounts were not notified.
- Git Bash syntax check passed. Notification routes were listed successfully. No live notification dispatch or closed-phone delivery test was performed.

## Run and verify on Android

1. Stop the existing local launcher with Ctrl+C, then run `bash ./start-edupath.sh` again. The free-demo launcher already starts its scheduler unless `-SkipBackgroundJobs` is supplied.
2. Open the mobile app, sign in as the intended applicant, and allow notifications in Android settings. Keep push preferences enabled for the desired notification types.
3. Close the app normally or lock the phone. Keep the backend host, scheduler, database, and internet running.
4. From an authorized staff/admin account, perform a normal action that notifies that test applicant. Allow the once-per-minute scheduler to dispatch the notice, then check Android's notification tray and tap the notice.
5. Confirm that disabling a notification preference prevents that type of push and that another applicant's notice does not reach the test account.

Android Force stop prevents delivery until the app is reopened. Notification permission and device restrictions also affect delivery. See [Firebase's Flutter receive guide](https://firebase.google.com/docs/cloud-messaging/flutter/receive-messages) and [message priority](https://firebase.google.com/docs/cloud-messaging/customize-messages/setting-message-priority).

The backend currently stores one FCM token per account; signing in on another device can replace that token. Multi-device delivery is outside this change.
