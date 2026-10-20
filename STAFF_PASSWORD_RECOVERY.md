# Staff password recovery

## Findings and completed workflow

The existing recovery system used a six-digit emailed OTP and a hashed one-use reset credential, but accepted only Applicant/Admin roles. The Login page explicitly hid Forgot password for Staff. There was no post-reset email, and password resets did not remove database browser sessions or revoke credentials from the other recovery method.

The Staff login now exposes the existing Forgot password link. All supported account roles use the same existing routes:

1. POST /api/auth/forgot-password sends an OTP to the account's registered email. Unknown accounts receive the same response body. A request-supplied alternate recipient is never used.
2. POST /api/auth/verify-reset-otp validates the code and returns a 64-character one-use reset credential. Only its SHA-256 hash is stored.
3. POST /api/auth/reset-password-with-otp validates the reset credential, changes the password, rotates the remember token, removes the account's Sanctum tokens and database browser sessions, invalidates outstanding OTP and reset-link credentials, and emails a reset confirmation.
4. The user signs in through the normal login flow. Recovery does not create an authentication token.

Codes expire after 10 minutes and lock after five incorrect guesses. Successful verification consumes the OTP and grants a separate 10-minute reset session. A resend invalidates the prior credential. Existing request limits remain: 3 recovery requests per email/minute and 10 per IP/minute; verification/reset share limits of 10 per email/minute and 30 per IP/minute.

Staff role, activation, permissions, and program assignments remain administered by Admin. An inactive Staff account may recover its password but stays inactive and cannot sign in. Missing Staff profiles also remain subject to the existing login restrictions. The recovery page directs users who lost access to their registered email to contact the TMC administrator for identity verification; no unverified email-change flow was introduced.

## Files and data integrity

- backend/app/Http/Controllers/Api/Auth/AuthController.php: allow Staff through all OTP stages; normalize recovery email lookup like Login; keep account operations serialized with row locks; share cleanup across OTP and existing legacy reset-link APIs.
- backend/app/Notifications/PasswordChangedNotification.php: confirmation email without passwords, codes, or reset tokens; includes instructions for unexpected changes and states that account access settings remain unchanged.
- frontend/src/pages/auth/Login.jsx: expose Forgot password for Staff.
- frontend/src/pages/auth/ForgotPassword.jsx: add account recovery/contact instructions and retain the email when returning from OTP verification.
- backend/tests/Feature/PasswordRecoverySecurityTest.php: extend isolated SQLite coverage for the Staff workflow and regressions.
- storage/password-recovery-config-check.php: read-only operational checks that output flags, not email addresses, credentials, tokens, or SMTP connection details.

Email sends use the configured synchronous Laravel mail transport. Mail exceptions propagate to the server's existing error handling; transactional changes roll back if the transport throws. Requests do not report successful delivery or completed reset after a detected mail failure. This does not prove inbox delivery or provide distributed atomicity between SMTP and a database commit.

The local configuration check confirmed SMTP is selected, a sender and SMTP host are configured, database sessions are enabled, and the existing OTP/session tables and reset-token-hash column are present. No new migration or changes to actual user records were needed.

## Verification

- php artisan route:list --path=auth: 9 existing routes confirmed.
- php artisan test --filter='PasswordRecoverySecurityTest|StaffAccessTest': 26 passed, 341 assertions.
- Tests cover registered-email OTP delivery through Laravel's fake notifications, successful active-Staff login after reset, unchanged role/permissions/programs, inactive Staff denial, token revocation verified with a real bearer-token 401, account-scoped session cleanup, code and credential expiry, five-guess lockout, single use, resend invalidation, throttling, malicious payload fields, safe notification content, SMTP failure rollback, and legacy reset-link regressions.
- Targeted ESLint for Login and ForgotPassword: passed.
- npm test: 48 passed.
- npm run build: passed.
- git diff --check for affected tracked files: passed (line-ending notices only).
- Browser interaction and delivery to an actual mailbox were not tested. SMTP credentials, server reachability, and inbox acceptance were not verified by the configuration checks. No real password-reset request or account modification was made during validation.

Existing Applicant and Admin recovery contracts and the separate Flutter client's API contract remain unchanged. The inactive frontend/src/src duplicate tree was not edited.
