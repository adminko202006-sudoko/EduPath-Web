# EduPath school demo source uploaded - October 21, 2026

Both repositories now have the branch `edupath-school-demo-20261021`:

- Web/API: https://github.com/adminko202006-sudoko/EduPath-Web/tree/edupath-school-demo-20261021
  - Commit: `5c216b5a796f50569510408f7bbe405fccf1c831`
  - Based on the earlier `edupath-deployment-20261021` branch.
  - 436 current source files checksum-verified against the publication index.
  - 66 modifications, 40 additions, one environment-backup deletion.
- Mobile: https://github.com/adminko202006-sudoko/EduPath-Mobile/tree/edupath-school-demo-20261021
  - Commit: `8a2d7e33e0864fd11208aade3b19bb5b5b5e693f`
  - Based on the mobile repository's existing main branch.
  - 148 current source files checksum-verified against the publication index.
  - 52 modifications and 58 additions.

GitHub's branch references were verified against these exact commit IDs. No main
branch was merged or force-pushed. The original repositories were not switched or
reset. The web staged index fingerprint was preserved; mobile staging was empty.
Source publication used isolated checkouts under `output/`.

## Included updates

Current application workflows, error dialogs, examination integration, mobile
HTTPS configuration, the no-billing Cloudflare school-demo launcher, MySQL
Workbench-compatible instructions and source documentation are included.
`deployment/package-handoff.php` now includes the custom PHP router, launch
commands and current project documentation. The mobile README's pre-existing
merge-conflict markers were replaced with current setup and test instructions.

The source allowlist excludes new local environment files, service-account
credentials, uploads, database backups, installed dependencies, runtime directories,
browser profiles and audit backups. Existing tracked dependencies outside that
allowlist were preserved from the repository base. The mobile repository's already
tracked Firebase Android client configuration was not changed by this publication.
Line endings/trailing whitespace were normalized in publication copies only.

## Security finding

The web repository already tracked `backend/.env.backup-before-mysql`, containing
populated sensitive settings. It was removed from the new branch's current tree;
the local file was preserved. It remains in older Git history, including the
unchanged main branch. Rotate any still-active credentials from that backup.
This upload did not rewrite shared history or change live credentials.

The original web index already had 10,585 files staged before this work, including
generated/runtime and backup artifacts. Those staged files were left untouched.
Review that index before any later ordinary commit; ignore rules do not unstage
files that have already been added. The uploaded branches were built from a
separate reviewed index and do not include those extra additions.

## Checks run for publication

- SHA-256 source archive checks and staged Git object checks: passed for all 584
  selected files; no unreviewed additions or unexpected deletions.
- Secret-path/key-material checks and merge-marker checks: passed on selected
  source. A first path check incorrectly rejected the mobile source module
  `lib/core/storage`; narrowing the runtime-storage exclusion resolved it.
- Frontend tests against the publication copy: 70 passed.
- Frontend lint: passed.
- Frontend production build: passed (1,987 modules). The first sandboxed attempt
  hit Windows native-dependency/process restrictions; the unrestricted rerun passed.
- PHP syntax: passed for 204 backend source files.
- Committed whitespace, tree/index equality and Git object connectivity: passed.
- The most recent backend/mobile behavior results are in
  `free-demo-implementation.md`; those suites were not rerun for documentation and
  publication-only changes. No database changes, APK build, hosting provisioning or
  changes to the user's running demo tunnel were performed.

This report was written locally after uploading and is not part of the commit IDs
above. Select the new branch when browsing GitHub; the default main branch still
shows its earlier source.
