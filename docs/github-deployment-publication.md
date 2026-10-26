# EduPath GitHub source publication — October 21, 2026

Published the current web/API source to:

- Repository: https://github.com/adminko202006-sudoko/EduPath-Web
- Branch: `edupath-deployment-20261021`
- Commit: `1140a77a5e426625dd18d6a501d4bd62ab42c1d8`
- Compare: https://github.com/adminko202006-sudoko/EduPath-Web/compare/main...edupath-deployment-20261021

The branch contains 282 added/updated files and no deletions. It was prepared
in an isolated clone using the current source archive's allowlist and SHA-256
manifest. Existing tracked files outside that allowlist were preserved from
the repository base; dependencies should be installed from the lockfiles on
the hosting platform. Credentials, live environments, uploads, SQL backups,
installed dependencies, and temporary backups were excluded from the changes.
Trailing whitespace was cleaned in the isolated publication copy only.

Verified the remote deployment branch points to the commit above. Remote
`main` remains at `c3e3663dcbf1848adfbb11e44dec85b35c4fe9a0`. The original local
working tree, staged files, and branch were not changed by publication.

Verification:

- Source archive checksums verified before staging.
- Git object connectivity and committed whitespace checks passed.
- PHP syntax checks passed for the two PHP files receiving whitespace cleanup.
- All 69 frontend tests passed against the isolated publication copy, using the
  existing matching local frontend dependencies. An initial run without those
  dependencies failed to resolve React; the rerun passed after making the local
  dependencies available. Dependencies were not committed.
- The prior full application results are recorded in `deployment/verification.md`;
  the backend/mobile suites were not rerun for this publication-only operation.

The stale GitHub source blocker is resolved by selecting this branch in the
Railway-connected session. No Railway resources were created or changed, no
database was migrated, and no production endpoint or APK was generated. The
actual Railway plan/usage review, runtime configuration, live HTTPS acceptance,
and endpoint-specific APK build remain pending. Preserve the unrelated Public
HTML Page service.
