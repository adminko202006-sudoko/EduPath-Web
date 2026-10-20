# One email address per EduPath account

## Findings

Admin, Staff, and Applicant accounts all use the shared users table. The configured MySQL users.email column already has a case-insensitive utf8mb4_unicode_ci collation and the unique users_email_unique index. A read-only aggregate audit found zero duplicate LOWER(TRIM(email)) groups. No email addresses or account records were printed.

Existing API validation checked uniqueness across users, but normalization was inconsistent and the validation depended on database collation. Concurrent duplicate writes could also reach the generic server-error response instead of a useful email field error.

## Changes

- backend/app/Rules/UniqueAccountEmail.php: common case-insensitive, trimmed lookup across all account roles, including inactive accounts. Profile changes can exclude only the authenticated or server-resolved account ID. The response does not reveal another account's name or role.
- backend/app/Models/User.php: normalize newly assigned email values to trimmed lowercase for all Eloquent account creates/updates. Existing stored addresses are not rewritten in bulk.
- backend/app/Http/Controllers/Api/Auth/AuthController.php: apply the shared rule to the common web/mobile applicant registration endpoint.
- backend/app/Http/Controllers/Api/Admin/StaffController.php: apply the rule to Admin creation and editing of Staff accounts.
- backend/app/Http/Controllers/Api/Admin/ProfileController.php and backend/app/Http/Controllers/Api/Staff/ProfileController.php: apply the rule to supported profile email changes while allowing an owner to keep their existing address.
- backend/bootstrap/app.php: recognize email-specific database unique conflicts and return HTTP 422 with errors.email instead of SQL details or a generic 500. The existing database index remains the concurrency backstop.
- backend/tests/Feature/AccountEmailUniquenessTest.php: isolated SQLite tests for cross-role duplicates, historical capitalization, whitespace/case variants, valid registration, account edits, legitimate unchanged emails, normalization, and database-conflict responses.
- storage/account-email-audit.php: read-only schema/aggregate verification script; no account addresses are output.

The user-facing validation message is: "This email address is already used by another account. Please use a different email or sign in."

The rule covers Gmail and other supported email domains. It compares the same email address after capitalization/outer-whitespace normalization; it does not invent provider-specific alias rules or rewrite dotted/plus-tagged addresses.

No migrations, deletions, account merges, role changes, or bulk record updates were needed. Applicant profile editing does not currently support changing the login email, and that API permission was preserved. Frontend and Flutter validation-error parsers already display errors.email, so no client modifications or separate availability endpoint were needed.

## Verification

- Read-only configured-database audit: unique email index confirmed; zero duplicate normalized-email groups.
- php artisan test --filter='AccountEmailUniquenessTest|StaffAccessTest|AdminProfileTest|PasswordRecoverySecurityTest|ApplicantOnboardingTest': 52 passed, 537 assertions.
- php -l for the new rule, User model, and exception configuration: passed.
- git diff --check for changed source: passed (line-ending notice only).
- Mobile and web error-parser integration was inspected in source. No real accounts were created or changed, and no browser/device submission test was performed. All write tests used isolated in-memory SQLite.
