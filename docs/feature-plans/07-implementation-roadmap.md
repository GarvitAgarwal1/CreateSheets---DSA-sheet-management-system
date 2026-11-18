# Implementation Roadmap

## Phase 1: Fix Existing Core Features
- Stabilize frontend build/test/lint expectations.
- Stabilize backend Maven test environment and Java/Mockito compatibility.
- Document current API contracts for sheets, profiles, notifications, and platform stats.
- Fix package/file path inconsistencies in backend sheet module.
- Add missing privacy tests for public profile and public sheets.
- Add rate limits to auth and platform verification/sync endpoints.
- Verify `/add_accounts`, `/profile`, and `/profile/{username}` mobile layouts.

## Phase 2: Complete Core Tracking and Sheets
- Add typed sheet DTOs and schema versioning.
- Add compatibility mapper for existing `List<Map<String,Object>>` sheet content.
- Improve sheet editor modes and filters.
- Make attempt logs first-class or typed embedded data.
- Add quick attempt logging.
- Improve import preview and conflict handling.

## Phase 3: Add Analytics and Portfolio
- Build backend analytics read service.
- Add analytics snapshots if needed for performance.
- Replace duplicated client-only calculations gradually.
- Improve `CodingStatsPanel` consistency and public profile stats.
- Add portfolio sections and visibility controls.
- Add public profile preview and SEO polish.

## Phase 4: Add Platform Integrations
- Split platform connectors into separate classes.
- Add connector tests with mocked external responses.
- Add background sync and connector health.
- Move platform snapshot history out of `User` if history is needed.
- Add clearer unsupported/best-effort source messaging.
- Add contest/rating history where reliable sources exist.

## Phase 5: Add Collaboration and Social Features
- Build collaborator management UI.
- Build comments/activity timeline UI.
- Add team/classroom pages for existing backend team APIs.
- Add social notifications for follows/invites/comments.
- Add peer review workflow.
- Add fork graph and attribution UI.

## Phase 6: Add AI and Advanced Learning Tools
- Reframe current `AiSuggestionService` as heuristic recommendations.
- Add deterministic recommendation service using attempts, weak topics, revisions, and platform gaps.
- Add feedback capture.
- Add LLM provider only after analytics and privacy controls are stable.
- Add global search and recommendation surfaces.
- Add browser extension/import-from-URL after stable capture API exists.

## Phase 7: Add Production Hardening
- Harden auth/token lifecycle.
- Add structured logging and correlation ids.
- Add background jobs for notifications and platform sync.
- Add database indexes and migration strategy.
- Add environment variable examples and startup checks.
- Add production error monitoring plan.
- Add payment webhooks and subscription lifecycle if premium goes live.

## Recommended First 5 Tasks To Implement
1. Fix backend package/file path alignment and confirm Maven tests run in the target Java version.
2. Add typed sheet DTO/validation boundary while keeping compatibility with current sheet documents.
3. Add platform connector abstraction around current `PlatformStatsService`.
4. Add public profile privacy regression tests, especially verified-only coding stats.
5. Improve `/add_accounts` and `/profile/{username}` responsive QA with browser screenshots.

## High-Risk Tasks
- Changing sheet content schema without compatibility migration.
- Replacing auth/token behavior.
- Moving platform profile snapshots out of `User`.
- Adding background jobs without idempotency.
- Public profile payload changes.
- Payment lifecycle changes.
- Large UI rewrites across AppShell/Profile/SheetPage at once.

## Low-Risk Quick Wins
- Add docs and API contract examples.
- Add missing empty/loading/error states.
- Add platform connector status labels.
- Add clearer copy-code feedback component.
- Add mobile overflow fixes route by route.
- Add frontend tests for utility functions.
- Add indexes where safe and obvious.

## Tasks That Need External API Keys or Credentials
- Google OAuth production verification.
- Razorpay production payment flow.
- Email/SMTP delivery.
- Future LLM-powered AI.
- Future GitHub authenticated contribution graph.
- Browser push VAPID keys if real push delivery is added.
- Any paid/protected platform API.

## Tasks That Should Not Be Implemented Until Core Is Stable
- Browser/IDE extensions.
- Public leaderboards with rankings.
- LLM chat assistant.
- Complex peer review merge/apply workflow.
- Mobile native app.
- Real-time collaborative editing.
- Large marketplace of company kits.

## Final Suggested Order
1. Stabilize backend and tests.
2. Harden sheet schema and attempt logs.
3. Finish platform connector reliability.
4. Build backend analytics.
5. Polish profile and coding stats UI.
6. Productize collaboration/team UI.
7. Add company kits and contest tracking.
8. Add search/recommendations.
9. Add AI provider integration only after data and privacy are ready.
10. Add gamification/extensions after the core product is dependable.
