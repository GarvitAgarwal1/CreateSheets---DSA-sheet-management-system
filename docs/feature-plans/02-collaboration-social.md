# Collaboration And Social Plan

## Follow, Share & Collaboration

### Current Status
Partially implemented.

### Existing Files Related To This Feature
- Public profile and follow: `src/pages/ProfilePage.jsx`, `src/pages/SharedPage.jsx`, `src/api/profileApi.js`, `backend/src/main/java/com/iqms/backend/profile/ProfileController.java`, `backend/src/main/java/com/iqms/backend/profile/ProfileShareService.java`.
- Sheet sharing/collaboration: `backend/src/main/java/com/iqms/backend/service/SheetCollaborationService.java`, `backend/src/main/java/com/iqms/backend/sheet/SheetController.java`, `backend/src/main/java/com/iqms/backend/model/SheetComment.java`, `backend/src/main/java/com/iqms/backend/model/SheetActivityEvent.java`.
- Teams: `backend/src/main/java/com/iqms/backend/controller/StudyTeamController.java`, `backend/src/main/java/com/iqms/backend/service/StudyTeamService.java`, `backend/src/main/java/com/iqms/backend/model/StudyTeam.java`.

### What Needs To Be Added
- Full UI for collaborator invite, role management, comments, and activity timeline.
- Notifications for follows, invitations, comments, and team assignments.
- Viewer/editor role explanations in UI.
- Team/classroom pages for admins, mentors, and students.
- Privacy settings for who can follow/message/invite.

### What Needs To Be Improved
- Follow and public profile exist, but social interaction is shallow.
- Collaboration backend exists, but frontend discovery and management are incomplete.
- Team dashboards are backend-only from the current inspected routes.

### Frontend Plan
- Add collaboration drawer on sheet metadata:
  - Visibility selector.
  - Invite by username.
  - Role list with owner/editor/viewer.
  - Comments toggle.
  - Activity timeline.
- Add profile follow actions and follower/following lists with search.
- Add teams page:
  - Team list.
  - Create team.
  - Invite members.
  - Assign sheets.
  - Admin/member dashboard.

### Backend Plan
- Keep current collaboration APIs.
- Add missing endpoints for removing collaborators and changing roles explicitly if not already covered by invite updates.
- Add follow notification events.
- Add comment moderation/delete endpoints.
- Add team removal/leave endpoints.
- Enforce ownership/edit permissions consistently.

### Database Plan
- Current: collaborators embedded on `Sheet`, comments in `SheetComment`, activity in `SheetActivityEvent`, teams in `StudyTeam`.
- Add:
  - optional `social_events` or use notifications for follow/invite events.
  - indexes for comments/activity by sheetId and createdAt.
  - team membership indexes by userId.

### UI/UX Plan
- Collaboration should feel like a professional document-sharing workflow.
- Keep actions explicit: private, public, unlisted, team.
- Use avatars/usernames in member lists.
- Make destructive actions confirmable.

### Edge Cases
- Inviting a non-existent user.
- Owner attempts to remove self.
- Duplicate invite.
- Collaborator role downgrade while editing.
- Comments disabled after comments exist.
- Private sheet accessed from public URL.
- Blocked/suspended user interactions in future.

### Implementation Steps
- [ ] Audit existing collaboration endpoints for remove/update gaps.
- [ ] Build sheet collaboration drawer UI.
- [ ] Add comments panel and activity timeline.
- [ ] Add notification events for collaboration.
- [ ] Build teams list/detail pages.
- [ ] Add tests for role boundaries.

### Testing Plan
- Backend tests for owner/editor/viewer access.
- Frontend tests for invite form and role states.
- Browser smoke with two test users.
- Regression test public/private sheet visibility.

### Priority
High.

## Copy/Fork Sheets and Peer Review

### Current Status
Partially implemented.

### Existing Files Related To This Feature
- Frontend: `src/pages/SharedPage.jsx`, `src/pages/ProfilePage.jsx`, `src/services/publicSheetCopy.js`, `src/api/sheetApi.js`.
- Backend: `backend/src/main/java/com/iqms/backend/sheet/SheetController.java`, `backend/src/main/java/com/iqms/backend/sheet/SheetService.java`, `backend/src/main/java/com/iqms/backend/model/SheetCopyEvent.java`, `backend/src/main/java/com/iqms/backend/repository/SheetCopyEventRepository.java`.
- Comments: `backend/src/main/java/com/iqms/backend/service/SheetCollaborationService.java`.

