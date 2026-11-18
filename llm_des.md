# LLM Developer Handoff Document (`llm_des.md`)

This file is a high-signal orientation guide for another LLM (or human) that needs to understand, modify, and safely extend this repository.

---

## 1) Repository Identity

- **Project name:** Interactive Question Management Sheet (IQMS)
- **Product type:** Full-stack web application for creating and managing coding/DSA preparation sheets.
- **Core value:** Local-first editing for question sheets with collaboration, reminders, analytics, and premium workflows.

Top-level architecture in one line:

- **Frontend:** React + Vite SPA at repo root (`src/`)
- **Backend:** Spring Boot app in `backend/`
- **Database:** MongoDB

---

## 2) High-Level Product Behavior

The domain model is centered on a nested learning structure:

- **Sheet → Topics[] → SubTopics[] → Questions[]**

Users can:

- Build and edit sheets
- Track per-question progress
- Add notes and metadata
- Share/publicize/copy sheets
- Use reminders/notifications
- Access premium features (with Razorpay-backed payment flow)
- Participate in team/study workflows

A notable architectural choice is **local-first UX**:

1. UI updates happen immediately in local state.
2. Changes are persisted locally.
3. Changes are queued for sync (outbox model).
4. Background sync tries to apply operations to backend.
5. Failure to sync does not block ongoing edits.

---

## 3) Repo Map (Practical)

### Frontend (root)

- `src/pages/` → Route-level pages (Login, Profile, Sheet workspace, Premium, etc.)
- `src/components/` → Reusable UI and feature components
- `src/store/` → Zustand state management
  - `authStore.js`
  - `sheetStore.js`
  - modular helpers in `src/store/sheetStore/`
- `src/api/` → API client modules by concern
- `src/services/` → Domain-oriented client logic and helpers
- `src/config/` → env/API/auth/SEO configuration
- `src/test/` + `__tests__` folders → frontend test setup and tests

### Backend (`backend/`)

- `backend/src/main/java/com/iqms/backend/controller/` → REST controllers
- `backend/src/main/java/com/iqms/backend/service/` → business logic services
- `backend/src/main/java/com/iqms/backend/repository/` → Spring Data repositories
- `backend/src/main/java/com/iqms/backend/model/` → MongoDB entities
- `backend/src/main/java/com/iqms/backend/security/` → auth + request protections
- `backend/src/main/java/com/iqms/backend/config/` → Spring config and property validation
- `backend/src/main/resources/` → app properties
- `backend/src/test/` → backend tests

### Documentation

- `README.md` → setup overview + env guidance
- `requirements.md` → runtime/tooling requirements
- `docs/HIGH_LEVEL_DESIGN.md` → architecture intent and domain flow
- `docs/IMPLEMENTATION_PLAN.md`, `docs/PHASE3_ARCHITECTURE.md`, etc. → evolving design notes

---

## 4) Frontend Technical Understanding

### Stack

- React 19
- Vite 7
- Zustand 5
- React Router DOM 7
- Tailwind CSS 4 (with migration to modular BEM-inspired CSS architecture for surface components)
- Vitest + ESLint

### App Composition

- Entry via `src/main.jsx`
- App root in `src/App.jsx`
- Route/page driven architecture under `src/pages/`
- Common UX patterns: drawers, modals, table/list editors, filter/search tools

### State Strategy

- Zustand stores separate concerns:
  - auth/session (`authStore`)
  - sheet editing domain (`sheetStore` + helper modules)
- Sheet store helpers imply intent for:
  - CRUD operations
  - reorder operations
  - history (undo/redo-like behavior)
  - selectors and persistence abstraction

### API Boundary

- `src/api` handles transport and endpoint-level concerns.
- `src/services` builds richer behaviors around API/store interactions.
- Sync-specific modules exist under `src/api/questionSheet/` (`outboxSync`, adapters, local storage helpers).

### Recent UI/UX Notes

- Mobile app shell now uses a hamburger-triggered drawer; the desktop rail is hidden under tablet width.
- The collapsed desktop rail intentionally shows only the most important destinations. Secondary destinations remain available when the rail is expanded and in the mobile drawer.
- The profile sheet list keeps primary `Open` actions visible and groups sharing/archive/copy/delete actions behind `Manage`.
- Profile filters are compact selects (`Show`, `Sort`) instead of many horizontal buttons.
- Theme character images are clipped into circular avatar-style controls.
- For local origins, Google sign-in is suppressed unless the origin is explicitly listed in `VITE_GOOGLE_AUTH_ALLOWED_ORIGINS` / `VITE_APP_AUTH_GOOGLE_ALLOWED_ORIGINS`; this prevents users from seeing Google's `origin_mismatch` error screen during local testing.

