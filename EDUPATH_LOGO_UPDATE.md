# EduPath logo update

Used the supplied `EduPath Blue and Gold Emblem.png` without changing its artwork.

Web:
- `frontend/public/images/EduPathBlue.png`: optimized display asset used by the login and session-loading screens. Uses Vite's base URL so subdirectory hosting resolves the public image correctly.
- `frontend/src/components/LoginBrandLogos.jsx`: circular college and EduPath logos side by side, reused by the desktop and narrow login layouts.
- `frontend/src/pages/auth/Login.jsx`: uses the paired logos; authentication behavior is unchanged.
- `frontend/src/components/ProtectedRoute.jsx`: session-loading screen now displays the EduPath logo.
- Confirmed the active entry point/routes use `frontend/src/`; the inactive nested source copy was not changed.

Mobile (`C:\Users\oseas\StudioProjects\edupath_mobile`):
- Updated `assets/images/edupath_logo.png` and its shared `AppLogo` presentation to use a white circular background. TMC variants fill their circle without a white backing or display padding.
- Login shows the existing college logo beside the new EduPath logo.
- The existing splash/session initialization screen uses `AppLogo` and now displays EduPath branding.
- Replaced all five Android launcher PNG densities and every iOS app-icon catalog PNG, preserving aspect ratio on a white square. Full-resolution artwork is retained for launcher generation in `storage/brand-logo/edupath_original.png`; the reproducible installer is `storage/brand-logo/install-mobile-brand.ps1`.

Verification:
- Web production build and ESLint passed.
- Flutter analysis: no issues.
- Flutter suite: 171 passed, 1 skipped (existing live-API test requires an explicit API URL).
- Checked Android 192px and iOS 1024px output dimensions; no native device installation or iOS build was performed.

Refresh the website. For the native launcher icon, stop the running app and run `flutter run` again on the phone to rebuild/install it; hot reload does not update native launcher resources. Launcher caches may require reinstalling the app, which can clear local sign-in/preferences.

## TMC seal crop

The shared web navigation bar (all roles), password recovery, OTP verification, and password reset use `frontend/src/components/TmcLogo.jsx`. The component enlarges the existing JPEG by 10% and offsets its vertical position to crop the photographed white outer margin within a circular viewport. Removed white display padding; mobile header sizing now targets the logo viewport rather than the cropped inner image. The inactive `frontend/src/src/` copy remains untouched. At the user's request, both web login layouts retain the previous uncropped TMC logo with its white padding; the adjacent EduPath logo remains in place.

The mobile TMC PNG already fills its canvas, so its shared variant now uses a fixed-size circular viewport without the former 6% white padding. EduPath artwork and app launcher icons are unchanged by this crop adjustment.

Crop checks: web production build and targeted ESLint passed; Flutter analysis found no issues. Existing mobile welcome/splash/login test results are recorded in `storage/tmc-logo-zoom/flutter-tests.log`.
