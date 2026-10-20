# Flutter applicant onboarding

Implemented in `C:/Users/oseas/StudioProjects/edupath_mobile` on 2026-10-18. Uses the Laravel onboarding API already implemented for the web. No backend schema/API change, database reset, seed, or real application/examination action was needed for this mobile addition.

## Behavior

- Same eight version-1 step IDs as web: welcome, profile, programs, admission, documents, scholarships, notifications, finish.
- Existing accounts are not automatically enrolled. Open Settings from the Profile page or drawer, then choose Start Tutorial. Settings also offers Restart and Resume for interrupted progress.
- New registrations receive their invitation from the existing server enrollment record. The mobile app offers Start Tour, Skip, or Later after the applicant shell is available and server availability is verified. Merely signing into an older account does not create tutorial progress.
- Progress, skipped/completed state, and revisions are shared with web through GET/PATCH `/api/applicant/onboarding` and POST `/api/applicant/onboarding/restart`. New tutorial versions are rejected until this app supports their content; they never silently enroll old accounts.
- The Profile step highlights the existing bottom navigation and accepts a tap on the highlighted area or Open Profile. The action only navigates. Programs, Documents, and Settings use the existing pushed screens; Admission, Scholarships, Notifications, Profile, and Home use existing tabs.
- The character appears in a speech card with Back, Next, Skip, Finish, and progress. The exact five supplied PNGs are bundled under `assets/images/onboarding/tmc-guide/`.
- The latest five 1254 × 1254px PNGs are synced from the web asset folder and displayed in square frames. They have transparent background samples; some red edge fringing remains in the supplied artwork. The files are preserved unchanged. After an asset update, install the rebuilt APK or restart the development app to clear older decoded images.
- No tour control submits forms, uploads documents, reads/deletes notifications, starts an examination, or changes scholarship decisions. Wording preserves the current eligibility rules and does not promise an award.

## Safety and presentation

- A root `Overlay` and Stack place the tutorial outside screen/layout containers. Underlying pointer, focus, and semantic interaction are excluded while the guide is active. The highlighted Profile area has a navigation-only action proxy; real business controls remain blocked.
- Stable `TutorialTarget` IDs resolve only ready, mounted, current, onstage targets, excluding retained IndexedStack tabs and routes below the current screen.
- Target position is refreshed on scrolling, viewport changes, and while the tour is active. Missing targets produce a visible fallback after 10 seconds; small screens use a scrollable guide and remove an interactive spotlight if both cannot fit safely.
- Supports theme colors, reduced animation, text scaling, progress announcements, keyboard Escape, focus restoration, and lifecycle pause/resume. Real dialogs or unrelated routes pause the guide. Closing a dialog does not reopen it automatically.
- Starting/resuming checks current server eligibility. Both local active/starting exam state and server active-exam state suppress the tutorial. No examination availability/timing API is called merely to authorize a tutorial.
- Onboarding requests are excluded from persistent offline response caching, and cached responses are independently rejected by the onboarding provider. Failed availability closes the tour. No local preference flag authorizes onboarding.
- Server progress revisions prevent delayed mobile/web writes from overwriting newer progress. Conflicts close the guide and load the latest state; the user then explicitly resumes or restarts. Failed saves retain acknowledged progress and display a generic error without SQL/stack details.
- Account generation checks reject late responses after account changes. Polling stops on logout/disposal. Other-device changes/attempt starts are detected on resume or the next 15-second server check; this implementation does not add server push.

## Files added to the mobile project

- `lib/features/onboarding/onboarding_provider.dart`: authenticated API progress, revisions, lifecycle/account guards, route observer.
- `lib/features/onboarding/onboarding_host.dart`: invitation, root overlay, guide/spotlight, safe action proxy, accessibility and cleanup.
- `lib/features/onboarding/tutorial_steps.dart`: shared step IDs and mobile-specific instructions.
- `lib/features/onboarding/tutorial_target.dart`: native target registry and visible-page lookup.
- `test/onboarding_test.dart`: 11 provider/widget/cache tests.
- `test/onboarding_app_scope_test.dart`: startup and hot-reload scope regression using the legacy root providers, without calling `main()`.
- `assets/images/onboarding/tmc-guide/{welcome,explain,point-left,point-right,celebrate}.png`: unchanged supplied assets.

