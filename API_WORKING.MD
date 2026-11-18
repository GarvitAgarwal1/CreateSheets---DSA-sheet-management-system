# Backend API Working README

This document explains **every backend API endpoint** exposed by the Spring Boot server in this repository.  
Goal: a new developer (or interviewer) should quickly understand what each endpoint does, where it lives, and the business flow behind it.

---

## How to read this file
For each endpoint, you get:
1. **Endpoint** (HTTP method + route)
2. **File location** (controller method)
3. **What it does**
4. **How it works internally** (controller/service-level flow)
5. **Simple explanation (2–3 lines)**
6. **Real-life analogy**

---

## 1) Authentication APIs (`/api/auth`)
Base controller: `backend/src/main/java/com/iqms/backend/controller/AuthController.java`

### 1.1 `POST /api/auth/signup`
- **Location:** `AuthController.signUp`
- **What it does:** Starts new user registration using signup details.
- **How it works:** Validates `SignUpRequest`, then calls `authService.signUp(request)` which handles user creation/OTP initiation workflow.
- **Simple explanation:** This is the first step of creating an account. The user sends signup info, and backend prepares verification (OTP-based flow).
- **Analogy:** Like filling a membership form at a club before identity confirmation.

### 1.2 `POST /api/auth/signup/resend-otp`
- **Location:** `AuthController.resendOtp`
- **What it does:** Re-sends signup OTP to email.
- **How it works:** Takes email from `SignUpResendOtpRequest` and calls `authService.resendSignupOtp(email)`.
- **Simple explanation:** If user didn’t receive OTP, this endpoint sends a fresh one for signup verification.
- **Analogy:** Asking a bank to resend your transaction verification code.

### 1.3 `POST /api/auth/signup/verify-otp`
- **Location:** `AuthController.verifyOtp`
- **What it does:** Verifies signup OTP and finishes sign-up login state.
- **How it works:** Validates `SignUpOtpRequest`, calls `authService.verifySignupOtp(email, otp)`, returns `AuthResponse`.
- **Simple explanation:** This confirms the OTP entered by the user and activates account access.
- **Analogy:** Entering the verification code received after opening a new online account.

### 1.4 `GET /api/auth/google`
- **Location:** `AuthController.googleAuth` (GET branch)
- **What it does:** Diagnostic route that tells client to use POST.
- **How it works:** If HTTP method is GET, returns informational text.
- **Simple explanation:** This is not real login; it only indicates that Google auth should be called via POST.
- **Analogy:** A signboard saying “service available at next counter.”

### 1.5 `POST /api/auth/google`
- **Location:** `AuthController.googleAuth` (POST branch)
- **What it does:** Logs in / signs up user using Google ID token.
- **How it works:** Validates request token presence, then `authService.authenticateWithGoogle(idToken)`. Handles operational failures and throws 503 if provider/config not usable.
- **Simple explanation:** User gives Google ID token; backend verifies and creates/authenticates local account session.
- **Analogy:** Showing an already-verified government ID at a gated office to skip long registration.

### 1.6 `POST /api/auth/forgot-password/send-otp`
- **Location:** `AuthController.forgotPasswordSendOtp`
- **What it does:** Sends OTP for password reset.
- **How it works:** `authService.sendForgotPasswordOtp(email)`.
- **Simple explanation:** Starts forgot-password flow by sending OTP to registered email.
- **Analogy:** Requesting a locksmith’s temporary verification code before lock reset.

### 1.7 `POST /api/auth/forgot-password/verify-otp`
- **Location:** `AuthController.forgotPasswordVerifyOtp`
- **What it does:** Verifies OTP from forgot-password flow.
- **How it works:** `authService.verifyForgotPasswordOtp(email, otp)`.
- **Simple explanation:** Confirms user owns the email before allowing password change.
- **Analogy:** Security guard checking your one-time gate pass before allowing entry.

### 1.8 `POST /api/auth/forgot-password/reset`
- **Location:** `AuthController.forgotPasswordReset`
- **What it does:** Resets password using verified OTP + new password.
- **How it works:** `authService.resetPasswordWithOtp(email, otp, newPassword)`.
- **Simple explanation:** Final step of password recovery: verifies OTP and writes new password.
- **Analogy:** Replacing a lost key after proving ownership with temporary code.

### 1.9 `POST /api/auth/login`
- **Location:** `AuthController.login`
- **What it does:** Regular credential login.
- **How it works:** Generates device fingerprint via `requestFingerprintService.fingerprint(request)` and authenticates with `authService.login`.
- **Simple explanation:** User logs in with credentials; backend also identifies device context for security.
- **Analogy:** Logging into email while system tracks device to detect suspicious attempts.

