# EduPath defense rehearsal — October 25, 2026

Prepared October 24, 2026, Asia/Manila. Automated checks and API rehearsal passed. The final physical-device and signed-in browser walkthrough still needs the presenter.

## Verified results

| Check | Actual result |
| --- | --- |
| Full Laravel suite | 227 passed; 1,828 assertions |
| Full active-source web lint | Passed |
| Latest web build and frontend suite | Passed; 70 frontend tests in the preceding unchanged-source verification |
| Full Flutter suite | 156 passed; one live-API test initially skipped because no URL was configured |
| Explicit mobile live-API connection suite | Five passed against http://10.1.77.133:8000/api, including the previously skipped live check |
| Native MySQL concurrent submissions | Passed: one accepted, one conflict, one application and history |
| Complete native API rehearsal | Passed with fictional records in a disposable database cloned from the current schema |
| Web/API connectivity | Both return HTTP 200; listen on 0.0.0.0; API reachable through the current Wi-Fi address |
| Direct public document access | Disposable canary denied with HTTP 403 and removed afterward |
| Database and migrations | Available and current |
| Document references | Zero missing referenced admission files at audit time |
| Admission availability | One open period now and on the stated defense date; seven active programs |
| Backup | SQL restoration, restored table counts, MySQL row locking and storage checksums passed |

The isolated API rehearsal covered Admin/Staff/Applicant authentication, staff setup, admission submission, duplicate prevention, document rejection and replacement, verification, admission approval, structured scholarship submission with private attachment, scoped staff review, scholarship approval, exam eligibility, 100 distinct persisted questions, answer-key privacy, answer saving and refresh, early submission, hidden unreleased grading, official result release, in-app notifications, explicit administrator retake authorization, and server expiration. Scholarship award status remained undecided throughout. No source records, source exam settings or external message recipients were modified by this rehearsal.

## Private artifacts

- Verified backup folder: `backend/storage/app/edupath-backups/20261023-215821-Ig8gSVRu/`. The name uses the server's UTC timestamp; it was created October 24 in Philippine time. Contains database.sql, storage.zip and manifest.json.
- Final API rehearsal output: `backend/storage/app/private/defense-rehearsal-api.txt`.
- Duplicate review cases: `backend/storage/app/private/defense-duplicate-review.json`.
- Registered routes: `backend/storage/app/private/defense-route-list.json`.
- Read-only configuration audit: `backend/storage/defense-readiness-audit.php`.
- Repeatable isolated API probe: `backend/tests/native/defense-rehearsal.php`.

Keep these private artifacts off the projector and out of public hosting. A backup existing is different from a restore being verified; this backup was restored into a disposable database and verified.

## Known conditions to address before presenting

1. **Use a fresh fictional demo applicant.** The three currently eligible accounts have no clean unused attempt at audit time; two have in-progress records. Register and rehearse a clearly labelled demo applicant through the normal interface. Do not delete attempts or reset timers. If reusing an account, an overdue attempt should be finalized by normal applicant access, then an administrator can explicitly authorize a retake with a reason where permitted. No retake was granted to a live applicant by these checks.
2. **One historical duplicate admission group remains.** Three admissions for one applicant in the same period are approved, and two contain documents. The private case report identifies them. No record was withdrawn, rejected, merged or deleted. An authorized decision-maker must choose the correct admission before any correction; use a fresh demo account to avoid changing historical decisions during the presentation.
3. **Keep and explain the chosen demo timing.** The user explicitly requested keeping the existing timer. It was 15 seconds/question at audit time: 100 questions have a nominal duration of 25 minutes. Existing attempts keep their own saved timing. The strict operational check still flags a non-60-second timer; it was not weakened to hide this difference.
4. **Question content includes demonstration material.** Ten active questions carry sample/test source labels. Explain that this is demonstration content, not a claim that the bank is institution-approved production content.
5. **No physical phone/emulator was connected.** Flutter detected Windows, Chrome and Edge only. Laptop-to-Wi-Fi-address connectivity passed, but that does not prove that a phone on the presentation network can reach the laptop.
6. **Live email/push and scheduler execution remain unverified.** Credentials are present and the push backlog was zero. In-app notification delivery passed the API rehearsal. Do not promise email/device push delivery until tested to a controlled recipient/device.
7. **No browser was connected to the automation tool.** The API rehearsal and Flutter widget tests are evidence of behavior, not a claim that the presenter has completed the final visual walkthrough or recorded a video.

