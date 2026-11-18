# Core Aggregation And Tracking Plan

## Multi-Platform Integration

### Current Status
Partially implemented.

### Existing Files Related To This Feature
- Frontend: `src/pages/AddAccountsPage.jsx`, `src/components/CodingStatsPanel.jsx`, `src/api/platformApi.js`.
- Backend: `backend/src/main/java/com/iqms/backend/controller/PlatformStatsController.java`, `backend/src/main/java/com/iqms/backend/service/PlatformProfileService.java`, `backend/src/main/java/com/iqms/backend/service/PlatformStatsService.java`, `backend/src/main/java/com/iqms/backend/model/ConnectedPlatformProfile.java`.
- Profile integration: `backend/src/main/java/com/iqms/backend/profile/ProfileController.java`, `backend/src/main/java/com/iqms/backend/profile/ProfileShareService.java`, `src/pages/ProfilePage.jsx`, `src/pages/SharedPage.jsx`.
- Docs: `README.md`, `API_WORKING.MD`, `CHANGELOG.md`.

### What Needs To Be Added
- Typed `PlatformStatsSnapshot` model instead of raw maps.
- Per-platform connector classes instead of one large `PlatformStatsService`.
- Connector health metadata: last success, last failure, failure reason, source type, rate-limit hint.
- Background sync job or queue so `/api/platform-stats/sync` does not depend on slow external calls in the request thread.
- Snapshot history collection if trend history should survive multiple syncs.
- Rate limiting and abuse prevention on verification and sync endpoints.
- Feature flags for best-effort scraping platforms.

### What Needs To Be Improved
- Split `PlatformStatsService` into maintainable connectors.
- Normalize stats fields across platforms.
- Add retry/backoff and timeouts per connector.
- Avoid embedding unlimited platform snapshots in `User`.
- Make unsupported platforms clearer: CSES should remain visible but unverified/unavailable.

### Frontend Plan
- Keep `/add_accounts` as the authenticated coding profiles dashboard.
- Add clear states: no profiles, pending verification, verified stale cache, sync failed, partially synced.
- Keep left platform rail, add page/card flow, fixed profile prefix + username input, verification instructions, copy-code button, verify button, sync button.
- Add connector status badges to platform cards.
- Show cached data immediately, then non-blocking sync progress.
- On public profile, show only verified platform snapshots in the "Coding Stats" tab.

### Backend Plan
- Keep endpoints under `/api/platform-stats`:
  - `GET /profiles`
  - `POST /verification`
  - `POST /profiles/{profileId}/verify`
  - `POST /sync`
  - `DELETE /profiles/{profileId}`
  - Optional admin/debug `GET /connectors/health`.
- Move connector logic into `platform/connectors/*` later:
  - `LeetCodeConnector`, `CodeforcesConnector`, `GitHubConnector`, etc.
- Add connector interface methods:
  - `fetchStats(username)`
  - `fetchVerificationText(username)`
  - `supportsStrictVerification()`
  - `sourceMetadata()`
- Store sync result and errors per profile.
- Enforce profile ownership for every mutation.

### Database Plan
- Current: embedded `platformProfiles` list on `User`.
- Later add:
  - `platform_profiles`: userId, platform, username, status, verificationCodeHash, proofTarget, profileUrl, createdAt, verifiedAt.
  - `platform_stat_snapshots`: profileId, userId, platform, stats, source, fetchedAt, durationMs, status.
- Indexes:
  - unique userId + platform + username
  - userId + verificationStatus
  - profileId + fetchedAt desc

### UI/UX Plan
- Professional dark dashboard matching current project style.
- Use compact cards, stable chart sizes, and no overlapping right rail.
- Copy-code button must show copied/error feedback.
- Verification instructions should be platform-specific and plain.
- External profile links open in a new tab.
- Sync should show measured-time progress without hiding cached data.

### Edge Cases
- Username empty, too long, URL pasted instead of username.
- Platform unavailable or rate-limited.
- Public profile cannot be scraped.
- Verification code not found or stale.
- User tries to sync with zero verified profiles.
- Partial sync success where one platform fails.
- Duplicate platform username.
- External API returns changed schema.

