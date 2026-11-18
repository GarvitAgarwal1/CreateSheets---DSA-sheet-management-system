# UI/UX Improvement Plan

## Current UI/UX Status
- The app has a real application shell through `src/components/AppShell.jsx`, `Sidebar.jsx`, and `TopBar.jsx`.
- Design tokens exist in `src/styles/tokens.css`.
- Reusable UI components exist under `src/components/ui/`.
- Core pages are implemented: Home, Sheets, Profile, Public Profile, Import, Export, Notifications, Premium, Insights, Add Accounts.
- The current design has improved mobile sidebar behavior and profile action menus according to `CHANGELOG.md`.
- Coding stats dashboard exists in `src/components/CodingStatsPanel.jsx` and `/add_accounts`.

## Current Problems Found
- Visual language is inconsistent across older pages, profile pages, sheet editor, notifications, and coding stats.
- Some pages are information-dense and need stronger hierarchy.
- Several controls use symbols/emoji where consistent iconography would be clearer.
- Charts are not fully standardized.
- Collaboration/team backend functionality is not clearly exposed in UI.
- Mobile behavior needs repeated verification because sheet tables and dashboard cards can easily overflow.
- Empty/loading/error states are uneven across features.
- Theme system is powerful but may be too cinematic for professional study workflows unless carefully applied.

## Design Goals
The app should become:
- clean
- modern
- professional
- responsive
- simple
- user-friendly
- accessible

## Sidebar Improvement Plan
- Keep primary navigation grouped by user goal:
  - Practice
  - Discover
  - Profile
  - Productivity
  - Premium/Settings
- Keep collapsed desktop rail icon-only with tooltips.
- Keep mobile drawer with backdrop and large tap targets.
- Add active route indication that is visible in all themes.
- Avoid hiding important actions behind unclear icons.
- Future entries:
  - Teams
  - Leaderboards
  - Contests
  - Global Search

## Dashboard Improvement Plan
- Home should show the next best action:
  - Continue active sheet.
  - Due revisions.
  - Sync platform profiles.
  - Copy/create sheet.
- Avoid showing empty panels when the user has no data.
- Use a small number of high-signal cards.
- Add clear onboarding path for new users.

## Sheet Builder UI Plan
- Preserve power-user density but add modes:
  - Outline mode.
  - Table mode.
  - Focus mode.
- Make filters sticky and compact.
- Add quick-log attempt actions directly in rows/cards.
- Use consistent badges for difficulty, status, tags, revision due.
- On mobile, switch from table to stacked question cards.

## Analytics UI Plan
- Consolidate chart style and colors.
- Use overview first, drill-down second.
- Always show empty states like "Log attempts to unlock this chart."
- Keep chart legends readable and not dependent on hover only.
- Use same easy/medium/hard colors across app.

## Profile/Portfolio UI Plan
- Separate owner management page from public profile presentation.
- Public profile tabs:
  - Sheets
  - Coding Stats
  - Portfolio
  - Activity
- Add verified platform badges.
- Add profile preview button from owner profile.
- Keep copy/share/follow actions prominent.

## Forms and Modals Plan
- Standardize form labels, helper text, validation messages, and button placement.
- Modal rules:
  - clear title,
  - one primary action,
  - Escape closes where safe,
  - focus trap,
  - no content overflow on mobile.
- Use inline validation for username, URL, and required fields.

## Tables and Filters Plan
- Use consistent filter bars with search, status, sort, and clear.
- Avoid too many chip buttons when a select is clearer.
- Provide saved/default filters later.
- For mobile, use cards with visible primary action.

## Cards and Layout Plan
- Cards should represent repeated items or focused panels, not every page section.
- Avoid cards inside cards.
- Use 8px or project-standard radius consistently.
- Keep stable dimensions for charts, platform rails, and action buttons.
- Use responsive grid constraints to avoid overflow.

## Empty States Plan
- Every major page should have a useful empty state:
  - no sheets,
  - no public sheets,
  - no verified platforms,
  - no notifications,
  - no analytics data,
  - no team.
- Empty states should offer one clear next action.

## Loading States Plan
- Use skeletons for page sections.
- For sync actions, keep cached data visible and show progress separately.
- Avoid full-page spinners after first load when cached data exists.
- Show partial-loading states for charts.

## Error States Plan
- Errors should be user-safe and actionable.
- Add retry buttons where appropriate.
- Platform sync errors should name the platform and preserve old cached stats.
- Import errors should identify invalid rows/fields.

## Mobile Responsive Plan
- Verify these routes at phone/tablet/laptop widths:
  - `/home`
  - `/profile`
  - `/profile/{username}`
  - `/add_accounts`
  - `/mysheets/{sheetId}`
  - `/notifications`
  - `/public-sheets`
- Prefer horizontal scroll only for charts/heatmaps where unavoidable.
- Keep right sidebars under main content or hidden behind tabs on mobile.

## Accessibility Plan
- Add accessible names to icon-only buttons.
- Ensure color contrast for muted text in dark mode.
- Ensure keyboard navigation for sidebar, menus, modals, tabs, and sheet rows.
- Use semantic headings in page order.
- Add reduced-motion handling for animated elements.
- Do not rely only on color for status.

## Theme/Dark Mode Plan
- Keep existing theme context but simplify page-level overrides.
- Ensure all components use tokens instead of hardcoded colors where possible.
- Add high-contrast option.
- Test theme switching on profile, sheet, notifications, and coding stats.

## Component Reuse Plan
- Expand and consistently use `src/components/ui/`:
  - `SurfaceCard`
  - `StatCard`
  - `SectionHeader`
  - `EmptyState`
  - `ProgressBar`
  - `Skeleton`
- Add reusable:
  - `FilterBar`
  - `StatusBadge`
  - `ActionMenu`
  - `ChartPanel`
  - `CopyButton`
  - `PlatformBadge`

## Step-by-Step UI Cleanup Plan
1. Inventory reusable components and duplicate card/button styles.
2. Standardize button, badge, field, modal, and card classes.
3. Fix mobile overflow on sheet editor/profile/coding stats.
4. Normalize chart components and colors.
5. Add missing empty/loading/error states.
6. Improve profile public tabs and coding stats polish.
7. Add collaboration/team UI after backend permission gaps are addressed.
8. Run browser visual checks after each UI-heavy change.