## Start the demo

Keep the laptop plugged in. Start the database service actually used by the project. Do not start a second database/server instance if it is already running.

Backend terminal:

```powershell
cd C:\xampp\htdocs\G5_Edupath\backend
php artisan serve --host=0.0.0.0 --port=8000
```

Web terminal:

```powershell
cd C:\xampp\htdocs\G5_Edupath\frontend
npm run dev -- --host 0.0.0.0
```

For scheduled notification delivery, in a separate backend terminal:

```powershell
php artisan schedule:work
```

The scheduler can send configured queued notifications; start it only when those deliveries are intended. It was not started automatically during this audit.

Open the web at `http://localhost:5173`. For a phone, use its EduPath Server Configuration and Test Connection & Save with `http://10.1.77.133:8000/api`, provided that remains the laptop's Wi-Fi IPv4 address. Recheck `ipconfig` after changing networks. Never use `localhost` or `0.0.0.0` as the physical phone's server URL. Both devices must be on a network that permits communication; do not disable the firewall to conceal a connection issue.

```powershell
cd C:\Users\oseas\StudioProjects\edupath_mobile
flutter devices
flutter run
```

If only Windows/Chrome/Edge appear, a physical Android device has not been detected. Connect an authorized device through the normal USB/debugging setup or use the installed app and test the server connection. Hot-restart Flutter after the recent form changes.

## Rehearse the presentation in this order

Use clearly marked fictional information and documents. Choose your passwords privately. Example-domain addresses cannot receive real password-reset mail; email demonstrations need a controlled address with delivery tested first.

| Role | Demonstration | What the panel should see |
| --- | --- | --- |
| Applicant | Register/sign in; choose an active program and submit admission | One pending application; duplicate submission blocked |
| Applicant | Upload the configured admission requirements | Private files and pending review status |
| Assigned Staff | Reject one sample document with clear feedback | Rejected status and reason visible to its owner |
| Applicant | Re-upload that document | Same requirement returns to pending; document opens correctly |
| Staff then Admin | Verify documents; administrator approves admission | Correct role controls and synchronized statuses |
| Applicant | Open Governor's Scholarship Program (Demo), complete the form, Review, Back to edit, Submit | Context first, deliberate selections, accurate household size, retained draft and private attachment |
| Assigned Staff then Admin | Review applicant answers and make the appropriate approved eligibility decision | Applicant answers separate from staff/reviewer remarks; final award remains separate |
| Applicant | Open Online Examination and start one attempt | Instructions, 100-question progress, chosen timer, saved answer after refresh |
| Applicant | Answer a few sample questions and submit early | A completed attempt; unanswered questions count as zero; no score shown before release |
| Admin then Applicant | Release the official result, then reopen it as applicant | Released score and remarks; notification; no automatic scholarship award |
| Admin/Applicant | Show the existing scheduled entrance-exam module separately | Dates, venues and scheduled result-release controls are distinct from the online exam |

Early submission is supported, so the panel need not wait 25 minutes. Explain that answering only a few questions naturally produces a low score; never change the score or answer key to make the demo appear to pass. If showing question editing, explain why used questions are locked and demonstrate an editable copy. Save a valid replacement before deactivating an original so at least 100 eligible active questions remain.

## Fallback and recovery

- Record a short screen capture after the live walkthrough succeeds. Capture the document rejection/re-upload, scholarship Review step, exam refresh, and official result release. No recording was produced by this audit.
- Prepare screenshots with fictional accounts and redact applicant personal data, credentials, tokens and unreleased results.
- Keep backend/web terminals running and prevent the laptop from sleeping during the presentation.
- If the phone connection fails, first check the current Wi-Fi IP and open `/api/programs` from the phone browser. Use the working laptop web app as a disclosed fallback.
- If an account is blocked by an already-used attempt, use the normal authorized retake process or another prepared fictional account. Do not delete historical attempts.
- If a serious failure requires recovery, stop writes and restore the verified backup into a separate database first. Verify it before any switch. Do not import over the live database or run migrate:fresh during the defense.

## Readiness decision

Automated behavior, cross-role API flow, native MySQL concurrency, network listening and backup restoration passed. A controlled demonstration is technically supported. Final go/no-go still depends on a successful signed-in browser/phone rehearsal with the selected demo account and any email/push delivery the presenter plans to demonstrate. Freeze new features and address only rehearsal-blocking defects.
