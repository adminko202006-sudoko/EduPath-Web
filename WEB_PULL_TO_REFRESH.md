# Web pull-to-refresh

Replaced routine Refresh buttons in the active web source tree with a shared control in the Admin, Staff, and Applicant layouts. The inactive `frontend/src/src/` tree was left untouched. Error recovery actions remain available.

At the very top of the content area, drag down with the left mouse button or swipe down with one finger. Release after the hint changes to “Release to refresh.” Keyboard users can focus the hint and press Enter.

The gesture uses the existing refresh bus rather than reloading the document. It preserves navigation and filters, waits for asynchronous page loaders, and prevents concurrent manual refreshes. Short, upward, horizontal, nested-scroll, form-control, and modal gestures do not trigger a refresh. Existing automatic updates continue working.

Connected Admin Reports, the examination overview, entrance-exam review records, and Settings preferences to the shared mechanism. Running online exams keep their existing server synchronization; manual refresh does not reload an active attempt. Unsaved notification preferences and existing guarded profile drafts are preserved.

Changed areas: shared refresh bus and hook; new PullToRefresh component and gesture helpers; three role layouts; role pages containing refresh actions; notification-preferences hook; user-guide instructions; refresh tests. No backend, authorization, database, or migration changes.

Verification: production build passed; full frontend lint passed; 85 frontend tests passed, including five new refresh tests. The final Settings integration was checked again with the refresh tests, lint, and production build. Initial sandbox executions of the build/test workers returned EPERM; the unrestricted reruns passed. Live mouse/touch browser interaction and authenticated API workflows were not exercised in this session.
