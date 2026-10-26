# Searchable registration addresses — 24 October 2026

Web and Flutter registration now use searchable Country → Province/state (Province/region for the Philippines) → City/municipality selections, followed by a household/house number, street and barangay text field. Selecting a different parent clears dependent selections while preserving street details. Search dialogs support cancellation, loading and explicit retry. Missing provinces/cities have a manual-entry option; a province is optional for countries without subdivisions. Entered values survive failed registration requests.

## Initial findings and repaired connections

Both clients previously accepted one free-text address. There were no address lookup endpoints or hierarchy checks. The worldwide location database also mixes some Philippine barangays into its populated-place records; shipping those as cities would be misleading. The Philippine selector therefore uses a separate PSA-derived PSGC snapshot, with Manila's sub-municipal districts excluded. Cities outside provinces are grouped by their actual PSGC region, with an explanation in both forms.

| Feature | UI / API / storage connection | Verification |
| --- | --- | --- |
| Country search | Web `SearchableLocation`, Flutter `AddressFields` → GET `/api/locations/countries` → `LocationController` / `LocationCatalog` → local JSON | 250 countries; public HTTP and feature tests pass |
| Province search | Country selection → GET `/api/locations/countries/{country}/provinces` | Hierarchy resets and missing-location entry pass |
| City search | Province selection → GET `/api/locations/countries/{country}/cities?province_id=...` | Bohol has 48 cities/municipalities including Trinidad; NCR has 17; cross-country selection rejected |
| Registration | Both clients submit optional `address_components` → existing POST `/api/auth/register` → canonical location names → existing `applicants.address` | API tests and isolated MySQL rehearsal pass |
| Legacy registration | Existing clients can still submit `address` alone | Compatibility and onboarding tests pass |

## Files and preservation

- `frontend/src/pages/auth/Register.jsx`: uses the new address form and checks completeness before registration. The inactive `frontend/src/src/` tree was not changed.
- `frontend/src/components/forms/RegistrationAddress.jsx`, `SearchableLocation.jsx`, and `frontend/src/services/locations.js`: search dialogs, cascading choices, failed-request retry and request caching.
- `backend/app/Http/Controllers/Api/LocationController.php`, `backend/app/Services/LocationCatalog.php`, and `backend/routes/api.php`: public read-only lookup routes, safe country-code handling and hierarchy validation.
- `backend/app/Http/Controllers/Api/Auth/AuthController.php`: validates structured input and saves server-resolved names. Client-supplied labels cannot override selected catalog IDs. Input and combined address lengths are checked before creating an account.
- `backend/resources/locations/`: country files, compact per-country data, build scripts, source checksums and licenses. Downloaded build inputs in `source/` are ignored by Git. Runtime requests use bundled data, with no external location API dependency.
- `backend/tests/Feature/RegistrationAddressTest.php`: hierarchy, validation, canonical formatting, manual entry, absent subdivisions, NCR and legacy-client cases. Its validation tests bypass only the signup throttle inside the isolated test process, allowing multiple invalid cases to run; production throttling is unchanged.
- `backend/tests/native/defense-rehearsal.php`: includes public lookup and registration with selected address before rehearsing the admission, scholarship and exam workflows in a disposable MySQL database.
- Mobile project `C:/Users/oseas/StudioProjects/edupath_mobile`: updated `lib/features/authentication/register_screen.dart`, `lib/core/auth/auth_provider.dart`; added `lib/shared/widgets/address_fields.dart` and `test/address_fields_test.dart`.

No migrations, existing-address rewrites, applicant deletions or production data resets were performed. Address components are input fields; the existing address string remains the stored and returned API value. Existing profile editing remains compatible. The explicitly requested demonstration exam timer was not changed.

## Data provenance and limits

The worldwide source is [Countries States Cities Database](https://github.com/dr5hn/countries-states-cities-database), under ODbL 1.0. The Philippine override is the [psgc-rb](https://github.com/alkevintan/psgc-rb) mirror of the PSA **1Q 2026** publication, pinned to commit `f4c7e1ffd7ba4eb3bf216544a5022ce7c7771362` with its MIT notice retained. The [PSA's current publication page](https://psa.gov.ph/classification/psgc/) was reviewed; its 3Q 2026 spreadsheet download was blocked by a website challenge, so that newer spreadsheet was not imported. The snapshot is not represented as the latest official release. Manual entry covers missing or changed locations until a refresh.

The final catalog contains 250 countries, 5,323 province/state/region choices and 149,646 cities/populated places. Philippine choices include 82 provinces and 15 region groups for cities outside provinces, with 1,642 cities/municipalities. Source IDs, dates, checksums and rebuild instructions are in `backend/resources/locations/SOURCE.md`, `snapshot.json`, and `philippines-snapshot.json`.

## Actual verification

- `php artisan test --compact`: **236 passed, 1,879 assertions** after the final Philippine data changes.
- `php artisan route:list --path=locations`: all three public lookup routes registered.
- `php tests/native/defense-rehearsal.php`: **passed** selected-address registration, login, cross-role admission/document review, scholarship application, online examination, result withholding/release and retake flow. Fixtures were isolated; no external recipients were messaged.
- Catalog integrity check: unique IDs and valid city-to-province/region references across all 250 countries passed.
- Live HTTP GET on port 8000: 250 countries and 48 Bohol cities/municipalities, including Trinidad, returned correctly. The local Laravel server was started because it was initially stopped.
- `npm test`: **70 passed**. `npm run lint`: **passed**. Final `npm run build`: **passed**. Windows sandbox restrictions initially prevented Node workers from spawning; rerunning with approved process permissions succeeded.
- Flutter `test/address_fields_test.dart` plus existing `test/register_screen_test.dart`: **8 passed**, covering search, parent changes, manual entry, countries without provinces, retry without losing street input, and 320/390 px light/dark registration layouts.
- `flutter analyze --no-pub`: **no issues found** after correcting the retry callback and applying analyzer suggestions.
- Browser discovery returned no connected browsers. Interactive web click-through and physical-device checks were not performed; API checks, production compilation and Flutter widget/layout checks were performed.

Refresh the web registration page and hot-restart/relaunch Flutter to load the updated form. No database command is required.

## Web registration glass appearance

The later web-only styling update uses the existing `frontend/public/TrinidadMunicipalCollege.png` as a fixed campus background. `frontend/src/pages/auth/Register.jsx` adds a navy overlay, frosted translucent form card, soft borders/shadows, translucent inputs and readable header/footer colors for both themes. A solid-surface fallback covers browsers without backdrop blur. The settled content uses `filter: none` so the card can blur the campus behind it; existing entrance/exit animations are retained.

Validation for this styling update: `npm run build` and `npm run lint` passed. The requested image is present in the generated `frontend/dist/` output. No connected browser was available for visual click-through verification. No registration logic, backend or mobile code was changed in this styling update.