### 1.9A Auth middleware session-integrity rule
- **Location:** `backend/src/main/java/com/iqms/backend/security/AuthInterceptor.java`
- **What it does:** Validates bearer token and confirms token subject user still exists in database before allowing any protected route.
- **How it works:** `TokenService.validateAndGetUserId(token)` + `UserRepository.existsById(userId)` gate. Missing user now returns `401 Session no longer valid. Please sign in again.`
- **Simple explanation:** Even if a token is syntactically valid, the request is blocked when its user account no longer exists, preventing misleading downstream errors like `User not found` during sheet operations.
- **Analogy:** A badge scanner that checks both badge authenticity and whether the employee is still active.

### 1.10 `GET /api/auth/google/client-config`
- **Location:** `AuthController.googleClientConfig`
- **What it does:** Returns Google auth client configuration visibility to frontend.
- **How it works:** Reads config from `GoogleTokenVerifierService`, returns enabled/configured flags + clientId.
- **Simple explanation:** Frontend uses this to know whether Google login button should be active and what clientId to use.
- **Analogy:** Asking event desk which gate is open and what pass format is needed.

---

## 2) Sheet APIs (`/api/sheets`)
Base controller: `backend/src/main/java/com/iqms/backend/sheet/SheetController.java`

### 2.1 `GET /api/sheets`
Lists all sheets user can access (owned + shared access).

### 2.2 `POST /api/sheets`
Creates a new sheet with title for current user.

### 2.3 `GET /api/sheets/{sheetId}`
Fetches a sheet only if current user has access.

### 2.4 `PUT /api/sheets/{sheetId}`
Updates owner-controlled sheet data (title/description/topics/tags/public/archive/sharing progress flags).

**Notes:**
- Accepts and persists full metadata updates used by editor drawer flows (title, description, visibility flags).
- Current frontend now upserts active-sheet metadata into local list state even when editor is opened by direct URL first.

### 2.5 `PUT /api/sheets/{sheetId}/sharing`
Updates sheet sharing visibility and comments-enabled settings.

### 2.6 `POST /api/sheets/{sheetId}/invite`
Invites collaborator by username/role for a sheet.

### 2.7 `GET /api/sheets/{sheetId}/comments`
Returns collaboration comments on a sheet.

### 2.8 `POST /api/sheets/{sheetId}/comments`
Adds a comment (optionally linked to topic/subtopic/question).

### 2.9 `GET /api/sheets/{sheetId}/activity`
Returns activity timeline for sheet collaboration changes.

### 2.10 `GET /api/sheets/{sheetId}/ai/suggest-next`
Runs AI suggestion service to recommend next learning action for that sheet.

### 2.11 `POST /api/sheets/{sheetId}/remix`
Creates a remix/derived copy of an existing accessible sheet.

### 2.12 `POST /api/sheets/{sheetId}/copy`
Copies a public sheet into current user’s library.

**Notes:**
- Copy preserves source description and content metadata.
- Owner-scoped duplicate names are auto-suffixed as `(1)`, `(2)`, etc.
- Designed to be called from public profile sheet URLs where frontend first resolves canonical source sheet id.

### 2.13 `DELETE /api/sheets/{sheetId}`
Deletes an owned sheet.

### 2.14 `GET /api/sheets/shared/{shareId}`
Fetches a sheet by share ID (share link style access).

### 2.15 `POST /api/sheets/{sheetId}/engagement`
Tracks engagement action (view/copy/etc. action value in request) and returns updated engagement metrics.

### 2.16 `GET /api/sheets/public-catalog`
Returns lightweight metadata for public, non-archived sheets so the `/explore` page can render normal canonical links such as `/sheets/{username}/{sheetSlug}`. The payload excludes sheet content, private progress, emails, and auth data.

> **Simple explanation for the full sheet module:**
> These endpoints are the core product engine. They let a user create, read, edit, share, collaborate, and analyze study sheets end-to-end.
>
> **Analogy:** A Google Docs-like API set, but tailored for interview/study question sheets with learning intelligence.

---

## 3) Profile APIs (`/api/profile`)
Base controller: `backend/src/main/java/com/iqms/backend/profile/ProfileController.java`

### 3.1 `GET /api/profile`
Returns current user profile payload + owner sheets + premium/follow stats.

### 3.2 `PUT /api/profile`
Updates editable profile data (name/email/username/bio/social links), enforces username/email limits and uniqueness.

### 3.3 `GET /api/profile/shared/{profileShareId}`
Reads shared profile payload by profile share id.

### 3.4 `GET /api/profile/public/{username}`
Reads public profile by username.

### 3.5 `GET /api/profile/view/{username}`
Reads public profile with viewer context (viewer-specific flags via current user id).

