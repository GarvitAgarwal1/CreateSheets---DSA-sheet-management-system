# Productivity And UX Plan

## Reminders & Notifications

### Current Status
Partially implemented.

### Existing Files Related To This Feature
- Frontend pages/components: `src/pages/NotificationsPage.jsx`, `src/pages/AlertsPage.jsx`, `src/pages/AlarmsPage.jsx`, `src/components/NotificationBell.jsx`, `src/components/NotificationDrawer.jsx`, `src/components/ReminderNotificationCenter.jsx`, `src/components/TopicReminderAlarmPanel.jsx`.
- Frontend API/services: `src/api/notificationApi.js`, `src/services/notifications.js`, `src/services/notificationEvents.js`, `src/services/notificationUtils.js`, `src/services/reminderNotifications.js`.
- Backend: `backend/src/main/java/com/iqms/backend/notification/RevisionNotificationController.java`, `backend/src/main/java/com/iqms/backend/notification/RevisionNotificationService.java`, `backend/src/main/java/com/iqms/backend/notification/NotificationPreferencesController.java`, `backend/src/main/java/com/iqms/backend/notification/NotificationPreferencesService.java`.
- Models: `backend/src/main/java/com/iqms/backend/model/RevisionNotification.java`, `NotificationPreferences.java`, `PushSubscription.java`.

### What Needs To Be Added
- Real scheduled delivery worker for due notifications if not already deployed externally.
- Browser push delivery using stored push subscriptions.
- Digest notifications.
- Notification sources for social/collaboration/platform sync events.
- Calendar-style reminder view.

### What Needs To Be Improved
- Current notification hydration runs during fetch and unread count; this can become expensive.
- Push subscription is stored but delivery path needs production verification.
- UX should separate revision reminders, alarms, alerts, and social notifications clearly.

### Frontend Plan
- Keep notification bell and drawer.
- Simplify pages into tabs: Due, Upcoming, Done, Archived.
- Add source filters: revision, alarm, platform, collaboration, team.
- Add notification preference page with quiet hours, digest, browser push, weak-topic alerts.
- Add contest reminders when contest feature is added.

### Backend Plan
- Move hydration to scheduled/background task where possible.
- Keep fetch endpoint fast and paginated.
- Add event creation APIs for collaboration/follow/platform events.
- Enforce notification ownership for all mutations.
- Add push delivery service and failure cleanup.

### Database Plan
- Current collections can continue.
- Add indexes:
  - userId + status + scheduledFor
  - userId + type + scheduledFor
  - userId + deletedAt/status
- Add optional `notification_delivery_events` for observability.

### UI/UX Plan
- Notifications should feel like a task inbox.
- Primary actions: Done, Snooze, Reschedule, Dismiss.
- Use small labels for source and due time.
- Empty state should be positive and specific.

### Edge Cases
- Reminder due while user is offline.
- Duplicate revision reminders from repeated hydration.
- Recurring alarm completed.
- Quiet hours crossing midnight.
- Browser push permission denied.
- Deleted source question/sheet.

### Implementation Steps
- [ ] Audit notification hydration cost.
- [ ] Add missing indexes.
- [ ] Add source-specific UI filters.
- [ ] Add scheduler or worker for due notifications.
- [ ] Add push delivery service.
- [ ] Add social/platform notification event hooks.

### Testing Plan
- Backend tests for snooze/reschedule/recurrence.
- Unit tests for quiet hours and notification grouping.
- Frontend tests for actions and filters.
- Browser test notification drawer and mobile layouts.

### Priority
High.

## Import/Export & Mobile App / Mobile Responsive Support

### Current Status
Partially implemented.

### Existing Files Related To This Feature
- Import/export: `src/pages/ImportPage.jsx`, `src/pages/ExportPage.jsx`, `src/services/sheetTransfer.js`, `src/services/importValidation.js`, `src/services/sheetExport.js`.
- API/local sync: `src/api/questionSheet/outboxSync.js`, `src/api/questionSheet/localSheetStorage.js`.
- Layout/responsive: `src/components/AppShell.jsx`, `src/components/Sidebar.jsx`, `src/components/TopBar.jsx`, `src/styles/app-shell.css`, `src/styles/sidebar.css`, `src/styles/pages.css`.
- Tests: `src/services/__tests__/importValidation.test.js`, `src/services/__tests__/sheetTransfer.test.js`.