### Implementation Steps
- [ ] Freeze current API contract in docs.
- [ ] Add typed snapshot DTOs while preserving old raw-map payload compatibility.
- [ ] Add connector abstraction.
- [ ] Move current platform branches into connector classes one by one.
- [ ] Add per-connector timeout and error mapping.
- [ ] Add background sync or async job record.
- [ ] Update `/add_accounts` to show connector health and partial sync.
- [ ] Add tests for verification and aggregation.

### Testing Plan
- Unit test each connector with mocked HTTP responses.
- Backend test verification success/failure and strict CSES behavior.
- Frontend test copy code, add profile, verify, delete, and sync progress states.
- Browser check `/add_accounts` and public `/profile/{username}` at desktop, tablet, and mobile widths.
- Manual smoke using GitHub or Codeforces because they are fast public sources.

### Priority
High.

## Unified Question Tracker & Sheet Builder

### Current Status
Partially implemented.

### Existing Files Related To This Feature
- Frontend: `src/pages/SheetPage.jsx`, `src/components/TopicList.jsx`, `src/components/QuestionsTable.jsx`, `src/components/QuestionDetailsDrawer.jsx`, `src/components/SheetHeader.jsx`, `src/components/SheetMetadataDrawer.jsx`.
- State: `src/store/sheetStore.js`, `src/store/sheetStore/sheetCrud.js`, `src/store/sheetStore/sheetPersistence.js`, `src/store/sheetStore/sheetHistory.js`, `src/store/sheetStore/sheetReorder.js`.
- API: `src/api/sheetApi.js`, `src/api/questionSheet/*`.
- Backend: `backend/src/main/java/com/iqms/backend/sheet/SheetController.java`, `backend/src/main/java/com/iqms/backend/sheet/SheetService.java`, `backend/src/main/java/com/iqms/backend/model/Sheet.java`.
- Import/export: `src/pages/ImportPage.jsx`, `src/pages/ExportPage.jsx`, `src/services/sheetTransfer.js`, `src/services/importValidation.js`, `src/services/sheetExport.js`.

### What Needs To Be Added
- Typed schema for topics, subtopics, questions, attempts, resource links, difficulty, tags.
- Backend nested operation endpoints or robust batch mutation endpoint.
- Conflict resolution policy for local-first edits.
- Bulk edit and bulk import review screen.
- Sheet templates and starter kits.
- Better search/filter/sort across large sheets.

### What Needs To Be Improved
- Replace raw `List<Map<String,Object>>` processing with typed DTOs and compatibility adapters.
- Reduce duplicate normalization logic between frontend and backend.
- Make sheet editor less dense for new users.
- Add autosave status clarity and conflict UX.

### Frontend Plan
- Keep the main editor in `SheetPage.jsx`.
- Add optional split modes:
  - Outline mode for topic/subtopic editing.
  - Table mode for questions.
  - Focus mode for one question.
- Improve `QuestionSearch` with filters: difficulty, topic tag, completion, revision due, platform, company.
- Add a reusable bulk action toolbar.
- Add stronger empty states for new sheets.

### Backend Plan
- Add DTOs:
  - `SheetContentDto`
  - `TopicDto`
  - `SubTopicDto`
  - `QuestionDto`
  - `AttemptDto`
- Validate title length, required ids, duplicate ids, and max counts.
- Add endpoint for batch operations:
  - `POST /api/sheets/{sheetId}/operations`
- Keep existing `PUT /api/sheets/{sheetId}` for backward compatibility.

### Database Plan
- Current `sheets` collection can remain.
- Add schema version field to `Sheet`.
- Add migration adapter that reads old map payloads and writes normalized typed payloads.
- Consider separate `sheet_operations` audit collection for sync/debug later.

### UI/UX Plan
- Preserve fast editing but make hierarchy easier to scan.
- Use compact table rows, sticky filters, and clear save/sync status.
- Avoid nesting cards inside cards.
- Mobile: collapse table into question cards with quick actions.

