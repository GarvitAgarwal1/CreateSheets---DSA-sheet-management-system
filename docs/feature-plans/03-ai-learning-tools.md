# AI And Learning Tools Plan

## AI-Powered Assistance

### Current Status
Partially implemented.

### Existing Files Related To This Feature
- Backend: `backend/src/main/java/com/iqms/backend/service/AiSuggestionService.java`, sheet endpoint in `backend/src/main/java/com/iqms/backend/sheet/SheetController.java`.
- Frontend: `src/pages/LearningInsightsPage.jsx`, `src/components/insights/InsightsDashboardComponents.jsx`.
- Premium gating: `backend/src/main/java/com/iqms/backend/service/EntitlementService.java`, `src/services/premium.js`.

### What Needs To Be Added
- Clear distinction between heuristic recommendations and true AI.
- LLM provider abstraction if external AI is added.
- Prompt/version registry.
- User feedback on recommendations.
- Privacy-safe context selection.
- Rate limits and premium gates for AI calls.

### What Needs To Be Improved
- Current service uses simple completion counts and should not be treated as advanced AI.
- No persistence of AI suggestions or feedback.

### Frontend Plan
- Add "Recommended next action" panel to insights and sheet page.
- Add feedback controls: useful/not useful, skip, remind me.
- Add AI explanation text that is concise and tied to actual data.
- Add premium locked state for advanced AI.

### Backend Plan
- Keep `AiSuggestionService` as baseline heuristic.
- Add `LearningRecommendationService` for deterministic recommendations.
- If using LLM later, add:
  - `AiProviderClient`
  - request/response DTOs
  - safety filters
  - cost/rate tracking
- Never send private profile data unless required and explicitly controlled.

### Database Plan
- `learning_recommendations`: userId, sheetId, source, payload, createdAt, feedback.
- Optional `ai_usage_events`: userId, provider, tokens/cost, feature, createdAt.

### UI/UX Plan
- AI assistance should feel like a coach, not a chatbot everywhere.
- Recommendations should be actionable: "Review Graphs due today", "Retry DP hard problems".
- Always show why the recommendation was made.

### Edge Cases
- No sheet data.
- No attempts.
- User has only imported questions without metadata.
- LLM provider unavailable.
- Recommendation repeats too often.

### Implementation Steps
- [ ] Rename/position current heuristic recommendations accurately.
- [ ] Define recommendation DTO.
- [ ] Add feedback capture endpoint.
- [ ] Add deterministic recommendation engine.
- [ ] Add LLM provider only after analytics is stable.

### Testing Plan
- Unit test recommendation rules.
- Backend test privacy and permissions.
- Frontend test empty/loaded/locked recommendation states.

### Priority
Medium.

## Interactive Visualizations & Tools

### Current Status
Partially implemented.

### Existing Files Related To This Feature
- `src/components/CodingStatsPanel.jsx`
- `src/components/DonutChart.jsx`
- `src/components/DifficultyDistributionWidget.jsx`
- `src/components/TopicDistributionChart.jsx`
- `src/pages/LearningInsightsPage.jsx`
- `src/components/insights/InsightsDashboardComponents.jsx`

### What Needs To Be Added
- Unified chart component library or style rules.
- Interactive drill-down for topic/difficulty/platform charts.
- Calendar heatmap component reused across sheets and platforms.
- Visual tools for revision schedule, weak topics, and progress forecast.

### What Needs To Be Improved
- Some charts are custom SVG/CSS and some are component-specific.
- Chart colors and legends need consistency.
- Mobile chart behavior should be checked carefully.

### Frontend Plan
- Create reusable chart primitives:
  - DonutChart
  - HeatmapChart
  - TrendChart
  - Radar/skill summary alternative
  - Bar distribution
- Add click-to-filter behavior for donut/legend rows.
- Add accessible text summaries below charts.

### Backend Plan
- Provide chart-ready analytics payloads.
- Avoid shipping huge raw histories when aggregated series is enough.

### Database Plan
- Use analytics snapshots once backend analytics exists.
- Keep raw source data separate from chart aggregates.

### UI/UX Plan
- Charts should explain themselves through labels, not long instructions.
- Use stable dimensions to prevent layout jumps.
- Use the same easy/medium/hard colors everywhere.

### Edge Cases
- All zero values.
- One category only.
- Very long topic names.
- Huge activity history.
- Narrow mobile widths.

### Implementation Steps
- [ ] Inventory all chart usage.
- [ ] Create chart design contract.
- [ ] Consolidate duplicate chart logic.
- [ ] Add drill-down interactions.
- [ ] Add visual regression/browser checks.

### Testing Plan
- Unit test chart data transforms.
- Browser screenshots for desktop/tablet/mobile.
- Accessibility check for legends and labels.

### Priority
Medium.

## Browser/IDE Extensions & Integrations

### Current Status
Not implemented.

### Existing Files Related To This Feature
- Related APIs: `src/api/sheetApi.js`, `backend/src/main/java/com/iqms/backend/sheet/SheetController.java`.
- Related platform data: `src/api/platformApi.js`, `backend/src/main/java/com/iqms/backend/service/PlatformStatsService.java`.

### What Needs To Be Added
- Browser extension plan for saving problems from LeetCode/Codeforces/etc.
- IDE extension or clipboard/import workflow for adding resources.
- Public API tokens or scoped extension auth.
- Deep links into sheets/questions.