### 3.6 `GET /api/profile/public/{username}/{sheetSlug}`
Reads public sheet under that profile slug.

Frontend canonical URLs for public sheet pages are now `/sheets/{username}/{sheetSlug}`. The profile API remains the read source for those public sheet pages.

### 3.7 `POST /api/profile/follow/{username}`
Current user follows the target username; updates follower/following links on both user records.

### 3.8 `DELETE /api/profile/follow/{username}`
Current user unfollows target username.

> **Simple explanation for the full profile module:**
> This module handles identity and social layer: who you are, what others can see, and who follows whom.
>
> **Analogy:** LinkedIn profile + follow system, but integrated into a study-sheet platform.

---

## 4) Study Team APIs (`/api/teams`)
Base controller: `backend/src/main/java/com/iqms/backend/controller/StudyTeamController.java`

### 4.1 `GET /api/teams`
List teams associated with current user.

### 4.2 `POST /api/teams`
Create new team (team name + mode).

### 4.3 `POST /api/teams/{teamId}/invite`
Invite user into team with role.

### 4.4 `POST /api/teams/{teamId}/assign-sheet/{sheetId}`
Assign a sheet to the team.

### 4.5 `GET /api/teams/{teamId}/dashboard/admin`
Admin dashboard view for team insights/progress.

### 4.6 `GET /api/teams/{teamId}/dashboard/member`
Member dashboard view for personal team progress.

> **Simple explanation:** Teams APIs enable collaborative preparation: create groups, invite peers, assign learning material, and monitor progress.
>
> **Analogy:** A classroom management panel where teacher assigns worksheets and students track completion.

---

## 5) Notifications APIs (`/api/notifications`)
Base controller: `backend/src/main/java/com/iqms/backend/notification/RevisionNotificationController.java`

### Endpoints
- `GET /api/notifications` — paginated fetch with optional `type`, `status` filters.
- `GET /api/notifications/unread-count` — unread notification count.
- `POST /api/notifications/alarms` — create reminder/alarm.
- `POST /api/notifications/mark-all-read` — bulk mark read.
- `POST /api/notifications/{notificationId}/read` — mark one read.
- `POST /api/notifications/{notificationId}/done` — mark task/reminder done.
- `POST /api/notifications/{notificationId}/dismiss` — dismiss alert.
- `POST /api/notifications/{notificationId}/archive` — archive alert.
- `DELETE /api/notifications/{notificationId}` — delete one notification.
- `DELETE /api/notifications` — clear all user notifications.
- `POST /api/notifications/{notificationId}/snooze` — postpone by minutes.
- `POST /api/notifications/{notificationId}/reschedule` — change scheduled datetime.
- `POST /api/notifications/{notificationId}/overdue` — force state to overdue.
- `POST /api/notifications/push-subscriptions` — register browser/device push subscription.

**How it works:** Every route extracts current user id and delegates to `RevisionNotificationService`, which enforces ownership and notification-state transitions.

**Simple explanation:** This module controls the reminder inbox lifecycle from “new” to “done/archived/deleted,” plus push registration.

**Analogy:** Similar to a task app notification center where reminders can be snoozed, completed, or archived.

---

## 6) Notification Preferences APIs (`/api/notification-preferences`)
Base controller: `backend/src/main/java/com/iqms/backend/notification/NotificationPreferencesController.java`

- `GET /api/notification-preferences` — fetch user preferences.
- `POST /api/notification-preferences` — update preferences.

**How it works:** Delegates to `NotificationPreferencesService` with current user context.

**Simple explanation:** Stores how user wants to receive reminders/alerts.

**Analogy:** Phone settings page for which notifications are allowed.

---

## 7) Difficulty Category APIs (`/api/difficulty-categories`)
Base controller: `backend/src/main/java/com/iqms/backend/controller/DifficultyCategoryController.java`

### 7.1 `GET /api/difficulty-categories`
Returns default difficulty buckets + user custom categories.

### 7.2 `POST /api/difficulty-categories`
Creates custom difficulty category with validation (name length, unique name, hex color).

**Simple explanation:** Lets user tag questions with difficulty labels beyond defaults.

**Analogy:** Adding your own priority labels in a task manager (e.g., “Super Hard”, color-coded).

---

## 8) Premium APIs (`/api/premium/*` and `/api/payments/razorpay/*`)
Base controller: `backend/src/main/java/com/iqms/backend/controller/PremiumController.java`

- `GET /api/premium/plans` — list available paid plans.
- `GET /api/premium/status` — current user premium entitlement/status.
- `POST /api/payments/razorpay/order` — create Razorpay order and persist pending payment order.
- `POST /api/payments/razorpay/verify` — verify signature/payment state, finalize premium activation.