### Edge Cases
- Empty sheet, empty topic, empty subtopic.
- Duplicate ids from import.
- Very large sheet.
- Offline edits then remote updates.
- User hits free-plan limits.
- Invalid import payload.
- Deleting a topic with attempt history.

### Implementation Steps
- [ ] Document current sheet payload.
- [ ] Add typed frontend validators.
- [ ] Add backend DTOs and compatibility mapper.
- [ ] Add schema version field.
- [ ] Build batch operations endpoint.
- [ ] Update frontend save layer gradually.
- [ ] Add migration tests.

### Testing Plan
- Unit test import validation and normalization.
- Backend tests for create/update invalid payloads and premium limits.
- Frontend tests for add/edit/delete/reorder.
- Browser tests for desktop/mobile sheet editing.

### Priority
High.

## Automated Attempt Logging

### Current Status
Partially implemented.

### Existing Files Related To This Feature
- Frontend: `src/components/AttemptLogModal.jsx`, `src/store/sheetStore/sheetCrud.js`, `src/services/questionProgress.js`.
- Analytics: `src/pages/LearningInsightsPage.jsx`.
- Backend reminder extraction: `backend/src/main/java/com/iqms/backend/notification/RevisionNotificationService.java`.

### What Needs To Be Added
- First-class attempt log model or typed embedded attempt model.
- Attempt APIs for create/update/delete/list.
- Quick-log action from question rows.
- Automatic attempt import from platform sync where possible.
- Better revision schedule generation after failed/partial attempts.

### What Needs To Be Improved
- Current logs live inside question maps and are hard to query.
- Timer UX should be faster for repeated practice.
- Confidence/mistake data should feed analytics consistently.

### Frontend Plan
- Keep detailed `AttemptLogModal`.
- Add quick buttons: Solved, Tried, Need Review, Skipped.
- Add attempt history drawer per question.
- Add calendar/revision scheduling preview before save.

### Backend Plan
- Add `/api/sheets/{sheetId}/questions/{questionId}/attempts` later.
- Validate ownership/collaborator edit permissions.
- Recompute revision notifications when attempts change.
- Emit sheet activity event for major attempt changes.

### Database Plan
- Option A: typed attempts embedded on questions for simplicity.
- Option B: `question_attempts` collection for analytics and scaling.
- Recommended: introduce `question_attempts` while retaining embedded latest summary for sheet display.
- Indexes: userId + sheetId + questionId + createdAt, userId + nextRevisionAt.

### UI/UX Plan
- Make logging one-click for common cases and detailed for deep review.
- Show attempt count, last result, last time, next revision in question row.
- Empty state: "Log your first attempt to unlock insights."

### Edge Cases
- Attempt saved offline.
- Multiple attempts on same question same day.
- User deletes question with attempts.
- Collaborator attempts on shared sheet.
- Revision date in the past.

### Implementation Steps
- [ ] Define attempt schema.
- [ ] Add backend attempt endpoints or typed mapper.
- [ ] Add quick-log UI.
- [ ] Update insights to read attempt list.
- [ ] Update notification hydration.
- [ ] Add migration/compatibility for existing `attemptLog` and `attemptLogs`.

### Testing Plan
- Unit test attempt calculations.
- Backend tests for permission and notification generation.
- Browser test logging attempt and seeing insight update.

### Priority
High.

## Rich Analytics & Insights

### Current Status
Partially implemented.

### Existing Files Related To This Feature
- `src/pages/LearningInsightsPage.jsx`
- `src/components/insights/InsightsDashboardComponents.jsx`
- `src/components/DifficultyDistributionWidget.jsx`
- `src/components/TopicDistributionChart.jsx`
- `src/components/CodingStatsPanel.jsx`
- `backend/src/main/java/com/iqms/backend/service/AiSuggestionService.java`

### What Needs To Be Added
- Backend analytics service for stable metrics.
- Snapshot/materialized analytics for large accounts.
- Filters by date, sheet, topic, difficulty, company, platform.
- Export analytics report.
- Consistent chart primitives.

