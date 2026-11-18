# Agent Project Understanding - IQMS

This document captures a deep understanding of the Interactive Question Management Sheet (IQMS) project, based on a comprehensive review of the documentation and code structure.

---

## 1. Project Overview

**IQMS (Interactive Question Management Sheet)** is a full-stack platform designed for developers and students preparing for coding interviews (DSA). It allows users to build, manage, and track progress on topic-wise coding sheets.

### Core Value Proposition
- **Local-First Experience:** Fast, responsive UI with immediate local state updates and background sync.
- **Structured Learning:** Sheets organized by Topics -> SubTopics -> Questions.
- **Collaboration & Sharing:** Public sheets, remixes, comments, and team features.
- **Monetization:** Premium features gated by Razorpay payments.

### Tech Stack
- **Frontend:** React 19, Vite 7, Zustand 5 (State Management), React Router DOM 7, Tailwind CSS 4.
- **Backend:** Java 17, Spring Boot 3.4, Spring Data MongoDB, Spring Security Crypto.
- **Database:** MongoDB.

---

## 2. Architecture & Design Patterns

The project follows a clean **Client-Store-API-Server** separation.

### High-Level Architecture
1. **Frontend (React SPA):** Handles rendering, user interaction, and local state.
2. **Zustand Store:** Manages application state (Auth, Sheets). It acts as the "source of truth" for the UI.
3. **API Layer:** Encapsulates HTTP calls to the backend.
4. **Local Persistence:** Uses `localStorage` to cache data and queue operations for offline resilience.
5. **Backend (Spring Boot):** Provides REST APIs, handles business logic, authorization, and data persistence.
6. **MongoDB:** Stores user data, sheets, notifications, etc.

### Local-First & Sync Strategy (Outbox Pattern)
This is a key differentiator for the project.
- **Immediate Feedback:** When a user edits a sheet, the Zustand store updates immediately, and the UI reflects the change without waiting for the backend.
- **Persistence:** The state is saved to `localStorage`.
- **Outbox Queue:** Edits are queued as "operations" in an outbox.
- **Background Sync:** A background process attempts to send these operations to the backend when online. If it fails, the operations remain pending, and the user can continue working.

---

## 3. Data Model

The core entity is the `Sheet`, which has a hierarchical structure:

- **Sheet**
  - **Topics** (List of Maps in MongoDB, flexible schema)
    - **SubTopics**
      - **Questions**

### Key Entities (MongoDB Collections)
- `users`: User profiles and credentials.
- `sheets`: The core content documents.
- `sheet_comments`: Collaboration comments.
- `sheet_activity_events`: Audit trail of changes.
- `study_teams`: Group management.
- `revision_notifications`: Reminders and alarms.
- `premium_payment_orders`: Razorpay transaction logs.

---

## 4. Frontend Deep Dive

### State Management (Zustand)
The state is divided into:
- `authStore`: Handles user session, tokens, and login state.
- `sheetStore`: A complex store for sheet data, broken down into helpers:
  - `sheetCrud.js`: CRUD operations.
  - `sheetReorder.js`: Drag and drop logic.
  - `sheetHistory.js`: Undo/redo functionality.
  - `sheetPersistence.js`: Local storage and sync logic.

### Routing
Managed by React Router in `src/App.jsx`.
- Uses `BrowserRouter`.
- Implements `ProtectedRoute` and `PublicOnlyRoute` for access control.
- Dynamic routing for user profiles (`/profile/:username`) and sheets (`/app/:username/:sheetSlug`).

### Key Components
- `TopicList`: Likely the main container for the sheet editor.
- `QuestionDetailsDrawer`: For viewing/editing question specifics.
- `ReminderNotificationCenter`: Handles UI for alerts and alarms.
- `Sidebar` / `AppShell` / `TopBar`: Main navigation shell. Recent UX work hides the desktop rail on mobile, uses a proper drawer, and keeps the collapsed desktop rail focused on primary destinations.
- `GoogleAuthButton`: Google sign-in entrypoint. Local origins are guarded so users see an in-app setup note instead of Google's `origin_mismatch` page.
- `ThemeCinematicToggle`: Theme switcher. Character image icons are clipped into circular avatar-style controls.

---

## 5. Backend Deep Dive

### Structure
The backend uses standard Spring Boot layering with controllers, services, repositories, models, config, and security packages.
- `com.iqms.backend.model`: Contains entities like `Sheet`, `User`, notification, team, and premium models.
- `com.iqms.backend.controller`: Contains REST controllers such as auth, sheet, premium, discovery, and team controllers.
- `com.iqms.backend.service`: Contains business services including `SheetService`, collaboration, auth, premium, and discovery services.
- `com.iqms.backend.repository`: Contains Spring Data MongoDB repositories including `SheetRepository`.

### Security
- Token-based authentication.
- Server-side validation of ownership and permissions for all mutating operations.
- Razorpay signature verification to prevent fraudulent premium activation.

---

## 6. Key Workflows

### Authentication
Supports standard Email/Password signup with OTP verification and Google OAuth.

### Sheet Collaboration
Owners can make sheets public, invite collaborators, and enable comments.

### Premium Flow
1. Frontend requests an order.
2. Backend creates a Razorpay order.
3. Frontend opens Razorpay checkout.
4. Backend verifies the payment signature before activating premium status.

---

## 7. Observations & Best Practices

## 8. Recent Updates & Fixes (May 2026)

### Frontend Improvements
- **Visual Overhaul**: Migrated to a modular, BEM-inspired CSS architecture to eliminate deep Tailwind utility nesting.
- **Component Redesign**: Standardized design tokens for typography, spacing, and surface components.
- **Question Details Drawer**: Updated to use a card-based layout (`.surface-card`) for sections and added emojis to headers for a more premium look.
- **Mobile Navigation Fix**: Phone-width screens now hide the desktop rail and use a hamburger drawer with correct backdrop/topbar layering.
- **Simplified UX**: Secondary navigation is hidden in the collapsed desktop rail; profile sheet actions are grouped behind `Manage`; profile filters use compact selects.
- **Google OAuth Local Guard**: Local origins such as `http://127.0.0.1:5174` show a friendly setup note unless explicitly allowed by `VITE_GOOGLE_AUTH_ALLOWED_ORIGINS`.
- **Circular Theme Icons**: Superman/Batman/theme images now render in a circular avatar-style control.
- **Premium Account Badge**: The lotus premium marker is styled as a compact circular badge next to profile names, similar in weight to LinkedIn Premium indicators.
- **Vitest Storage Mock**: `src/test/setupTests.js` now provides reliable in-memory `localStorage` and `sessionStorage` mocks.

### Backend Fixes
- **CORS Resolution**: Resolved the `403 Forbidden` error on preflight requests by changing the `CorsConfigurationSource` bean to a registered `CorsFilter` bean in `CorsConfig.java`. This was necessary because the project doesn't use Spring Security for filters.
- **File Location Fix**: Moved `Sheet.java` from `src/main/java/com/iqms/backend/sheet/` to `src/main/java/com/iqms/backend/model/` to match its package declaration and fix compilation errors.

### Authentication Verification
- Verified that local smoke-test credentials username `test123` and password `test@123` are correct and functional when accessing via `http://localhost:5172`.
- Verified latest local smoke test with frontend `http://127.0.0.1:5174` and backend `http://127.0.0.1:8091`.

---

This document serves as a foundation for further development and maintenance by any AI agent or developer.
