# Unified login

- Updated the active `frontend/src/pages/auth/Login.jsx` to remove the Staff/Admin portal selector, selected-role state, and post-authentication role mismatch check.
- Successful login redirects using the role returned by `/auth/login`: Admin, Staff, or Applicant dashboard. The button now reads `Sign In`, and the account-access note covers both staff and administrators.
- Existing backend authentication, role middleware, and protected routes remain in place. No database changes.
- Entry point verified: `index.html` -> `src/main.jsx` -> `App.jsx` -> `routes/AppRoutes.jsx` -> `pages/auth/Login.jsx`. The different nested `src/src/pages/auth/Login.jsx` copy is not imported by this route and was left untouched.
- Verification: ESLint for the active login file passed; production build passed; existing frontend suite passed (93 tests). Build and test workers required execution outside the sandbox after `spawn EPERM` failures. Interactive sign-ins were not performed.
- The free demo serves `output/demo-frontend`, separate from `frontend/dist`. Stop the original demo launcher with Ctrl+C and rerun `deployment/Start-FreeDemo.ps1` without `-SkipBuild` to publish this change to the demo. Re-running while it is active only prints its existing connection.
