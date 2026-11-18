# Interactive Question Management Sheet (IQMS) — High-Level Design

## 1) System context and product intent

IQMS is a local-first learning workflow application where users organize preparation content as **sheet → topics → subtopics → questions** and then use collaboration, reminders, import/export, and premium capabilities around that core model.

At a system level, it is a web platform with:
- A React SPA frontend for editing, analysis, and user workflows.
- A Spring Boot backend for identity, persistence, authorization, premium, collaboration, and discovery features.
- MongoDB as the primary datastore.

The architecture is intentionally resilient for intermittent connectivity: users can continue editing locally and synchronize to backend services through queued operations.

---

## 2) Top-level architecture

```text
+------------------------------+         HTTPS/JSON         +------------------------------+
| Frontend (React + Vite)      | <-----------------------> | Backend (Spring Boot)        |
| - UI pages/components         |                           | - REST controllers            |
| - Zustand state slices        |                           | - Domain/application services |
| - API client layer            |                           | - Security interceptors       |
| - Local persistence/outbox    |                           | - Repositories                |
+---------------+--------------+                           +---------------+--------------+
                |                                                              |
                | localStorage (offline cache, history, outbox)                | Spring Data
                |                                                              v
                |                                                  +------------------------------+
                +------------------------------------------------> | MongoDB                      |
                                                                   | - users                      |
                                                                   | - sheets + collaboration     |
                                                                   | - teams/progress             |
                                                                   | - notifications/premium      |
                                                                   +------------------------------+
```

**Primary architectural style**
- Client-centric, local-first interaction model.
- Service-oriented backend with layered boundaries (controller → service → repository).
- Event/operation style sync from frontend outbox to backend API.

---

## 3) Core domain model

### 3.1 Learning sheet hierarchy
The core content entity is a `Sheet`, represented on the frontend and backend with a nested tree:
- Sheet
  - Topics[]
    - SubTopics[]
      - Questions[]

Each level has stable ids and metadata (`createdAt`, `updatedAt`) to support:
- deterministic UI rendering,
- offline edits,
- sync and conflict handling,
- import/export fidelity.

### 3.2 Supporting domains
Around sheet editing, IQMS extends into domains:
- **Auth & Identity**: login/signup, OTP/mail, Google auth integration.
- **Collaboration**: visibility modes, collaborators, comments, activity events, remix attribution.
- **Team/Classroom**: teams, memberships, assigned sheets, per-member progress snapshots.
- **Notifications**: revision reminders, preferences, push subscriptions, unread counts.
- **Premium/Payments**: entitlement checks and Razorpay order/verification flow.
- **Creator Discovery**: trending creators/sheets and public profile metadata.

---

## 4) Frontend high-level design

## 4.1 Presentation layer
Frontend pages are route-driven (`src/pages`) with reusable UI blocks in `src/components`:
- Authentication flows (Login/Signup).
- Sheet workspace/editor, drawers, modals.
- Import/export workflows.
- Premium, profile, notifications, insights, public/shared pages.

Routing guards and app shell behavior are centralized via routing components and top-level app composition.

## 4.2 State management (Zustand)
The frontend store design is modular:
- `authStore`: session/auth-related state.
- `sheetStore` + slice helpers (`sheetCrud`, `sheetReorder`, `sheetHistory`, selectors): editing operations and derived data.
- persistence helpers for local continuity.

This split keeps write operations explicit and supports maintainable undo/redo and sync behavior.

## 4.3 API boundary
`src/api` and `src/services` encapsulate remote calls and domain workflows:
- API modules per bounded concern (`authApi`, `sheetApi`, `premiumApi`, `profileApi`, etc.).
- Normalization and client adapters for question sheet payloads.
- Dedicated sync plumbing (`outboxSync`) for queued operations.

This boundary prevents UI components from coupling directly to transport details.

## 4.4 Local-first and resilience model
Frontend edits follow this sequence:
1. User action mutates store state immediately.
2. Mutation is persisted locally for crash/session recovery.
3. Mutation is represented as an outbox operation.
4. Background sync attempts dispatch pending operations when online.
5. Failures remain pending without blocking user editing.

Undo/redo history is bounded (as planned, e.g., 20 actions) to control memory growth while preserving usability.

---

## 5) Backend high-level design

## 5.1 Layered service architecture
The backend follows standard Spring layering:
- **Controllers**: REST contracts and HTTP concerns.
- **Services**: business rules, authorization checks, orchestration.
- **Repositories**: MongoDB persistence abstractions.
- **Config/Security**: cross-cutting concerns (CORS, auth, rate-limit, mail/payment properties).

