# EduPath mobile guide tour — visual and interaction specification

Design proposal • 20 October 2026 • Flutter mobile application

## Direction

A friendly TMC student helps applicants learn six useful places in EduPath. Pair a calm, readable speech card with a clear gold spotlight. Let the character carry warmth; let the interface carry clarity.

The inspected application has six feature steps plus a welcome step and a completion step. Show six progress segments for Profile, Programs, Admission, Documents, Scholarships, and Notifications. Welcome and completion are unnumbered bookends. Keep the existing saved step IDs and account-scoped progress when implementing; changing the persisted sequence would require a compatible tutorial version. This document is a design handoff, not an implemented app update.

The interactive preview uses the current character artwork as a continuity reference. The revised character art described below remains a separate production asset deliverable. Preview content represents layout, not an applicant's records.

## 1. UI layout specifications

### Shared visual system

| Element | Specification |
|---|---|
| Reference frame | 390 × 844 logical pixels; responsive from 320px wide and in landscape. All dimensions below are Flutter logical pixels. |
| Identity | Academic navy `#123B5D`, deep navy `#091827`, academic gold `#F4B400`; use existing AppTheme tokens. Keep the Login screen's font family, background identity, rounded controls, and generous spacing. |
| Context | The live hub remains behind the overlay. Keep the campus background on Login and the welcome carousel; the interactive tour should show the actual page the student is learning. |
| Overlay | Deep navy tint at 72% in Light Mode, 80% in Dark Mode. Optional backdrop blur sigma 6 outside the spotlight; the highlighted area remains sharp. Use one clipped blur layer and an opaque tint fallback for low-performance or reduced-transparency configurations. |
| Spotlight | Target bounds + 8px padding, with a corner radius matching the control plus 4px, maximum 20px. Gold 2px stroke, 8px soft inner halo at 28% opacity, 20px outer halo at 14%. Keep the crisp line visible when glow is disabled. |
| Speech card | Floating card, maximum width 420px, 16px minimum screen inset, 20px content padding, 24px corners. Leave at least 24px between the target/halo and the entire card/character silhouette. |
| Character | 96px wide, up to 128px tall, preserving the full silhouette with contain fit. Overlap the card by 20px. Reserve the occupied corner so neither text nor controls run beneath the character. Reduce to 64–72px on narrow or large-text layouts. |
| Speech tail | Small 10 × 12px rounded tail pointing toward the character's shoulder, not toward the UI target. Place the tail on the occupied corner; remove it in the compact accessibility layout. The character's gesture connects the card to the target. |
| Category badge | Sentence case, 12px medium/semibold: “Step 3 of 6 • Admissions.” Use navy text on a pale gold fill in Light Mode and gold text on a muted navy fill in Dark Mode. Allow wrapping. |
| Typography | Existing platform sans-serif. Title 22px / 28px, weight 700. Body 16px / 24px, weight 400. Utility labels 14px / 20px, weight 600. Follow system text scaling without truncating instructions. |
| Progress | Six equal segments, 4px high, 6px gaps. Completed/current segments gold; future segments muted. Current segment gets a small stationary marker and the spoken step label so progress is not conveyed only through color. |
| Actions | 48px minimum touch areas; primary button at least 52px tall, 14px radius, gold fill and navy label. Back is a navy text action in Light Mode, light text in Dark Mode. Hide Back on the first step. Skip sits at the card's top right, outside the character's reserved corner. |

Use navy text on gold primary buttons. Do not use gold for small text on white. Validate normal text at 4.5:1 contrast and meaningful focus/target boundaries at 3:1 against their adjacent surfaces in both appearances.

### Light Mode wireframe

1. Keep the app's existing navy app bar and light page surface behind the tinted overlay.
2. Reveal the active target at its real position. A crisp gold outline and restrained glow identify it.
3. Float a white speech card on the opposite side of the target. Use a navy shadow at 14% opacity, blur 28px, offset (0, 12). A subtle cool border separates it from both the dim background and gold halo.
4. Anchor the character to the card corner, with clear separation from Skip. Reserve the top corner for the silhouette before placing content.
5. Card reading order: category badge and Skip → six-segment progress → action title → two short sentences → Back and gold Next.
6. On the last feature step, the primary label is “Start Exploring.” Celebration occurs after completion is successfully saved.