### What Needs To Be Added
- CSV/Excel import and export.
- Platform URL import.
- Better import preview and conflict handling.
- PWA manifest/service worker strategy if mobile app-like support is desired.
- Offline sync status page.
- Mobile-specific QA checklist.

### What Needs To Be Improved
- Current JSON import/export works but is developer-shaped.
- Mobile responsiveness has been improved but needs systematic verification after feature changes.
- Outbox/conflict behavior should be more visible.

### Frontend Plan
- Add import wizard:
  - Upload/select source.
  - Validate and preview.
  - Map fields if CSV/Excel.
  - Choose merge/copy/new sheet.
- Add export menu:
  - JSON.
  - CSV.
  - Printable/PDF.
  - Public share link.
- Add mobile-first sheet row/card mode.

### Backend Plan
- Optional server-side import validation for large files.
- Add import job model if files become large.
- Add export API for server-generated reports later.

### Database Plan
- Current sheets collection is enough for JSON import.
- Add `import_jobs` only when async or large-file support is added.
- Store import source metadata on sheet: importedAt, sourceType, sourceName.

### UI/UX Plan
- Import should prevent destructive surprises.
- Show clear counts: topics, subtopics, questions, invalid rows.
- Mobile should prioritize one primary action per screen.
- Avoid horizontal overflow in sheet editor and profile pages.

### Edge Cases
- Invalid JSON.
- Duplicate question ids.
- CSV with missing columns.
- Very large file.
- User loses internet mid-import.
- Free-plan limit exceeded.
- Mobile Safari file input quirks.

### Implementation Steps
- [ ] Expand import validation contract.
- [ ] Add preview/merge UI.
- [ ] Add CSV export.
- [ ] Add mobile QA checkpoints to PR checklist.
- [ ] Consider PWA only after core flows are stable.

### Testing Plan
- Unit tests for JSON/CSV conversion.
- Browser tests for import wizard at mobile and desktop widths.
- Manual offline/online sync test.

### Priority
Medium.

## Customization & Accessibility

### Current Status
Partially implemented.

### Existing Files Related To This Feature
- Theme: `src/theme/themeContext.jsx`, `src/components/theme/ThemeCinematicToggle.jsx`, `src/styles/tokens.css`.
- Custom metadata: `src/components/CustomDifficultyModal.jsx`, `src/components/CustomTopicModal.jsx`, `src/components/DifficultyCategorySelector.jsx`, `src/components/TopicTagSelector.jsx`, `src/api/difficultyCategoryApi.js`, `backend/src/main/java/com/iqms/backend/controller/DifficultyCategoryController.java`.
- Reusable UI: `src/components/ui/*`.

### What Needs To Be Added
- Accessibility audit and checklist.
- Keyboard navigation pass for sidebar, modals, sheet editor, profile menus.
- Reduced-motion mode.
- High-contrast theme.
- User customization settings page.
- Better focus states and ARIA labels.

### What Needs To Be Improved
- Theme system exists but is visually opinionated and may be inconsistent across pages.
- Some icon/emoji buttons need clearer labels.
- Dense controls need stronger keyboard/focus support.

### Frontend Plan
- Add settings section for theme, motion, compact mode, default sheet view, notification preference shortcut.
- Ensure all modals trap focus and close on Escape.
- Add accessible names for icon-only buttons.
- Improve color contrast for muted text in dark theme.

### Backend Plan
- Store user UI preferences in `User` or `user_preferences`.
- Add profile/preferences update endpoint if not folded into existing profile API.

### Database Plan
- Add `uiPreferences` object:
  - theme
  - reducedMotion
  - compactMode
  - defaultSheetView
  - publicStatsVisible
- Index not required unless queried globally.

### UI/UX Plan
- Customization should be small and practical.
- Accessibility should be default behavior, not a hidden advanced feature.
- Keep themes professional for coding/study use.

### Edge Cases
- Theme localStorage conflicts with backend preference.
- User preference missing on old accounts.
- Screen reader labels on dynamic menus.
- Modal opened from nested menu.
- Reduced motion while charts animate.

### Implementation Steps
- [ ] Run accessibility audit manually.
- [ ] Add preference schema.
- [ ] Add missing ARIA/focus handling.
- [ ] Add high-contrast/reduced-motion tokens.
- [ ] Browser check keyboard-only flows.

### Testing Plan
- Component tests for keyboard behavior.
- Manual screen reader sanity check.
- Browser mobile/desktop visual checks.
- Color contrast scan.

### Priority
Medium.
