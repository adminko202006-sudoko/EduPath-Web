# Error message dialogs — October 20, 2026

## Findings and scope

- Page-level error banners could appear behind application forms and editing dialogs.
- Error presentation varied across Admin, Staff, Applicant, authentication, and onboarding screens.
- Staff admission errors shared an informational banner with success messages.
- Applicant dashboard failures were stored in an unused state variable; individual rejected requests were silently omitted.
- The active tree is `frontend/src/`, reached through `index.html`, `main.jsx`, and `routes/AppRoutes.jsx`. The inactive, different `frontend/src/src/` tree was preserved.

## Changes

- `components/ui/ErrorDialogHost.jsx`: one centered error dialog above other forms, with a backdrop, scrollable content, dark/light styles, OK/close/Escape dismissal, and native form-validation messages.
- `components/ui/ErrorMessage.jsx`: routes existing error text and retry controls into the host. A View error details control allows reopening a dismissed message. Hidden cached routes do not publish dialogs.
- `services/errorDialogs.js`: queues different failures, acknowledges duplicate messages together, updates retry controls, and cleans up errors when source components unmount.
- `components/ui/ModalPortal.jsx`: adds priority so the error dialog retains keyboard focus and sits above ordinary dialogs. Reuses scroll locking, inert backgrounds, focus trapping, and restoration.
- `App.jsx`: mounts the host within authentication, routing, and theme contexts.
- `components/ui/Shared.jsx` and active page/component error banners: use the shared error presentation while preserving existing messages and retry handlers.
- Staff error browser alerts use `showErrorDialog`; success alerts retain their existing behavior.
- Staff admission and applicant dashboard errors now have explicit error presentation. Dashboard partial failures show a generic error without exposing server internals.
- Online examination action failures appear above the confirmation dialog while preserving the confirmation and underlying input.

No backend, database, permissions, or API contracts changed. Admission availability warnings remain informational.

## Verification

- Production build passed after running outside the sandbox (Vite child-process calls are blocked inside it).
- `npm run lint` passed.
- All 65 frontend tests passed using Node's `--test-isolation=none` because the sandbox blocks test-runner subprocesses; includes queue, duplicate acknowledgement, dismissal, reopening, cleanup, and subscription tests.
- Browser verification could not run: the Browser runtime reported no available browsers and returned an empty browser list. Actual positioning, keyboard behavior, and mobile appearance still require a connected browser.