### Dark Mode wireframe

Keep identical positions and reading order. Use frosted deep navy acrylic: `#102333` at approximately 94% opacity, with sigma 12 blur clipped to the card, and a 1px light border at 12% opacity. Use `#F1F5F9` for titles and `#B4C2D1` for body text. Keep gold buttons and navy labels unchanged. Use the same 2px target stroke with a smaller 16px outer glow so it stays soft rather than glaring. An opaque `#102333` card is the fallback when blur is unavailable.

### Placement and responsive rules

- Prefer bottom placement for targets in the upper half, and top placement for targets in the lower half. Center horizontally; clamp to safe-area insets. “Top” starts 16px below the app bar; “bottom” sits 16px above the bottom navigation or system gesture area.
- Measure after navigation/layout settles. Move or scroll the target into view before positioning the card. Never use guessed screen coordinates in production.
- A character, tail, or glow must not cover the target, Skip, system back gesture, or navigation controls.
- If the opposing side cannot fit the measured card, reduce the character first. If still insufficient, use a compact, docked instruction sheet with a visible hub label and omit the spotlight rather than overlap the target. Only card content may scroll; keep primary actions visible. With screen-reader focus, bring every focused control into view.
- At 200% text scale and short landscape heights, move the character beside the category label, remove the speech tail, let buttons stack, and expand the card vertically. Do not shrink body copy or lock a fixed card height.

## 2. Character direction and interaction map

### Revised art direction

Retain the TMC student, recognizable uniform, navy trim, gold sleeve accent, college crest, and ID. Use clean, rounded line art with soft two-tone shading, a consistent warm skin palette, and restrained depth. The aim is an approachable student peer. Keep the silhouette readable at 64px; avoid oversized expressions, intricate decorative backgrounds, and exaggerated facial proportions.

Produce the four master states below on a consistent transparent canvas, with matching face, scale, baseline, and lighting. Use a vector master where practical and export sharp 2×/3× transparent assets for Flutter. Directional variants must be drawn intentionally; do not mirror the crest, name badge, or lettering.

| State | Gesture and purpose | Required variants |
|---|---|---|
| Welcoming | Relaxed wave, open posture, friendly smile. Creates reassurance. | Neutral wave. |
| Explaining | Holds a small stylus; free hand presents the feature. Calm attentive expression. | Present up-left and up-right. |
| Pointing | One clear arm gesture aimed toward the spotlight; the face remains oriented toward the student. | Point up-left and down-right for the placements below; opposite directions for layout collision fallbacks. |
| Celebrating | Thumbs-up and a small diploma; brief, subtle confetti around the card. | Neutral celebration. |

### Exact default placement for each hub

Placements below assume the standard portrait frame. Apply the collision rules above at other sizes. The existing `TutorialTarget` IDs currently wrap page titles; most proposed meaningful-content anchors must be added during implementation. Do not imply those anchors already exist.

| Step | Spotlight anchor and empty-state fallback | Character pose and anchor | Speech card and tail |
|---|---|---|---|
| 1 · Profile | Personal/educational details summary on My Profile. Fall back to the existing `profile` title. The existing `profile-nav` target can be a navigation substate within the same step. | Welcoming wave, upper-left corner of card, 20px overlap. | Bottom, above navigation. Tail on upper-left edge pointing toward the guide's shoulder. |
| 2 · Programs | First available program card, including its label/details affordance. Fall back to the existing `programs` title when the list is empty. | Explaining/present up-right, upper-left corner. | Bottom. Tail upper-left. The program card remains fully visible above the guide. |
| 3 · Admissions | Current application's status badge and adjacent review summary in the first application card. Fall back to the existing `admission` title for applicants with no application. | Point up-left, upper-right corner. | Bottom. Tail upper-right. Keep Skip in the top-right utility row below the character's reserved overlap. |
| 4 · Documents | The existing Upload Document floating action button. If absent or unavailable, highlight the My Documents title (`documents`). | Point down-right, lower-right corner. | Top, below app bar. Tail lower-right. Guide and card stay above and left of the upload action with at least 24px clear space. |
| 5 · Scholarships | Existing scholarship search field and provider/title hint. Fall back to the existing `scholarships` title if unavailable. | Explaining/present up-right, upper-left corner. | Bottom. Tail upper-left. Keep search and its label sharp and visible; do not open the keyboard during the tour. |
| 6 · Notifications | Personal/Announcements tabs and unread summary; never open an individual notice automatically. Fall back to the existing `notifications` title. | Welcoming wave, upper-left corner while explaining; switch to Celebrating in the same anchor after successful completion. | Bottom. Tail upper-left. Six filled segments; gold “Start Exploring” action. |