### What Needs To Be Improved
- Current import is file-based; no capture workflow from live problem pages.

### Frontend Plan
- Add "Import from URL" modal.
- Add extension setup page later.
- Add copied problem review queue.

### Backend Plan
- Add scoped extension token model.
- Add endpoint:
  - `POST /api/integrations/problem-capture`
- Validate URL, platform, title, difficulty, tags.
- Protect against spam.

### Database Plan
- `integration_tokens`: userId, tokenHash, scopes, createdAt, lastUsedAt, revokedAt.
- `problem_capture_queue`: userId, sourceUrl, normalizedPayload, status, createdAt.

### UI/UX Plan
- Keep extension setup optional.
- The review queue should let users place captured problems into a sheet/topic quickly.

### Edge Cases
- User captures duplicate problem.
- Unsupported platform URL.
- Extension token revoked.
- Problem metadata cannot be parsed.

### Implementation Steps
- [ ] Start with in-app "Import from URL".
- [ ] Define capture payload.
- [ ] Add backend capture endpoint.
- [ ] Build queue/review UI.
- [ ] Package browser extension only after endpoint is stable.

### Testing Plan
- Unit test URL parsing.
- Backend auth scope tests.
- Browser test capture-to-sheet flow.

### Priority
Low.

## Rich Notes & Resources

### Current Status
Partially implemented.

### Existing Files Related To This Feature
- `src/components/QuestionDetailsDrawer.jsx`
- `src/components/ResourceLinksEditor.jsx`
- `src/store/sheetStore/sheetCrud.js`
- `backend/src/main/java/com/iqms/backend/service/ExternalResourceService.java`

### What Needs To Be Added
- Markdown notes editor.
- Resource library reusable across questions.
- Attachments or typed links: article, video, solution, code, discussion.
- Note version history.
- Full-text search over notes/resources.

### What Needs To Be Improved
- Existing notes/resources are useful but basic.
- No central resource deduplication.
- No rich formatting or preview.

### Frontend Plan
- Upgrade notes field to Markdown editor with preview.
- Add resource cards with type, title, URL, source, and tags.
- Add "Add to library" and "Reuse resource" actions.

### Backend Plan
- Validate URLs through `ExternalResourceService`.
- Add resource endpoints:
  - `GET /api/resources`
  - `POST /api/resources`
  - `POST /api/sheets/{sheetId}/questions/{questionId}/resources`
- Add markdown sanitization if rendering server-side.

### Database Plan
- `resources`: userId, url, title, type, tags, createdAt.
- Question references resource ids or embeds a snapshot.
- Index userId + url unique.

### UI/UX Plan
- Notes should be readable in public/shared mode when allowed.
- Resource cards should be compact and scannable.
- Empty state should encourage adding one solution link or note.

### Edge Cases
- Duplicate URL.
- Broken URL.
- Malicious markdown/HTML.
- Very long notes.
- Private resource in public sheet.

### Implementation Steps
- [ ] Define note/resource schema.
- [ ] Add markdown editor component.
- [ ] Add backend resource model.
- [ ] Add resource library UI.
- [ ] Add public/private visibility handling.

### Testing Plan
- Unit test URL validation and markdown sanitization.
- Frontend tests for resource add/remove.
- Browser test notes in editor and public sheet.

### Priority
Medium.

## Search & Recommendation

### Current Status
Partially implemented.

### Existing Files Related To This Feature
- Search: `src/components/QuestionSearch.jsx`, `src/pages/PublicSheetsPage.jsx`, `src/api/sheetApi.js`.
- Recommendations: `backend/src/main/java/com/iqms/backend/service/AiSuggestionService.java`, `src/pages/LearningInsightsPage.jsx`.
- Discovery: `backend/src/main/java/com/iqms/backend/controller/CreatorDiscoveryController.java`, `backend/src/main/java/com/iqms/backend/service/CreatorDiscoveryService.java`.

### What Needs To Be Added
- Global search across sheets, questions, notes, public creators, and public sheets.
- Recommendation service based on weak topics, due revisions, company tracks, followed creators, and platform gaps.
- Search indexing strategy.

### What Needs To Be Improved
- Current search appears sheet-local and UI-level.
- Public discovery needs richer filters and ranking rules.

### Frontend Plan
- Add global search input in topbar or dedicated page.
- Filters: my sheets, public sheets, questions, creators, platforms, company tracks.
- Add recommendation sections on home/profile/insights.

### Backend Plan
- Add `/api/search` with query, type, filters, page, size.
- Add recommendation endpoint:
  - `GET /api/recommendations`
- Use Mongo text indexes first; later consider dedicated search engine.

### Database Plan
- Add text indexes for sheets title/description, public profile name/username, resources.
- Consider denormalized `search_documents` collection for nested questions.
- Recommendation snapshots optional.

### UI/UX Plan
- Search results should be grouped by type.
- Highlight matched text.
- Empty state should suggest broader filters.

### Edge Cases
- Short query.
- Special characters.
- Private content leakage.
- Large nested sheets.
- Duplicate public sheets.

### Implementation Steps
- [ ] Define searchable document types.
- [ ] Add safe backend search endpoint.
- [ ] Add frontend global search page.
- [ ] Add recommendation rules.
- [ ] Add privacy tests.

### Testing Plan
- Backend tests for privacy filtering and pagination.
- Frontend tests for filters and empty state.
- Browser smoke for search on public and private content.

### Priority
Medium.