### What Needs To Be Improved
- Current insights are mostly client-derived.
- Premium gating should clearly communicate what is locked.
- Chart styling should be unified across sheet insights and coding profiles.

### Frontend Plan
- Keep `LearningInsightsPage` but split into reusable sections.
- Add analytics overview cards, trend chart, weak areas, revision queue, attempt quality, platform contribution.
- Add empty and loading states per section.

### Backend Plan
- Add `/api/analytics/overview`, `/api/analytics/sheets/{sheetId}`, `/api/analytics/timeline`.
- Analytics service reads sheets, attempts, platform snapshots, and notifications.
- Cache expensive aggregates.

### Database Plan
- Add `analytics_snapshots` collection if data volume grows.
- Index by userId + period + createdAt.
- Keep raw attempts as source of truth.

### UI/UX Plan
- Executive-summary first, drill-down second.
- Use consistent colors for easy/medium/hard and platform labels.
- Mobile cards should stack without horizontal charts unless scrollable.

### Edge Cases
- No attempts.
- No verified platforms.
- All questions solved.
- Imported sheets with missing metadata.
- Large activity datasets.

### Implementation Steps
- [ ] Define metric contract.
- [ ] Build backend analytics read service.
- [ ] Add frontend API module.
- [ ] Replace duplicated client calculations gradually.
- [ ] Add premium/locked variants.

### Testing Plan
- Unit test analytics with fixture sheets.
- Backend test filters and empty states.
- Visual/browser check charts at multiple widths.

### Priority
High.

## Profile/Portfolio Generation

### Current Status
Partially implemented.

### Existing Files Related To This Feature
- Frontend: `src/pages/ProfilePage.jsx`, `src/pages/SharedPage.jsx`, `src/components/CodingStatsPanel.jsx`, `src/components/PremiumLotusBadge.jsx`.
- Backend: `backend/src/main/java/com/iqms/backend/profile/ProfileController.java`, `backend/src/main/java/com/iqms/backend/profile/ProfileShareService.java`, `backend/src/main/java/com/iqms/backend/controller/PublicProfileLinkController.java`.
- SEO: `src/components/SeoMeta.jsx`, `src/config/seo.js`.

### What Needs To Be Added
- Portfolio builder sections: projects, achievements, skills, experience, education, links.
- Visibility controls per section.
- Public preview mode.
- Share-card/social metadata.
- Verified platform badges and stats summary.

### What Needs To Be Improved
- Public profile tab system needs clearer hierarchy.
- Copy/share actions should be easier to find.
- Coding stats should be consistent between owner and public pages.

### Frontend Plan
- Add profile edit sections in `EditProfilePage.jsx`.
- Add public portfolio tab in `SharedPage.jsx`.
- Add compact profile header with badges, verified platforms, follower counts, public sheet stats.
- Add public "Coding Stats" tab with cached verified snapshots only.

### Backend Plan
- Extend profile update payload for portfolio sections.
- Add public profile serializer that excludes private/unverified fields.
- Add validation for links and text lengths.

### Database Plan
- Add profile sections to `User` or a `user_portfolios` collection.
- Recommended: keep simple profile fields on `User`, move rich portfolio sections to `user_portfolios`.
- Index public slug/username.

### UI/UX Plan
- Profile should feel like a developer portfolio, not just a settings page.
- Public tabs: Sheets, Coding Stats, Portfolio, Activity.
- Owner page should separate management from public preview.

### Edge Cases
- Empty portfolio.
- Broken external links.
- User changes username.
- Premium badge visibility.
- Private sheets should never appear publicly.
- Unverified platform profiles should never appear publicly.

### Implementation Steps
- [ ] Define portfolio schema.
- [ ] Add backend validation and public serializer.
- [ ] Add edit UI sections.
- [ ] Update public profile tabs.
- [ ] Add SEO metadata for public profile.

### Testing Plan
- Backend test public/private field filtering.
- Frontend test public profile tabs.
- Browser test profile layout mobile/desktop.

### Priority
Medium.

## Contest & Event Tracking

### Current Status
Partially implemented.