Programs currently has a browsing list and program details, but no search field. Its tutorial should describe browsing and choosing. If search is implemented separately later, the anchor may move to the search control without changing the tour's purpose.

### Interaction boundaries

The glow pulses to invite attention, while the actual control stays still. Allow safe navigation, such as opening Profile, through a deliberately scoped callback. For controls that would upload, submit, apply, change fields, mark messages read, or start an examination, intercept the tour tap and present an informational acknowledgement: “This is where you'll do that when you're ready.” The ordinary workflow resumes after the tour. No live action is required to advance. Back and Next navigate only the tour and relevant read-only hub screens.

## 3. Micro-interaction and animation plan

| Event | Motion and timing | Interaction rule |
|---|---|---|
| Open tour | Backdrop opacity 0 → target over 180ms, easeOut. Card fades/slides up 12px over 240ms, easeOutCubic. Character follows 60ms later, fades and rises 8px over 280ms, easeOutCubic. | Set semantic focus on the step heading when the card is ready; background controls are excluded from focus except a specifically allowed target. |
| Spotlight arrival | Bounds interpolate from previous target over 220ms, easeInOutCubic, only within the same screen. Fade out 100ms/reappear 160ms on route changes. | Never animate a hole across unrelated pages or briefly expose another actionable area. |
| Attention pulse | Two 1,800ms cycles, easeInOutSine. Halo opacity 14% → 28% → 14%; outer halo scale 1 → 1.025 → 1. The 2px stroke and real UI element stay fixed. | Stop on first interaction; do not loop indefinitely or flash. |
| Next / Back | Current card copy exits over 100ms; incoming copy enters over 180ms with 6px directional movement. Crossfade pose over 180ms. Fill the next progress segment over 200ms. | Disable duplicate taps until route/target readiness and save state are resolved. No automatic step advance. |
| Primary button press | Scale 1 → 0.97 in 80ms, then 1.015 in 110ms, settle at 1 in 90ms. Use easeOutCubic for the release. Optional single light selection haptic, respecting system settings. | Use scale only, leaving the layout/tap rectangle stable. No sound. |
| Tap an explanatory target | Single 160ms halo acknowledgement; an inline hint fades in over 120ms and stays until Next. | Do not forward the tap to a mutating action. |
| Skip | Persist skipped state first. Close card and tint over 160ms, then show a 4,000ms snackbar: “You can review this tour anytime in Settings.” Optional “Open Settings” action. | No blocking confirmation dialog. If saving fails, remain on the tour and show a retryable inline error. Snackbar is announced politely and respects assistive timeout preferences. |
| Finish | Step 6 starts with “Start Exploring.” On tap show “Saving…” and keep the primary action disabled. After save succeeds, crossfade to celebration for 180ms, emit one 600ms confetti burst, then fade the overlay out over 180ms. | Return to the current Notifications hub; no unsolicited navigation. Confetti cannot intercept touches or delay access beyond the short acknowledgement. |
| Resume | Restore the saved hub and focus its step heading. Use a simple 150ms fade rather than replaying the full entrance. | Pause when the app backgrounds; restore safely after layout. Keep existing examination exclusions. |

Use no text typing effect: the entire message appears at once. Decorative particles are limited to approximately eight small gold/teal pieces, remain within the card area, and are excluded from semantics.

### Accessibility and performance

