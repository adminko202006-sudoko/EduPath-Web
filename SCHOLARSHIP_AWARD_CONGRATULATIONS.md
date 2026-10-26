# Scholarship award congratulations

Applicants now receive **Congratulations! Scholarship granted** when an administrator records the separate final `awarded` decision. The message names the scholarship and includes the official decision remarks.

This replaces the generic notification for successful awards and uses the existing scholarship notification type, unread status, and queued push delivery. It appears through the existing applicant notification interfaces; device push remains subject to registered devices, preferences, and delivery configuration.

Application approval and staff recommendations do not trigger congratulations. Staff retain their current recommendation permissions; final award authority remains with administrators. Non-award decisions retain their ordinary notification. Repeating an unchanged award does not create another notification. Existing historical notifications are unchanged, and no database migration is required.

Validation: `php artisan test --no-ansi --filter=WorkflowAccountabilityTest` passed: 16 tests, 112 assertions. Coverage includes notification ownership, scholarship name, unread state, queued delivery, applicant API visibility, duplicate prevention, non-award decisions, and rejection of unauthorized staff awards. No live scholarship was awarded and no external message was sent during testing.