### Existing Files Related To This Feature
- Platform stats: `backend/src/main/java/com/iqms/backend/service/PlatformStatsService.java` fetches LeetCode and Codeforces contest/rating history.
- Frontend charts: `src/components/CodingStatsPanel.jsx`.
- Notifications: `src/pages/AlarmsPage.jsx`, `backend/src/main/java/com/iqms/backend/notification/RevisionNotificationService.java`.

### What Needs To Be Added
- Dedicated contests/events page.
- Contest model and event calendar.
- Platform contest connector for upcoming contests where APIs exist.
- Reminder flow for contests.
- Rating timeline per platform.

### What Needs To Be Improved
- Contest data is currently just part of coding stats snapshots.
- No event calendar or reminder integration for upcoming contests.

### Frontend Plan
- Add `/contests` or section under insights.
- Calendar/list view with upcoming contests, registered reminders, platform filters.
- Rating history chart and contest participation table.

### Backend Plan
- Add contest endpoints:
  - `GET /api/contests/upcoming`
  - `GET /api/contests/history`
  - `POST /api/contests/{contestId}/reminder`
- Use notification service for reminders.
- Cache third-party contest data.

### Database Plan
- Add `contest_events` cache collection.
- Add `user_contest_reminders` or reuse notifications with `sourceType=contest`.
- Index platform + startTime, userId + startTime.

### UI/UX Plan
- Calendar first for upcoming events, analytics second for history.
- Clear source labels and time zones.
- Empty state: "Connect a platform or add a contest reminder."

### Edge Cases
- Contest time zone conversion.
- Duplicate contest from multiple sources.
- Platform API unavailable.
- Reminder created after contest start.

### Implementation Steps
- [ ] Choose supported contest sources.
- [ ] Add event cache model.
- [ ] Add read endpoints.
- [ ] Add reminder action.
- [ ] Add frontend calendar/list.

### Testing Plan
- Unit test time zone handling.
- Backend tests for reminder creation.
- Browser test contest list and filters.

### Priority
Medium.

## Company-Specific Tracks & Kits

### Current Status
Not implemented.

### Existing Files Related To This Feature
- Related foundations: `src/data/famousSheets.js`, `src/pages/PublicSheetsPage.jsx`, `src/pages/SheetPage.jsx`, `backend/src/main/java/com/iqms/backend/model/Sheet.java`.

### What Needs To Be Added
- Company track data model.
- Track landing/list page.
- Company kits: curated questions, sheets, notes, interview rounds, tags.
- Ability to generate/copy a company kit into user sheets.
- Progress per company.

### What Needs To Be Improved
- Existing public sheets can host company content, but there is no dedicated company taxonomy or kit workflow.

### Frontend Plan
- Add company tracks page with filters: company, role, difficulty, topic, round type.
- Add kit detail page with overview, included sheets/questions, progress, copy button.
- Add company badges/tags in sheet editor.

### Backend Plan
- Add company track APIs:
  - `GET /api/company-tracks`
  - `GET /api/company-tracks/{slug}`
  - `POST /api/company-tracks/{slug}/copy`
- Admin/seed path for curated kits later.

### Database Plan
- `company_tracks`: slug, companyName, role, description, tags, sourceSheetIds, curatedQuestionIds, visibility.
- `user_company_progress`: userId, trackId, copiedSheetIds, progress, updatedAt.

### UI/UX Plan
- Treat as a practical preparation kit, not a marketing page.
- Use dense but clean lists with clear "Copy kit" and "Resume" actions.
- Mobile should be a simple stacked list.

### Edge Cases
- Company name collisions.
- Outdated question links.
- User already copied a kit.
- Private source sheet accidentally referenced.

### Implementation Steps
- [ ] Define track schema.
- [ ] Seed a small first track manually.
- [ ] Add read/copy endpoints.
- [ ] Add frontend list/detail.
- [ ] Connect copied kit to user sheets.

### Testing Plan
- Backend copy idempotency tests.
- Frontend tests for list filters.
- Browser smoke on copy kit.

### Priority
Medium.