- With reduced motion, remove bounce, slides, glow cycling, and confetti. Use static gold borders and an optional 80ms opacity change. Character pose changes instantly.
- Respect reduced transparency when supported; substitute opaque cards and a solid dim layer. Cache guide assets and repaint only the halo while animating. Avoid repeated full-screen blur recalculation.
- Screen-reader announcement: “Step 3 of 6. Admissions. Know where you stand.” Read body copy once after the title. Do not announce pulse frames or each progress segment separately.
- Keep logical focus order: category/title → body → allowed target/help action → Back → Next → Skip. Restore focus to the underlying hub when exiting. Treat system Back as pause/resume; treat Skip as an explicit skipped state.
- On slow navigation, show “Opening [hub]…” without presenting a wrong spotlight. If a target cannot be found, offer Retry and Continue without highlight. If progress cannot save, show “We couldn't save your tour progress. Please try again.” Keep a visible recovery action and never display completion prematurely.

## 4. Refined six-step dialogue

Keep one title and no more than two short sentences per step. Put detailed admission, scholarship, examination, and upload policies on their actual feature pages.

| Step / badge | Title | Spoken-style body copy | Primary action |
|---|---|---|---|
| Step 1 of 6 • Profile | Make EduPath yours | “Your personal and school details live here. Keeping them accurate helps the college review your applications.” | Next |
| Step 2 of 6 • Programs | Find a program that fits | “Explore TMC's programs and open the details to learn more. Choose the one you'd like to apply for when you're ready.” | Next |
| Step 3 of 6 • Admissions | Know where you stand | “Follow your admission application's status here. Check the details for review feedback and any next steps.” | Next |
| Step 4 of 6 • Documents | Keep your requirements together | “Upload your required documents here when you're ready. Check their review status and any feedback from the college.” | Next |
| Step 5 of 6 • Scholarships | Explore support for your studies | “Browse scholarships and check each one's requirements and dates. Applying is a separate step, so take time to find what fits.” | Next |
| Step 6 of 6 • Updates | Stay in the loop | “Check here for application updates and college announcements. You're ready to explore—and this tour is always in Settings.” | Start Exploring |

### State-specific copy

- Welcome invitation, unnumbered: **“A little guidance goes a long way.”** / “I'll show you six useful places in EduPath. You can look around without submitting anything.” Actions: **Show me around**, **Later**.
- Admissions with no applications: **“Your admission journey starts here.”** / “When you apply, your status and review feedback will appear here. You can explore the tour before submitting an application.”
- Programs with no available records: **“Programs will appear here.”** / “You'll find the college's available programs in this section. You can continue the tour while the list is empty.”
- Documents target tap: “This opens uploads when you're ready. You don't need to upload anything for the tour.”
- No notifications: “Your application updates and college announcements will appear here. Check back as your journey progresses.”
- Completion acknowledgement, unnumbered: **“You've got the map. Take the next step.”** / “Explore at your own pace. Your guide is always in Settings.”

## Handoff and acceptance criteria

Implement within the existing OnboardingHost, provider, route observer, tutorial target registration, shared theme, and guide asset structure. Preserve authentication, account isolation, existing APIs, saved revisions, pause/resume, examination restrictions, and all admission/scholarship actions. No database or backend changes are part of this visual proposal.

Before release, verify every target with populated, empty, error, loading, and disabled states. Check Light/Dark Mode; 320/390/430px widths; landscape; 200% text; screen reader order; reduced motion; keyboard appearance; orientation changes; first-run/resume/skip/finish; account switching; save errors; and a currently active exam. Confirm that no tutorial interaction submits an application, uploads a file, changes a form, marks a notification read, or starts an examination. Measure animation/blur performance on a modest Android device and enable the opaque fallback if needed.

Design validation in this task covers the specification and local preview only. Device usability, contrast measurements, actual navigation integration, new character asset production, and implementation regression tests remain release checks.

### Completed proposal checks

The preview script parsed successfully. Local handler/state checks exercised all six steps in both appearances, plus Next, Back, target hints, Skip, Replay, completion, and reduced-motion selection. All embedded character references resolved. The preview is approximately 250 KiB and makes no network requests.

Calculated opaque token-pair contrast: Light Mode body `#52677D` on white **5.84:1**; Dark Mode body `#B4C2D1` on `#102333` **8.84:1**; navy `#123B5D` on gold `#F4B400` buttons **6.29:1**; dark title `#F1F5F9` on `#102333` **14.63:1**. These checks cover those solid token pairs, not composited blur or every visual state.

No browser renderer was connected or installed for this preview. Browser layout, animation rendering, and physical-device behavior have not been verified. The current Flutter app, Laravel backend, and saved applicant data were not modified by this design task.
