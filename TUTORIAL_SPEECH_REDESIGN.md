# Interactive tutorial speech-bubble redesign

Implemented October 20, 2026, for the existing applicant tutorial on Flutter mobile and React web.

## Findings and result

- The character was inside a large outer card, alongside a second nested instruction box. On mobile it was only 56–76 logical pixels wide; on the web it was 65–100 pixels.
- A normal Next request replaced its label with `Saving…`. Highlight lookup displayed `Waiting…` and disabled Next until a target appeared.
- The new layout removes the outer card. Instructions appear in one rounded speech bubble with an illustrated tail toward the guide's head. The character stands separately beneath the bubble, beside the navigation controls.
- Character size is now 136 pixels on narrow screens and 160 pixels on regular screens, preserving the complete supplied illustration with contain fitting. A restrained gold/teal halo, ground shadow, and small sparkles provide depth without a frame around the character.
- Eight gold progress segments, navy/gold colors, theme-aware text and bubble surfaces, a yellow primary button, and stable Back/Skip controls complete the layout.
- Next, Open Profile, and Finish retain their labels while a request runs. Waiting text is removed. Missing targets do not block Next; the existing highlight retry remains available.
- Genuine progress errors are still shown. Controls remain disabled during outstanding writes, preventing duplicate requests; navigation advances only after acknowledged progress. Resume/restart, revision conflicts, account isolation, active-exam restrictions, and modal focus behavior are preserved.
- Closing copy now invites applicants to explore instead of describing a save operation.

## Files

Flutter project: `C:/Users/oseas/StudioProjects/edupath_mobile`.

- `lib/features/onboarding/tutorial_guide_panel.dart`: new speech bubble, tail painter, larger free-standing character, decoration, segmented progress, stable controls, theme support, and reduced-motion-aware entrance.
- `lib/features/onboarding/onboarding_host.dart`: integrates the new panel with existing spotlight geometry, scrolling, focus, routes, and progress callbacks; removes waiting-message state and loading-based Next blocking.
- `lib/features/onboarding/tutorial_steps.dart`: clearer closing dialogue.
- `test/onboarding_test.dart`: adds external-character placement, delayed-write label/duplicate protection, and missing-highlight navigation checks.
- `test/tutorial_guide_panel_test.dart`: light/dark layout checks at 390×844 and 320×568 with 1.8× text. Optional preview capture explicitly loads fonts and waits for the actual illustration.

Web:

- `frontend/src/onboarding/ApplicantTourOverlay.jsx`: one speech bubble, external character/footer, progress segments, gold primary action, stable labels, and image-load failure feedback.
- `frontend/src/onboarding/onboarding.css`: responsive layout, themes, tail, halo, shadows, press feedback, focus styles, and reduced-motion support.
- `frontend/src/onboarding/applicantTour.js`: clearer closing dialogue.

No providers, backend endpoints, authentication rules, database schema, or application/examination workflows were modified. Original mobile host, step copy, and tests plus the original web stylesheet are retained under `storage/tutorial-speech-redesign/before/`. Staging inputs are not the canonical Flutter files; the mobile project contains the final formatted sources.

## Verification executed

- Full Flutter `test --no-pub`: **115 passed, 1 skipped**. The existing optional live-server connection test was skipped because no live API URL define was supplied to this run.
- Flutter `analyze --no-pub`: **no issues found**.
- Four additional layout-preview cases passed with actual illustration and icon fonts loaded. Reviewed light/dark previews and the small large-text layout.
- `npm run lint`: passed.
- `node --test --test-isolation=none tests/*.test.mjs`: **52 passed**.
- `npm run build`: passed.
- Isolated headless Chrome checks at **1280×900 light**, **390×844 dark**, and **320×568 light** all passed. Each ran all eight tutorial steps, Profile navigation, delayed Next label stability, duplicate protection, an intentional request failure and retry, and completion. Images loaded, the guide was measured outside the bubble, and no React runtime error occurred.
- Browser requests used synthetic account/progress fixtures intercepted in a fresh context. No real credentials, database mutations, or existing browser profile were used.
- The browser's 320-pixel case also exercised larger tutorial text and verified reachable controls.
- An initial delayed-write assertion needed proper asynchronous transport scheduling, and the preview helper needed real asynchronous image/file capture. Both were corrected; the final suite passed.

No physical Android/iOS interaction was performed. Backend tests were not rerun for this UI-only change.

## Previews and replay

Previews are under `output/tutorial-preview/`:

- `tutorial-light-regular.png` and `tutorial-dark-regular.png`: actual Flutter panel renderings on a plain tutorial backdrop.
- `tutorial-light-small.png` and `tutorial-dark-small.png`: 320-pixel layouts at 1.8× text, scrolled to the controls.
- `web-tutorial-light-1280.png`, `web-tutorial-dark-390.png`, and `web-tutorial-light-320.png`: actual React UI with synthetic account data.
- `web-tutorial-small-large-text.png`: enlarged text and reachable controls.

Hot restart the Flutter app, then replay the existing tutorial from Settings. Refresh the web app and restart the tutorial from its existing Settings controls.

The repeatable browser verification script is `storage/tutorial-speech-redesign/verify-web.cjs`; it uses the locally available Playwright runtime and Chrome, and defaults to the running Vite server at `http://127.0.0.1:5173`.