### What Needs To Be Added
- Fork graph and attribution UI.
- Peer review request workflow.
- Review comments tied to questions.
- Accept/apply suggested changes.
- Review status: requested, in review, changes requested, approved.

### What Needs To Be Improved
- Copy/remix exists, but it is not yet a complete fork workflow.
- Comments exist but not as structured peer reviews.
- Attribution should remain clear when copying/remixing.

### Frontend Plan
- Add "Fork history" section on public sheet and owner sheet settings.
- Add "Request review" action for sheet collaborators/followers.
- Add review mode in sheet reader/editor:
  - Question-level comments.
  - Suggested edits.
  - Resolve/reopen threads.

### Backend Plan
- Add review models/endpoints:
  - `POST /api/sheets/{sheetId}/reviews`
  - `GET /api/sheets/{sheetId}/reviews`
  - `POST /api/sheets/{sheetId}/reviews/{reviewId}/comments`
  - `POST /api/sheets/{sheetId}/reviews/{reviewId}/resolve`
- Reuse `SheetComment` where possible or create `SheetReview`.
- Permission rules:
  - owner can request/review.
  - reviewer can comment.
  - editor can propose changes.

### Database Plan
- Current `SheetCopyEvent` supports idempotent copy events.
- Add `sheet_reviews`:
  - sheetId, requesterId, reviewerId, status, createdAt, completedAt.
- Add `sheet_review_comments` or extend `SheetComment` with reviewId and status.
- Index sheetId + status and reviewerId + status.

### UI/UX Plan
- Review mode should be calm and focused.
- Use threaded comments beside questions, not large modal-only review.
- Show review status clearly in sheet header.

### Edge Cases
- Source sheet deleted after fork.
- User reviews own sheet.
- Reviewer loses access.
- Suggested edit conflicts with owner changes.
- Copy public sheet while not logged in.

### Implementation Steps
- [ ] Define review workflow states.
- [ ] Add backend review models/endpoints.
- [ ] Add fork graph payload to public sheet/profile.
- [ ] Build review UI in sheet view.
- [ ] Add notifications for requested/completed reviews.

### Testing Plan
- Backend tests for review permissions and state changes.
- Frontend tests for comment creation and thread resolution.
- Browser test public copy and attribution.

### Priority
Medium.

## Leaderboards & Gamification

### Current Status
Not implemented, with small related pieces already present.

### Existing Files Related To This Feature
- Related profile stats: `src/pages/ProfilePage.jsx`, `src/pages/SharedPage.jsx`, `src/components/CodingStatsPanel.jsx`.
- Related backend data: `User` follower/copy stats, `SheetCopyEvent`, platform stats snapshots.
- Premium/profile visual badges: `src/components/PremiumLotusBadge.jsx`.

### What Needs To Be Added
- Leaderboard data model and APIs.
- Public rankings by solved count, streak, public sheet copies, followers, contest rating, team progress.
- Achievement model.
- Streak calculation source of truth.
- Anti-gaming rules.

### What Needs To Be Improved
- Existing achievement-like UI is mostly decorative or derived.
- No centralized scoring rules.

### Frontend Plan
- Add leaderboards page under Discover.
- Tabs:
  - Global.
  - Friends/following.
  - Company tracks.
  - Teams.
  - Platforms.
- Add achievement badges to profile and sheet milestones.
- Add "How score is calculated" drawer.

### Backend Plan
- Add `/api/leaderboards` endpoint with pagination/filtering.
- Add scoring service that reads public/verified data only.
- Add scheduled recalculation or materialized leaderboard snapshots.
- Add privacy controls so users can opt out of public ranking.

### Database Plan
- `leaderboard_snapshots`: scope, period, rows, generatedAt.
- `user_achievements`: userId, key, awardedAt, source.
- Index scope + period + generatedAt.

### UI/UX Plan
- Avoid noisy game visuals; keep it professional.
- Make ranking explainable and opt-out friendly.
- Show badges sparingly on profile.

### Edge Cases
- New users with no data.
- Users with private profiles.
- Duplicate platform data.
- Cheating/spam public sheet copies.
- Tie-breaking.

### Implementation Steps
- [ ] Define score rules.
- [ ] Add privacy setting.
- [ ] Add backend leaderboard service.
- [ ] Add frontend leaderboard page.
- [ ] Add achievements gradually.

### Testing Plan
- Unit test score calculation.
- Backend pagination/filter tests.
- Browser test leaderboard empty and populated states.

### Priority
Low.
