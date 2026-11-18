# Changelog

## 2026-05-25 — Reliability Hardening For Copy/Create/Metadata/Progress

### Auth and session integrity
- Hardened backend auth interception so a cryptographically valid token is accepted only if the referenced user still exists.
- Stale/deleted-user sessions now fail fast with `401 Session no longer valid. Please sign in again.` instead of failing later inside sheet actions.
- Added frontend centralized `401` recovery in the API client:
  - clears stale local session keys,
  - redirects to `/login?next=<current-path>`,
  - avoids misleading downstream errors like `User not found` during create/copy/update flows.

### Public copy and sheet creation reliability
- Improved public copy source resolution to prioritize real source sheet ids, with safe fallback behavior for shared routes.
- Public copy now preserves source description along with copied content/title metadata.
- Owner-scoped duplicate title suffixing remains deterministic (`(1)`, `(2)`, ...).
- `/mysheets` create flow and public-sheet copy flow were revalidated with real-browser scenarios to ensure stable navigation into the editor.

### Metadata source-of-truth fixes
- Sheet list helper now upserts missing entries instead of skipping updates when direct editor routes are opened before list hydration.
- Sheet visibility normalization now backfills `title` from legacy `name` fields so metadata drawers and slug resolution remain consistent.
- Fixed slug route resolution to use `title` first and fallback to `name`, removing false `untitled-sheet` routing edge-cases.
- Metadata drawer edit/save flows were validated with direct-url editor loads and hard refresh persistence.

### Progress persistence validation
- Revalidated attempt logging and progress persistence through save/reload cycles:
  - question attempt bars preserve red/yellow/green attempt segments,
  - final-status rollups for subtopic/topic remain solved-only when all child questions are solved,
  - persisted payload round-trips maintain `attemptLogs` and completion state.

### Tests added/updated
- Added backend auth interceptor tests for:
  - valid token + existing user,
  - valid token + deleted user,
  - invalid token without repository lookup.
- Extended backend sheet service tests for copy description preservation and owner duplicate suffixing.
- Updated web MVC controller tests for new interceptor dependency wiring.
- Added frontend API client tests to assert stale-auth clearing on `401` responses.

## 2026-05-19 — Coding Profiles Dashboard

### Platform profile system
- Replaced the temporary `/add_accounts` checker with a persisted coding profiles dashboard.
- Added platform username connection, verification-code generation, strict public proof checking, profile removal, and full verified-profile sync.
- Cached synced platform snapshots on the user document so repeat visits read from MongoDB instead of platform APIs.
- Added sync timing metadata and a frontend progress bar that accounts for measured API time plus a short finishing buffer.
- Added support for all requested platform entries: LeetCode, Codeforces, CodeChef, AtCoder, HackerRank, HackerEarth, Topcoder, SPOJ, Kattis, CSES, Codewars, Exercism, CodeSignal, CodinGame, DMOJ, and GitHub.
- Kept CSES and other unreadable-proof cases strict: profiles stay pending or failed if the verification code cannot be read publicly.

### Public profile stats
- Added verified coding stats into public and viewer profile payloads.
- Added a public "Coding Stats" tab with aggregate solved/activity totals, activity heatmap, difficulty split, rating trend, and platform cards.
- Added a compact coding stats panel to the signed-in profile page.

### Docs
- Documented platform profile endpoints, verification behavior, supported sync sources, and public stats visibility in `README.md` and `API_WORKING.MD`.

## 2026-05-18 — Local UI/UX Testing And Polish

### Runtime tested
- Frontend tested on alternate port `http://127.0.0.1:5174`.
- Backend tested on alternate port `http://127.0.0.1:8091`.
- Verified CORS preflight from frontend port `5174` to backend port `8091` returns `200 OK`.

### UI/UX changes
- Simplified the logged-in `/home` first screen so users see one clear product message, two primary choices, and a three-step sheet workflow instead of empty notification/revision panels.
- Moved revisions and reminders into a conditional "Needs attention" section that only appears when there is something actionable.
- Reordered `/home` around the product's real USP: creating, copying, practicing, and sharing sheets.
- Added a quiet bottom-of-page visual slider with four small repeating roadmap images so the homepage has motion without overwhelming the first screen.
- Reworked profile sheet `Manage` actions into a controlled inline panel so opening one sheet's actions no longer covers or blocks the next sheet's `Manage` button.
- The profile sheet action panel now allows only one open menu at a time and closes on outside click or Escape.
- Adjusted the home promo banner sizing to avoid horizontal overflow across mobile, tablet, and laptop layouts.
- Tightened app shell content columns with `min-width: 0` so nested page content cannot force the layout off-screen.
- Fixed the mobile app shell so the collapsed desktop sidebar no longer appears on phone-width screens.
- Added a proper mobile hamburger + drawer navigation pattern with backdrop layering above the sticky topbar.
- Simplified the default sidebar rail while keeping every action reachable as an icon when collapsed.
- Simplified the profile sheets area:
  - Replaced multiple filter buttons with compact `Show` and `Sort` selects.
  - Kept primary action visible as `Open`.
  - Moved sheet management actions behind a `Manage` disclosure.
  - Removed the duplicate engagement card because those stats already appear in the profile summary.
- Updated the theme switcher icon treatment so character images render as circular avatar-style controls.
- Kept the topbar calmer on mobile by hiding the theme switcher from the narrow topbar.
- Styled the lotus premium marker as a small circular account badge beside profile names, closer to LinkedIn-style premium indicators.
- Documented the local smoke-test login: username `test123`, password `test@123`.
- Browser-verified `/profile/test123` after the badge update; the premium marker renders as an `18px` circular badge beside the profile name.
- Corrected the collapsed desktop/laptop sidebar so all sidebar actions remain visible as icons while only text labels collapse.

### Google OAuth local development behavior
- Added frontend support for `VITE_GOOGLE_AUTH_ALLOWED_ORIGINS` / `VITE_APP_AUTH_GOOGLE_ALLOWED_ORIGINS`.
- On local origins such as `http://127.0.0.1:5174`, Google sign-in is paused unless the current origin is explicitly allowed.
- The login page now shows a friendly local-development note instead of sending users into Google's scary `Error 400: origin_mismatch` screen.

### Test and build support
- Added a defensive in-memory `localStorage` / `sessionStorage` mock in `src/test/setupTests.js` so Vitest has the storage methods expected by the app.
- `npm run test` passes: 12 test files, 49 tests.
- `npm run build` passes.
- Focused ESLint checks for the touched JS files pass.

### Known remaining issue
- Full `npm run lint` still reports project-wide pre-existing issues unrelated to this UI pass, including test globals, several React hook rules, and generated/service-worker globals.