## 5.2 Key backend modules
- **Sheet module**: CRUD and engagement behaviors.
- **Collaboration module** (`SheetCollaborationService`): visibility, comments, collaborator permissions, activity tracking.
- **Team module** (`StudyTeamService`): membership roles, assignment workflows, dashboards.
- **Premium module** (`EntitlementService`, payment services): feature access and payment verification.
- **Notification module**: reminder scheduling, actions (snooze/reschedule), user preferences.
- **Auth module** (`AuthService`, token support): local credentials + provider-backed flows.

## 5.3 Security model (high-level)
- Token-based request authentication through interceptors/services.
- Endpoint-level protections for privileged routes.
- Server-side collaborator/role verification for mutating operations.
- Request fingerprinting/rate-limit support to reduce abuse on auth-sensitive endpoints.

---

## 6) Data architecture (MongoDB)

Collections are organized by capability boundaries and queried via Spring Data repositories:
- Core: `users`, `sheets`.
- Collaboration: `sheet_comments`, `sheet_activity_events`, remix/copy events.
- Team: `study_teams`, `team_sheet_progress`.
- Notifications: revision notifications, push subscriptions, notification preferences.
- Monetization: premium payment orders.
- Application/other platform flows as needed.

Design characteristics:
- Document-oriented structure matches nested sheet data well.
- Denormalization for read-optimized user experiences (e.g., dashboards/discovery summaries).
- Domain services enforce consistency where cross-collection updates are required.

---

## 7) Cross-cutting architectural concerns

## 7.1 Observability and diagnostics
Recommended/implicit checkpoints:
- Structured logs for auth, sync, and collaboration decisions.
- Activity/event trails for key sheet mutations and sharing actions.
- Error payload normalization for predictable frontend handling.

## 7.2 Performance and scale direction
- Client-side optimistic updates keep perceived latency low.
- Server-side pagination/filtering should be used for discovery/activity endpoints.
- Caching opportunities: profile/public sheet payloads, category metadata.

## 7.3 Reliability and failure handling
- Graceful offline behavior in frontend (no disruptive editing failures).
- Retryable sync model with idempotent operation semantics where possible.
- Backend validation + global exception handling to preserve API contract stability.

## 7.4 Security and privacy
- Secret material constrained to backend env.
- Payment signature verification server-side.
- Route guarding + authorization checks at both UI and API layers.
- Share/public profile endpoints should minimize sensitive data exposure by design.

---

## 8) Primary runtime flows

## 8.1 Sheet edit flow (local-first)
1. User edits question hierarchy in UI.
2. Store updates state and history.
3. Local persistence updates snapshot.
4. Sync queue receives operation.
5. Backend receives and persists when connectivity permits.

## 8.2 Collaboration update flow
1. Owner/editor updates sharing or comments settings.
2. Backend validates role and visibility constraints.
3. Sheet metadata is updated; activity/comment records persisted.
4. Clients refresh collaboration views/activity streams.

## 8.3 Premium activation flow
1. Frontend requests backend order creation.
2. Payment executed via Razorpay checkout.
3. Frontend submits verification payload.
4. Backend verifies signature/payment details.
5. Entitlement state transitions to active and gates unlock.

---

## 9) Deployment view

- **Frontend**: static bundle deployment (e.g., Vercel) with env-based API base URL.
- **Backend**: Spring Boot service deployment with env-driven configuration.
- **Database**: MongoDB (local for dev, managed cluster for production).
- **Reverse proxy / HTTPS**: terminates TLS and routes API vs SPA paths.

Configuration should remain twelve-factor style via environment variables for secrets and integration endpoints.

---

## 10) Architectural evolution roadmap

1. Strengthen sync with explicit conflict resolution policies beyond last-write-wins (field-level merges, operation transforms, or revision vectors).
2. Improve real-time collaboration via websocket/event streaming for comments/activity.
3. Add analytics and audit pipelines for creator ecosystem metrics.
4. Introduce contract/versioning strategy for public/share APIs.
5. Expand automated architecture fitness tests (authz boundaries, API schema consistency, offline-sync invariants).

---

## 11) Summary

IQMS is architected as a **local-first collaborative learning platform** where the frontend provides low-latency editing and resilience, while the Spring Boot + MongoDB backend enforces identity, security, collaboration, monetization, and persistence guarantees. The design is modular enough for incremental delivery and robust enough to scale feature domains without rewriting core sheet workflows.