**How it works:** Payment routes validate plan and payment artifacts, persist payment order audit state, verify gateway result, then extend premium validity.

**Simple explanation:** This is subscription billing backend from plan selection to successful entitlement grant.

**Analogy:** E-commerce checkout where order is created first, then payment proof is verified before delivery is unlocked.

---

## 9) Application Submission APIs (`/api/applications`)
Base controller: `backend/src/main/java/com/iqms/backend/controller/ApplicationSubmissionController.java`

- `GET /api/applications/meta` — exposes allowed form fields + registration fee metadata.
- `POST /api/applications/create-order` — payment order for application fee.
- `POST /api/applications/verify-payment` — verifies payment and finalizes application submission.

**Simple explanation:** Used when user applies for a program/workflow that needs structured form + fee payment.

**Analogy:** University application portal API: fetch form options, pay fee, submit verified application.

---

## 10) Creator Discovery API (`/api/discovery`)
Base controller: `backend/src/main/java/com/iqms/backend/controller/CreatorDiscoveryController.java`

- `GET /api/discovery` — returns creator discovery feed payload.

**How it works:** Directly delegates to `CreatorDiscoveryService.discovery()`.

**Simple explanation:** Helps users discover creators/profiles/content worth following.

**Analogy:** Like an “Explore” page endpoint in social apps.

---

## 11) Share/Public Link APIs

### 11.1 Share Link Controller (`/shared`)
File: `backend/src/main/java/com/iqms/backend/controller/ShareLinkController.java`

- `GET /shared/sheet/{shareId}` — fetch shared sheet by public share id.
- `GET /shared/profile/{profileShareId}` — fetch shared profile by share id.

### 11.2 Public Profile Link Controller (`/profile`)
File: `backend/src/main/java/com/iqms/backend/controller/PublicProfileLinkController.java`

- `GET /profile/{username}` — public profile route.
- `GET /profile/{username}/{sheetSlug}` — public sheet route under username.

### 11.3 SEO sitemap endpoint

- `GET /sitemap-public-sheets.xml` — XML sitemap of public, non-archived sheets using canonical `/sheets/{username}/{sheetSlug}` URLs.

**Simple explanation:** These are unauthenticated-style public entry points used by shareable links.

**Analogy:** Anyone with the URL can open a read-only brochure page.

---

## 12) Coding Platform Profile APIs (`/api/platform-stats`)
Base controller: `backend/src/main/java/com/iqms/backend/controller/PlatformStatsController.java`

- `GET /api/platform-stats/{platform}?username={username}` — one-off authenticated stats fetch for a platform username.
- `GET /api/platform-stats/profiles` — returns the current user's saved platform profiles, platform catalog, cached stats, and aggregate totals.
- `POST /api/platform-stats/verification` — creates or refreshes a strict ownership verification code for `{ platform, username }`.
- `POST /api/platform-stats/profiles/{profileId}/verify` — checks public name/bio/about/profile text for the generated code and marks the profile verified only when the code is found.
- `POST /api/platform-stats/sync` — refreshes all verified profiles, stores cached stats snapshots on the user document, and returns measured API time plus frontend loading duration.
- `DELETE /api/platform-stats/profiles/{profileId}` — removes a pending or verified connected profile.

**How it works:** `PlatformProfileService` owns the user-specific add/verify/sync/delete flow. `PlatformStatsService` owns platform-specific API calls and public-profile verification probes.

**Supported sync sources:** LeetCode GraphQL, Codeforces REST, CodeChef community API, AtCoderProblems API, HackerRank public profile endpoint, Codewars public API, Exercism public API, GitHub public API, and best-effort public profile scraping for HackerEarth, Topcoder, SPOJ, Kattis, CodeSignal, CodinGame, and DMOJ. CSES is reported as unavailable because it does not expose per-user public stats.

**Public profile behavior:** `GET /api/profile/public/{username}` and `GET /api/profile/view/{username}` include `codingStats` with verified profiles only. Pending, failed, and private verification data never appear publicly.

**Simple explanation:** Users connect coding accounts once, prove ownership with a code, and then the app shows fast cached public stats instead of refetching slow platform APIs on every visit.

**Analogy:** Like linking verified social accounts to a portfolio, then periodically refreshing a public analytics card.

---

## Developer Notes / Mental Model
- **Controllers** are thin HTTP adapters.
- **Services** implement business rules, ownership checks, and workflows.
- **CurrentUser** provides authenticated user id for scoped operations.
- **DTO validation** (`@Valid`) protects input shape and basic integrity.
- **State-changing actions** (follow, payment verify, alarm actions, sheet edits) are centralized in service layer for consistency.

If you are onboarding: start by reading controller + corresponding service pair for any endpoint you plan to modify.
