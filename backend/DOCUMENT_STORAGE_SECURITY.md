# Applicant document storage

New applicant uploads and replacements are stored on Laravel's `local` disk
under `storage/app/private/documents`. File downloads go through the existing
authenticated applicant, assigned staff, or administrator API routes. The
controller checks ownership/assignment before streaming and sends private,
non-cacheable attachment responses.

The 23 existing document files were copied to the private disk with their
relative `file_path` values preserved. Each file was SHA-256 verified against
an out-of-webroot backup and the private copy before the public copy was
removed. The database rows and API response contract were unchanged. The
download controller retains a public-disk fallback for older deployments
whose rows may still refer to files not yet copied. The Laravel
`public/.htaccess` also denies direct `/storage/documents/...` requests on
Apache while leaving other public storage files unchanged.

## Deployment requirements

- On Apache, keep `mod_rewrite` enabled and allow the project's `public/.htaccess`
  rules to run. Confirm direct `/storage/documents/<file>` requests return 403.
- On Nginx or another server that does not honor `.htaccess`, add an equivalent
  deny rule for `/storage/documents/` before deploying. For example, in the
  site's server block: `location ^~ /storage/documents/ { deny all; }`.
- Do not serve the public storage symlink from a server configuration that
  bypasses these access rules. This includes local PHP servers that directly
  serve symlinked files; use Apache with the included rule or configure an
  equivalent deny rule.

## Upload failure handling (2026-10-18)

New uploads and replacements check storage success before writing metadata.
Document metadata and history are committed in one database transaction. If a
database/history write fails, only the newly generated private file is removed;
the original exception is propagated for normal error logging. Cleanup failures
are logged as well.

Rejected-document replacement rechecks ownership and review status under a row
lock. The prior file is retained on both successful and failed replacements.
Any cleanup of retained historical files needs a separately authorized retention
process; this change does not delete or migrate existing uploads. The existing
explicit document-delete endpoint keeps its prior behavior.

## Legacy file migration

No existing uploads were moved or removed by this change. To fully remove
legacy public-disk copies, first make and verify an out-of-webroot backup,
copy each referenced file to the private disk preserving its relative
`file_path`, verify file counts and hashes, test authenticated access for
applicant/staff/admin accounts, then remove public copies only after an
authorized operator signs off. Keep the static deny rule in place throughout
and after migration. The database contract does not need to change because
the relative `file_path` remains the same.