---

## 5) Backend Technical Understanding

### Stack

- Java 17
- Spring Boot 3.4.x
- Spring Web / Validation / Data MongoDB / Redis / Mail
- Spring Security Crypto
- Maven

### Layering

- **Controller:** HTTP contracts
- **Service:** business rules + orchestration
- **Repository:** MongoDB persistence

### Major Capability Areas

- **Auth & Identity:** email/password flows, OTP mail, Google token verification
- **Sheets:** CRUD + engagement metadata
- **Collaboration:** sharing, collaborator logic, comments, activity events
- **Notifications:** preferences, revision scheduling, actions (snooze/reschedule), push subscriptions
- **Premium:** entitlement + Razorpay order/verification
- **Teams/Discovery/Profile:** creator and group-oriented workflows

### Security Patterns

- Token service + auth interceptor model
- Request rate limiting / fingerprint support
- Centralized exception handling and structured error responses

---

## 6) Data Model & Persistence

MongoDB is the primary datastore; model classes in `backend/src/main/java/com/iqms/backend/model/` indicate key aggregates:

- `User`
- `Sheet`
- `StudyTeam`
- `RevisionNotification`
- `NotificationPreferences`
- `PremiumPaymentOrder`
- `SheetComment`, `SheetActivityEvent`, `SheetCopyEvent`
- team progress / subscription support entities

Design implication: document-oriented persistence aligns well with nested sheet hierarchy and read-heavy UI patterns.

---

## 7) Operational Flows You Should Assume

### A) Sheet edit and sync

- Local edit should be immediate and resilient.
- Persistent local snapshot and outbox queue should preserve user progress even with transient network/backend failures.

### B) Premium payment flow

- Frontend should never grant premium directly.
- Backend must create orders and verify payment signature/details before entitlement activation.

### C) Collaboration controls

- Mutations around sharing/comments/collaborators must be validated server-side against role/ownership constraints.

---

## 8) Environment & Configuration Notes

### Frontend environment (from README contract)

Common variables:

- `VITE_API_BASE_URL`
- `VITE_SYNC_API_BASE_URL`
- `VITE_PUBLIC_SHEET_API_BASE_URL`
- `VITE_RAZORPAY_KEY_ID`
- `VITE_GOOGLE_AUTH_ALLOWED_ORIGINS`
- optional: `VITE_API_TIMEOUT_MS`, `VITE_WEB_PUSH_PUBLIC_KEY`

### Backend environment

Common variables:

- `MONGODB_URI`
- `APP_AUTH_SECRET`
- `APP_PAYMENT_RAZORPAY_ENABLED`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- mail settings (`APP_MAIL_*`) if email workflows are enabled

Guiding principle: keep all sensitive values backend-side and environment-driven.

---

## 9) Build/Test Expectations

### Frontend

- Node.js 20+
- npm 10+

Typical commands:

```bash
npm install
npm run lint
npm run test
npm run build
```

### Backend

- Java 17
- Maven 3.9+

Typical commands:

```bash
cd backend
mvn test
mvn spring-boot:run
```

---

## 10) Working Conventions for Another LLM

If you continue work in this repo, follow these guidelines:

