# Mobile dark-mode icons

Updated the Flutter project at `C:\Users\oseas\StudioProjects\edupath_mobile`.

- Added shared `lib/shared/widgets/app_icon.dart` and routed 254 icon sites across 39 existing Dart files through it, including authentication, admission, scholarships, documents, exams, profile, settings, notifications, navigation, and shared dialogs/widgets.
- Added the light-blue icon token `#93C5FD` and appearance-aware navy/blue conversion in `lib/core/theme/app_theme.dart`. Dark theme app bars, list tiles, and inherited icons use the same token.
- Appearance changes update icons immediately. Light mode retains original colors. Non-blue semantic colors, opacity, accessibility labels, icon geometry, and custom shadows are preserved. Icons on controls with inherited navy foreground receive a subtle contrast outline when converted.
- Backgrounds, text colors, APIs, database records, and examination settings were not changed.

Verification includes `test/app_icon_test.dart`: runtime appearance switching and restoration, brand/file-type blue palettes, preservation of other hues and opacity, inherited control icons, and contrast on dark surfaces. The only remaining native `Icon(...)` constructor in application source is inside `AppIcon`.

Executed verification:

- `flutter test --no-pub --reporter expanded`: 171 passed, 1 skipped. The existing live-API connection test skipped because no live API URL was supplied.
- `flutter analyze --no-pub`: no issues found.
- Source scan confirmed all application-owned icon constructors use the shared appearance-aware widget.

No physical-device visual check was performed during this change.

Restart the running Flutter app after pulling these changes to refresh all existing screens.