## Files modified in the mobile project

- `lib/main.dart`: `EduPathApp` owns a `ChangeNotifierProxyProvider2` that follows authenticated account/exam state. Its child builds MaterialApp with a context below that provider. This scope is installed when the app widget rebuilds, including hot reload; initialization does not depend on rerunning `main()`. The provider is disposed with its widget scope.
- `lib/core/api/offline_cache_interceptor.dart`: excludes onboarding eligibility/progress from offline cache.
- `lib/core/routing/app_page_route.dart`: optional explicit route name; existing route behavior preserved.
- `lib/shared/widgets/app_drawer.dart`: names the existing Settings route so the tutorial can open there safely.
- `lib/features/navigation/applicant_navigation.dart`: safe tutorial navigation through real tabs/screens and the Profile navigation target.
- `lib/features/settings/screens/settings_screen.dart`: Start/Restart/Resume controls, current availability and error feedback, Finish target.
- `lib/features/dashboard/dashboard_screen.dart`
- `lib/features/profile/screens/profile_screen.dart`
- `lib/features/programs/screens/programs_screen.dart`
- `lib/features/admission/screens/admission_screen.dart`
- `lib/features/documents/screens/documents_screen.dart`
- `lib/features/scholarships/screens/scholarships_screen.dart`
- `lib/features/notifications/screens/notifications_screen.dart`
  - These seven screens add ready-state targets; Profile also names its existing Settings route.
- `pubspec.yaml`: declares the supplied character asset subfolder. No dependencies added or upgraded.

Changed originals were hash-checked before application and backed up under `G5_Edupath/storage/mobile-onboarding-originals/`. The applied file/hash manifest is `storage/mobile-onboarding-patch.json`. Unrelated mobile files were preserved. Web source and its nested duplicate tree were not modified for this mobile addition.

## Verification and installation

Actual project verification after the provider-scope repair: `flutter analyze --no-pub` passed with no issues; full `flutter test --no-pub` passed 72 tests with 1 optional live-server test skipped. The scope regression pumps the app without manually supplying onboarding, checks the route observer, and verifies the same instance survives rebuilding. The strengthened test also passed Flutter hot-reload reassembly with frame pumping. Onboarding tests also exercise all eight steps, an actual highlighted-area tap, invitation/Resume/Skip, failed writes, stale web updates, remote/local exam suppression, offline denial, account switching, real dialog coordination, offstage target rejection, and a small dark screen at 180% text scale with reduced motion. APK build results are recorded in the latest audit checkpoint.

After updating a running development session, perform one **hot restart** (or Stop and Run) to clear the previous bootstrap tree and its listeners. Hot reload does not rerun `main()`. No reinstall, database reset, or preference clearing is needed to repair provider scope.

From the mobile project, normal commands are:

```powershell
flutter analyze --no-pub
flutter test --no-pub
flutter build apk --debug --no-pub
```

The debug APK is produced at `build/app/outputs/flutter-apk/app-debug.apk`. No additional Laravel migration or dependency installation is required for the already updated local backend. A separate backend installation must first receive the web onboarding migration/API.

On your phone, install the new APK (or run the updated project). Verify the existing Settings server address reaches your Laravel server. With an existing applicant and no active exam: Settings → Start Tutorial. Close/reopen to check Resume, complete all eight steps, then Restart. On web, verify the same account reads the mobile progress; change progress in one client and check conflict/resume in the other. Test TalkBack, landscape, keyboard, live network interruptions, and character edge appearance on a real phone before release. No real phone or live authenticated device/API flow is claimed by automated widget tests.