1. **Preserve local-first behavior** for sheet editing; do not introduce server round-trip dependency for every user interaction.
2. **Respect store/API boundaries**; avoid embedding fetch logic deep inside view components.
3. **Keep backend authorization checks authoritative** even if frontend also guards routes/actions.
4. **Favor additive, modular changes** over large cross-cutting rewrites unless explicitly required.
5. **Update docs when changing architecture-significant behavior** (README and docs/*.md).
6. **Validate both frontend and backend** when touching integration points.
7. **Do not leak secrets** (especially payment/mail credentials) into frontend bundles or source-controlled files.
8. **Respect the CSS architecture**: Avoid deep Tailwind utility nesting in favor of semantic, reusable classes (BEM-inspired) defined in `src/styles/` for surface components.
9. **Local UI smoke login**: Use username `test123` and password `test@123` for authenticated browser checks.

---

## 11) Suggested Fast-Start Plan for Future Changes

When asked to implement a feature:

1. Identify impacted layer(s): UI, store, API client, backend endpoint/service, model/repository.
2. Check if a similar pattern already exists (copy existing conventions before inventing new abstractions).
3. Implement in smallest safe increments.
4. Run focused tests first, then broader lint/test/build.
5. Document behavior and env implications.

---

## 12) Known Constraints & Observations

- Repository includes built backend artifacts under `backend/target/`; avoid hand-editing generated files.
- If package moves leave stale classes under `backend/target/classes`, Spring Boot can detect duplicate beans. Prefer a clean build or delete only stale generated package folders rather than changing source to work around generated artifacts.
- Multiple docs may reflect different phases of evolution; prefer current code reality when conflicts appear.
- This codebase is feature-rich; maintain separation by domain folder/module to minimize regressions.
- Full `npm run lint` currently reports broad pre-existing lint issues. Focused checks on recently touched files pass, and `npm run test` / `npm run build` pass after the latest UI test pass.

---

## 13) Canonical Source Priority (for truth)

When in doubt, trust sources in this order:

1. Current code (`src/`, `backend/src/`)
2. `README.md`
3. `docs/HIGH_LEVEL_DESIGN.md`
4. `requirements.md`
5. Older phase/planning docs

---

## 14) Recently Verified Concrete Details (New)

### Frontend concrete details observed

- `package.json` scripts include `dev`, `start`, and `preview`, with `dev/start` pinned to host `127.0.0.1` and port `5172` (`--strictPort`).
- Frontend dependency set includes `@hello-pangea/dnd`, `chart.js`, React 19, React Router 7, and Zustand 5.
- Testing stack concretely includes Vitest + jsdom + Testing Library packages.
- Route/page surface includes dedicated pages such as `SheetPage`, `SharedPage`, `PublicSheetsPage`, `PremiumPage`, `LearningInsightsPage`, `ImportPage`, and `ExportPage`.

### Frontend state/sync modules observed

- `src/store/sheetStore/` is split into `sheetCrud`, `sheetReorder`, `sheetHistory`, `sheetPersistence`, `sheetSelectors`, `constants`, and `helpers`.
- This structure reinforces clear split of CRUD/reorder/history/persistence concerns, which should be preserved when adding new sheet behaviors.

### Backend concrete details observed

- `backend/pom.xml` uses Spring Boot parent `3.4.4` and Java `17`.
- Backend includes `spring-boot-starter-data-redis` in addition to web/mongo/validation/mail/security-crypto.
- Google auth integration dependencies are explicit: `google-api-client` and `google-http-client-jackson2`.
- Controller surface (currently visible) includes:
  - `AuthController`
  - `PremiumController`
  - `ShareLinkController`
  - `PublicProfileLinkController`
  - `StudyTeamController`
  - `CreatorDiscoveryController`
  - `DifficultyCategoryController`
  - `PlatformStatsController`
  - `ApplicationSubmissionController`
  - `SwrCacheDemoController`

### Practical implications from the new details

- Treat Redis usage as part of production assumptions (e.g., caching/rate-limiting/session-adjacent use cases) and verify infra expectations when deploying backend changes.
- Keep API/client naming and routing aligned with the currently broad page/controller surface area, because product scope goes beyond a single sheet editor.
- Preserve strict local development port conventions (5172) when updating docs or onboarding instructions to avoid friction.

---

## 15) Expanded Knowledge Checklist (What to Always Verify Before Changes)

1. **Feature area mapping:** Which page(s), store module(s), API module(s), backend controller/service/repository, and model(s) are touched?
2. **Data ownership:** Is source of truth local-first store, backend canonical data, or both with sync semantics?
3. **Security:** Are auth checks and authorization constraints enforced in backend, not just hidden in UI?
4. **Failure behavior:** What happens when network/backend fails mid-edit or mid-collaboration action?
5. **Config impact:** Any new env vars required in frontend (`VITE_*`) or backend (`APP_*`, DB/payment/mail)?
6. **Testing impact:** Which exact frontend and backend checks can prove no regression for touched flows?
7. **Docs impact:** Must `README.md`, `requirements.md`, or docs under `docs/` be updated?

---

## 16) One-Screen Summary

IQMS is a local-first, full-stack prep-sheet platform with a React/Zustand frontend and Spring Boot/MongoDB backend. The core entity is a nested sheet (topics/subtopics/questions), surrounded by auth, sharing, notifications, teams, and premium billing. Respect the client-store-api-server boundaries, keep backend authorization/payment verification authoritative, and preserve offline-resilient editing/sync behavior.
