# IQMS / Create Sheets Project Knowledge

This file is written for backend and DevOps interview preparation. It focuses on what you should be able to explain clearly: architecture, backend modules, database design, APIs, auth, deployment, CI/CD, environment variables, and how the frontend connects to the backend. Frontend details are kept to the basics.

## 1. Short Interview Summary

Interactive Question Management Sheet, also branded as Create Sheets, is a full-stack study-sheet platform for creating topic-wise DSA/coding sheets. Users can sign up, log in, create sheets, organize questions into topics and subtopics, track progress, set revision reminders, share/copy public sheets, collaborate with others, use profile/discovery features, and unlock premium features through Razorpay payments.

The project uses:

- Frontend: React + Vite SPA.
- State management: Zustand.
- Backend: Java 17 + Spring Boot 3.4.4.
- Database: MongoDB through Spring Data MongoDB.
- Cache: Redis support for stale-while-revalidate caching.
- Auth: custom HMAC-signed token flow, OTP email verification, Google ID token verification.
- Payments: Razorpay order creation and backend-side payment verification.
- Deployment: frontend deployable as static SPA, backend as Spring Boot service, Nginx reverse proxy config, Vercel rewrites, GitHub Actions CI.

A good one-minute explanation:

> My project is a full-stack learning productivity platform for creating and managing DSA question sheets. The frontend is a React/Vite SPA using Zustand stores and an API client layer. The backend is a Spring Boot REST API with MongoDB persistence. I implemented backend concerns like authentication, OTP verification, Google login, sheet CRUD, authorization, collaboration roles, notifications, premium entitlement checks, Razorpay payment verification, CORS, rate limiting, global exception handling, and CI checks. The frontend connects through environment-driven API base URLs and sends Bearer tokens to protected backend endpoints.

## 2. Product Features

Core user features:

- Account signup/login with email OTP verification.
- Google login through backend Google ID token verification.
- Create, edit, save, delete, archive, and duplicate question sheets.
- Organize sheet content as sheet -> topics -> subtopics -> questions.
- Track solved status, attempts, revision progress, and reminders.
- Import/export sheet data.
- Public profiles and public sheets.
- Copy/remix public sheets.
- Follow/unfollow creators.
- Collaboration through sheet visibility, collaborators, comments, and activity logs.
- Study teams/classroom mode with memberships, assigned sheets, and dashboards.
- Notifications, alarms, unread counts, snooze/reschedule/archive/delete flows.
- Premium/free plan limits and Razorpay-based premium activation.
- Platform stats integrations for coding profiles such as LeetCode, Codeforces, GitHub, etc.
- Discovery endpoint for trending creators and public sheets.

## 3. Tech Stack

### Backend

- Java 17
- Spring Boot 3.4.4
- Maven
- Spring Web
- Spring Data MongoDB
- Spring Data Redis
- Spring Validation
- Spring Mail
- Spring Security Crypto
- Google API Client for Google ID token verification
- Java HttpClient for Razorpay API calls
- JUnit 5, Mockito, Spring Boot Test, MockMvc

Important backend files:

- `backend/pom.xml`
- `backend/src/main/java/com/iqms/backend/IqmsBackendApplication.java`
- `backend/src/main/resources/application.properties`
- `backend/src/main/resources/application-dev.properties`

### Frontend Basics

- React 19
- Vite 7
- Zustand 5
- React Router DOM 7
- Tailwind CSS 4
- Chart.js
- Vitest + Testing Library
- `@hello-pangea/dnd` for drag-and-drop style interactions

Important frontend files:

- `package.json`
- `vite.config.js`
- `src/api/apiClient.js`
- `src/config/envConfig.js`
- `src/store/authStore.js`
- `src/store/sheetStore.js`

### DevOps / Deployment

- GitHub Actions CI in `.github/workflows/ci.yml`
- Vercel rewrite config in `vercel.json`
- Nginx reverse proxy config in `deploy/nginx-createsheets.conf`
- Backend runs on port `8080` by default.
- Vite dev server is configured/proxied for local API calls.
- Production frontend can call `https://api.createsheets.com` or same-origin `/api` depending on config.

## 4. High-Level Architecture

The project follows a clean client/store/API/server/database split:

```text
React SPA
  |
  | UI actions
  v
Zustand stores
  |
  | API wrapper calls
  v
Frontend API client
  |
  | HTTPS JSON + Bearer token
  v
Spring Boot REST controllers
  |
  | business logic
  v
Services
  |
  | persistence
  v
Spring Data repositories
  |
  v
MongoDB
```

Backend layering:

- Controller layer: HTTP routes, request validation, response shape.
- Service layer: business logic, permission checks, orchestration.
- Repository layer: MongoDB access.
- Model layer: MongoDB documents.
- Config/security layer: CORS, token auth, rate limiting, cache config, mail/payment properties.

## 5. Backend Package Map

Main backend package: `com.iqms.backend`

Important areas:

- `controller`: REST controllers for auth, premium, teams, discovery, applications, platform stats, etc.
- `sheet`: sheet controller/repository source files.
- `service`: core business services.
- `model`: MongoDB document models.
- `repository`: Spring Data Mongo repositories.
- `security`: token auth, auth interceptor, current user extraction, request fingerprinting, rate limiting.
- `config`: CORS, mail, Redis/SWR cache, Google config, Mongo startup verifier.
- `notification`: notification controllers/services.
- `profile`: profile and public profile APIs.
- `cache/swr`: Redis-backed stale-while-revalidate cache.
- `dto`: request/response DTOs.
- `exception`: global API exception handling.
- `queue`: serialized action queue for sheet mutations.

## 6. Core Backend Modules

### Auth Module

Main files:

- `AuthController`
- `AuthService`
- `TokenService`
- `GoogleTokenVerifierService`
- `LoginAttemptService`
- `AuthMailService`
- `UserRepository`
- `User`

What it does:

- Signup starts with user details and sends an OTP.
- OTP is hashed using BCrypt before storage.
- OTP expires after 10 minutes.
- OTP resend cooldown is 60 seconds.
- Too many invalid OTP attempts locks the OTP flow temporarily.
- Login supports username/email + password.
- Passwords are stored using BCrypt.
- Google login verifies a Google ID token server-side.
- Successful auth returns an `AuthResponse` containing user data and token.
- Frontend stores that token in localStorage and sends it as a Bearer token.

Important auth details:

- `SecurityConfig` defines a `BCryptPasswordEncoder(12)`.
- `TokenService` issues JWT-like HMAC-SHA256 tokens containing `sub`, `iat`, and `exp`.
- Default token expiration is 604800 seconds, or 7 days.
- `LoginAttemptService` locks a device fingerprint after repeated failed login attempts.
- `RequestFingerprintService` is used to identify request/device context.
- Google auth can be disabled if backend Google client IDs are not configured.

Interview explanation:

> I handled authentication on the backend using Spring services. Passwords are BCrypt-hashed, signup uses email OTP verification, Google login verifies the ID token server-side, and protected routes use a Bearer token checked by an interceptor. The frontend never directly trusts Google or payment results; it sends tokens/proofs to the backend for verification.

### Sheet Module

Main files:

- `SheetController`
- `SheetService`
- `SheetRepository`
- `Sheet`
- `SheetCollaborationService`
- `SheetComment`
- `SheetActivityEvent`

What it does:

- Create sheets.
- List sheets accessible to the current user.
- Fetch a sheet by ID if the user has permission.
- Update title, description, topics, topic tags, custom topics.
- Update visibility and comments settings.
- Archive sheets.
- Delete owned sheets.
- Share sheets by `shareId`.
- Copy public sheets.
- Remix discoverable sheets.
- Track engagement such as downloads/copies.

Sheet document shape:

- `id`
- `ownerId`
- `title`
- `description`
- `shareId`
- `createdAt`
- `updatedAt`
- `isPublic`
- `isArchived`
- `shareProgress`
- `visibility`: `private`, `public`, `unlisted`, or `team`
- `commentsEnabled`
- `parentSheetId`
- `remixSourceOwnerId`
- `downloadedByUsernames`
- `copiedByUsernames`
- `collaborators`
- `topics`
- `topicTags`
- `userCustomTopics`

Nested sheet content is stored in MongoDB as flexible nested maps/lists:

```text
Sheet
  topics[]
    subTopics[]
      questions[]
```

Why MongoDB fits:

- A sheet naturally looks like a document with nested arrays.
- The app often fetches a whole sheet for editing.
- Flexible question/topic metadata is easier to evolve in document form.

Important backend behavior:

- Sheet creation checks premium/free sheet limits.
- Sheet updates check editor/owner permission.
- Public/unlisted sheets can be copied/remixed.
- Copying can strip progress data unless the source owner shares progress.
- Engagement tracking deduplicates usernames using sets.
- `ActionQueueService` serializes certain mutations through a single-thread executor.

### Collaboration Module

Main file:

- `SheetCollaborationService`

What it does:

- Manages collaborator invite/update.
- Supports collaborator roles: `owner`, `editor`, `viewer`.
- Only owners can manage access.
- Editors can edit.
- Viewers can view.
- Public/unlisted sheets can be viewed based on visibility.
- Adds sheet comments.
- Reads sheet comments and activity events.
- Tracks activity events like `sheet_updated`, `invite_sent`, `comment_added`, `sheet_copied`, etc.

Interview explanation:

> Authorization is enforced server-side, not just in the UI. Even if a user tries to call the edit API manually, `SheetCollaborationService` checks whether they are owner/editor/viewer before allowing actions.

### Profile and Creator Module

Main files:

- `ProfileController`
- `ProfileShareService`
- `CreatorDiscoveryController`
- `CreatorDiscoveryService`

What it does:

- Current user profile read/update.
- Public profile by username or share ID.
- Public sheets under a creator profile.
- Follow/unfollow users.
- Follower/following counts.
- Creator stats like total views/copies.
- Discovery payload for trending creators, trending sheets, recently published sheets.

Important details:

- Username and email changes are limited to 7 changes.
- Public profile payload avoids exposing private auth data.
- Public sheets are filtered from the owner sheet list.

### Notification Module

Main files:

- `RevisionNotificationController`
- `RevisionNotificationService`
- `NotificationPreferencesController`
- `NotificationPreferencesService`
- `RevisionNotification`
- `NotificationPreferences`
- `PushSubscription`

What it does:

- Fetch notifications with pagination/filtering.
- Fetch unread count.
- Create manual alarms.
- Mark one or all notifications as read.
- Mark done, dismiss, archive, delete, clear all.
- Snooze or reschedule notifications.
- Register browser push subscriptions.
- Sync revision notifications from sheet question revision schedules.

Important behavior:

- Notifications are hydrated when the user fetches them.
- Revision reminders are generated from question-level revision dates.
- Overdue status is dynamic when scheduled time passes.
- Delete is implemented as soft delete by setting status to `deleted`.
- Recurring alarms can reschedule after completion.

### Premium and Payments Module

Main files:

- `PremiumController`
- `PremiumAccessService`
- `EntitlementService`
- `RazorpayService`
- `PremiumPaymentOrder`
- `PremiumPaymentOrderRepository`

What it does:

- Lists premium plans.
- Returns premium status.
- Creates Razorpay orders from backend.
- Stores pending payment orders in MongoDB.
- Verifies Razorpay signature on backend.
- Fetches payment details from Razorpay and validates order ID, amount, currency, and payment status.
- Activates premium only after backend verification succeeds.
- Applies monthly/yearly premium duration.
- Grants new users a 7-day premium trial.
- Enforces free-plan limits.

Free plan limits in code:

- 5 sheets.
- 50 topics.
- 50 subtopics.
- 100 questions.
- 50 words per entry.

Premium features checked by `EntitlementService`:

- `advanced_analytics`
- `advanced_ai`
- `premium_templates`
- `advanced_exports`
- `unlimited_collaborators`
- `team_unlimited_members`

Interview explanation:

> Payment security is backend-owned. The frontend starts Razorpay checkout only after receiving an order from the backend, then sends payment ID/order ID/signature back. The backend verifies the signature and payment details before changing the user's premium state.

### Team / Classroom Module

Main files:

- `StudyTeamController`
- `StudyTeamService`
- `StudyTeam`
- `TeamSheetProgress`

What it does:

- Create study teams.
- List teams for a user.
- Invite users to a team.
- Roles: `admin`, `mentor`, `student`.
- Assign sheets to teams.
- Admin dashboard with total members, active members, average progress, overdue revision count, top performers, low engagement.
- Member dashboard with assigned sheets, due counts, progress summary, recent activity.

### Application Submission Module

Main files:

- `ApplicationSubmissionController`
- `ApplicationSubmissionService`
- `ApplicationSubmission`

What it does:

- Provides application metadata.
- Creates Razorpay order for application registration fee.
- Validates application input.
- Verifies payment.
- Prevents duplicate paid/submitted applications by email/phone/field/month.

This is a good example to discuss backend validation and duplicate prevention.

### Platform Stats Module

Main files:

- `PlatformStatsController`
- `PlatformStatsService`

What it does:

- Fetches coding-platform public stats for usernames.
- Uses official or public endpoints when available.
- Supports LeetCode, Codeforces, CodeChef, AtCoder, HackerRank, HackerEarth, SPOJ, DMOJ, Codewars, Exercism, GitHub, and fallback notes for others.

This is a good module to discuss external API integration and failure handling.

### SWR Redis Cache Module

Main files:

- `SwrCacheService`
- `RedisCacheService`
- `CacheKeyBuilder`
- `SwrCacheConfig`
- `SwrCacheDemoController`

What it does:

- Implements stale-while-revalidate caching using Redis.
- On cache hit, returns cached data.
- If stale, serves stale response and triggers background refresh.
- On miss, loads fresh data and stores it with hard TTL.
- Uses Redis locks to avoid duplicate refreshes.
- Uses a thread pool with prefix `swr-refresh-`.

Config values:

- stale TTL default: 60 seconds.
- hard TTL default: 300 seconds.
- lock TTL default: 10 seconds.
- refresh retry delay default: 500 ms.
- refresh retry count default: 1.

Interview explanation:

> I added a Redis-backed stale-while-revalidate cache to improve response latency. The API can return cached data quickly, mark whether it is stale, and refresh in the background using a lock so multiple requests do not stampede the external service.

## 7. API Endpoint Map

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/signup/resend-otp`
- `POST /api/auth/signup/verify-otp`
- `POST /api/auth/google`
- `GET /api/auth/google`
- `GET /api/auth/google/client-config`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password/send-otp`
- `POST /api/auth/forgot-password/verify-otp`
- `POST /api/auth/forgot-password/reset`

### Sheets

- `GET /api/sheets`
- `POST /api/sheets`
- `GET /api/sheets/{sheetId}`
- `PUT /api/sheets/{sheetId}`
- `PUT /api/sheets/{sheetId}/sharing`
- `POST /api/sheets/{sheetId}/invite`
- `GET /api/sheets/{sheetId}/comments`
- `POST /api/sheets/{sheetId}/comments`
- `GET /api/sheets/{sheetId}/activity`
- `GET /api/sheets/{sheetId}/ai/suggest-next`
- `POST /api/sheets/{sheetId}/remix`
- `POST /api/sheets/{sheetId}/copy`
- `DELETE /api/sheets/{sheetId}`
- `GET /api/sheets/shared/{shareId}`
- `POST /api/sheets/{sheetId}/engagement`

### Profile

- `GET /api/profile`
- `PUT /api/profile`
- `GET /api/profile/shared/{profileShareId}`
- `GET /api/profile/public/{username}`
- `GET /api/profile/view/{username}`
- `GET /api/profile/public/{username}/{sheetSlug}`
- `POST /api/profile/follow/{username}`
- `DELETE /api/profile/follow/{username}`

### Notifications

- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `POST /api/notifications/alarms`
- `POST /api/notifications/mark-all-read`
- `POST /api/notifications/{notificationId}/read`
- `POST /api/notifications/{notificationId}/done`
- `POST /api/notifications/{notificationId}/dismiss`
- `POST /api/notifications/{notificationId}/archive`
- `DELETE /api/notifications/{notificationId}`
- `DELETE /api/notifications`
- `POST /api/notifications/{notificationId}/snooze`
- `POST /api/notifications/{notificationId}/reschedule`
- `POST /api/notifications/{notificationId}/overdue`
- `POST /api/notifications/push-subscriptions`

### Notification Preferences

- `GET /api/notification-preferences`
- `POST /api/notification-preferences`

### Premium / Payments

- `GET /api/premium/plans`
- `GET /api/premium/status`
- `POST /api/payments/razorpay/order`
- `POST /api/payments/razorpay/verify`

### Teams

- `GET /api/teams`
- `POST /api/teams`
- `POST /api/teams/{teamId}/invite`
- `POST /api/teams/{teamId}/assign-sheet/{sheetId}`
- `GET /api/teams/{teamId}/dashboard/admin`
- `GET /api/teams/{teamId}/dashboard/member`

### Other APIs

- `GET /api/discovery`
- `GET /api/difficulty-categories`
- `POST /api/difficulty-categories`
- `GET /api/platform-stats/{platform}?username=...`
- `GET /api/swr/resource?resource=...`
- `GET /api/applications/meta`
- `POST /api/applications/create-order`
- `POST /api/applications/verify-payment`

## 8. MongoDB Collections

Main collections implied by models/repositories:

- `users`
- `sheets`
- `sheet_comments`
- `sheet_activity_events`
- `sheet_copy_events`
- `study_teams`
- `team_sheet_progress`
- `revision_notifications`
- `notification_preferences`
- `push_subscriptions`
- `premium_payment_orders`
- `application_submissions`

Important indexed fields:

- `User.email` is unique.
- `User.username` is unique.
- `User.profileShareId` is unique.
- `Sheet.ownerId` is indexed.
- `Sheet.shareId` is unique.

Why indexes matter:

- Login/profile lookup needs fast email/username queries.
- Public share links need fast `shareId` lookup.
- Listing sheets by owner needs owner-based lookup.
- Unique indexes prevent duplicate accounts/share IDs.

## 9. Security Model

### Password and OTP Security

- Passwords are BCrypt-hashed.
- OTPs are BCrypt-hashed before storage.
- OTP expiry and lockout are implemented.
- OTP resend cooldown prevents spam.

### Token Auth

- `TokenService` issues HMAC-SHA256 signed tokens.
- The token contains user ID as `sub`.
- `AuthInterceptor` checks `Authorization: Bearer <token>`.
- On success, it stores the authenticated user ID on the request.
- `CurrentUser` reads this authenticated ID for controllers/services.

### Protected Routes

`WebMvcConfig` registers `AuthInterceptor` for protected API patterns including:

- `/api/profile/**`
- `/api/difficulty-categories/**`
- `/api/sheets/**`
- `/api/notifications/**`
- `/api/notification-preferences/**`
- `/api/premium/status`
- `/api/payments/razorpay/order`
- `/api/payments/razorpay/verify`
- `/api/teams/**`
- `/api/platform-stats/**`

Some public routes are excluded, such as public/shared profile and shared sheet routes.

### Rate Limiting

- Login lockout is handled by `LoginAttemptService`.
- Application submission routes are protected by `RequestRateLimitInterceptor`.
- Application route limit: 5 requests per 10 seconds, then 5-second cooldown.

### CORS

- CORS is handled by a servlet `CorsFilter` bean in `CorsConfig`.
- Allowed origins are configured through environment variables.
- Allowed methods include `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`.
- Credentials are allowed.
- Nginx also adds CORS headers for API proxy routes.

### Global Error Handling

`GlobalExceptionHandler` normalizes errors for frontend consumption:

- Validation errors become structured `400` responses.
- Duplicate keys become `409`.
- Database errors become `503`.
- Rate-limit/custom API errors include code and retry fields.
- Unhandled errors become `500` with a safe message.

## 10. Frontend and Backend Connection Basics

You only need the basics for interviews:

1. Frontend UI calls Zustand store actions.
2. Store actions call API modules such as `authApi.js`, `sheetApi.js`, `profileApi.js`.
3. API modules call the shared `apiRequest` function in `src/api/apiClient.js`.
4. `apiRequest` builds the full URL from `API_BASE_URL`.
5. For protected endpoints, the frontend passes the token.
6. `apiRequest` sends `Authorization: Bearer <token>`.
7. Backend `AuthInterceptor` validates the token.
8. Controller extracts current user and delegates to services.
9. Services persist/read data through Mongo repositories.
10. JSON response returns to frontend and Zustand updates UI state.

### API Base URL Resolution

Frontend config is in:

- `src/config/envConfig.js`
- `src/config/apiConfig.js`

Behavior:

- `VITE_API_BASE_URL` can override the API base.
- On `createsheets.com`, frontend uses `https://api.createsheets.com`.
- On other deployed hosts, it can fall back to same-origin.
- In local development, it falls back to `/api`.
- Vite dev server proxies `/api` to `http://localhost:8080`.

### Login Flow

```text
Login form
  -> authStore.login()
  -> loginUser()
  -> apiRequest("/api/auth/login")
  -> AuthController.login()
  -> AuthService.login()
  -> PasswordEncoder checks BCrypt password
  -> TokenService issues token
  -> AuthResponse returned
  -> authStore stores currentUser in localStorage
```

### Sheet Save Flow

```text
User edits sheet
  -> sheetStore updates Zustand state
  -> save/persist action calls saveSheet()
  -> apiRequest("PUT /api/sheets/{sheetId}", token + payload)
  -> AuthInterceptor validates Bearer token
  -> SheetController.updateSheet()
  -> SheetService.updateOwnedSheet()
  -> SheetCollaborationService checks permission
  -> SheetRepository saves MongoDB document
  -> frontend updates saved state
```

## 11. Local Development Commands

### Backend

```bash
cd backend
mvn spring-boot:run
```

Default backend URL:

```text
http://localhost:8080
```

Run backend tests:

```bash
cd backend
mvn test
```

Build backend jar:

```bash
cd backend
mvn clean package
```

### Frontend

Install dependencies:

```bash
npm install
```

Run dev server:

```bash
npm run dev
```

Important note:

- `vite.config.js` says port `5173`.
- `package.json` script passes `--port 5172`.
- CLI args usually win, so check the terminal output to know the real port.

Run frontend checks:

```bash
npm run lint
npm run build
npm run test
```

## 12. Environment Variables

Do not hardcode secrets. In interview, say these are configured through environment variables.

### Frontend

Important frontend env vars:

- `VITE_API_BASE_URL`
- `VITE_APP_AUTH_GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_APP_AUTH_GOOGLE_CLIENT_IDS`
- `VITE_GOOGLE_CLIENT_IDS`
- `VITE_GOOGLE_AUTH_ALLOWED_ORIGINS`
- `VITE_RAZORPAY_KEY_ID`
- `VITE_APP_NAME`

### Backend

Important backend env vars:

- `MONGODB_URI`
- `APP_AUTH_SECRET`
- `APP_AUTH_EXPIRATION_SECONDS`
- `APP_AUTH_GOOGLE_CLIENT_ID`
- `APP_AUTH_GOOGLE_CLIENT_IDS`
- `APP_AUTH_OTP_BYPASS_KEY`
- `APP_CORS_ALLOWED_ORIGINS`
- `APP_CORS_ALLOWED_ORIGIN_PATTERNS`
- `APP_MAIL_ENABLED`
- `APP_MAIL_HOST`
- `APP_MAIL_PORT`
- `APP_MAIL_USERNAME`
- `APP_MAIL_PASSWORD`
- `APP_MAIL_FROM`
- `APP_MAIL_FROM_NAME`
- `APP_MAIL_AUTH`
- `APP_MAIL_STARTTLS`
- `APP_PAYMENT_RAZORPAY_ENABLED`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `REDIS_TIMEOUT`
- `MONGO_STARTUP_PING_ENABLED`

DevOps note:

- `.env` files should not be committed.
- Real credentials should never be placed in `.env.example`.
- If real-looking secrets were ever committed, rotate them.
- Add `.env`, `backend/.env`, `backend/target`, and other generated files to ignore rules.

## 13. Deployment Knowledge

### Frontend Deployment

Frontend is a Vite SPA, so production build creates static assets:

```bash
npm run build
```

The output is normally `dist/`.

Deployment options:

- Vercel
- Netlify
- Nginx static hosting
- S3 + CloudFront
- Any static file server

### Vercel Routing

`vercel.json` does two important things:

- Proxies `/api/*` to a backend server.
- Rewrites all other routes to `/index.html` so React Router deep links work.

This matters because SPA routes like `/login` or `/profile/user` must load the React app, not return 404 from the static host.

### Backend Deployment

Backend is a Spring Boot app:

```bash
cd backend
mvn clean package
java -jar target/iqms-backend-0.0.1-SNAPSHOT.jar
```

Backend needs:

- Java 17 runtime.
- MongoDB connection string.
- Strong `APP_AUTH_SECRET`.
- Correct CORS origins.
- Optional SMTP config for OTP email.
- Optional Redis config for SWR cache.
- Optional Razorpay config for payments.

### Nginx Reverse Proxy

`deploy/nginx-createsheets.conf` shows two deployment styles:

- `www.createsheets.com` serves frontend static files and proxies `/api/` to backend.
- `api.createsheets.com` proxies all traffic to backend on `localhost:8080`.

It also:

- Redirects HTTP to HTTPS.
- Uses Let's Encrypt certificate paths.
- Sets proxy headers such as `X-Forwarded-For` and `X-Forwarded-Proto`.
- Handles CORS preflight `OPTIONS`.

### CI/CD

GitHub Actions workflow:

- Runs on pushes to `main` and pull requests.
- Frontend job:
  - Node.js 20
  - `npm ci`
  - `npm run lint`
  - `npm run build`
  - `npm run test --if-present`
- Backend job:
  - Java 17 Temurin
  - Maven cache
  - `mvn test`

Good DevOps interview explanation:

> The CI pipeline validates both halves of the monorepo. Frontend checks install from lockfile, lint, build, and run tests. Backend checks set up Java 17 and run Maven tests. For production, I would extend it with artifact upload, Docker image build, environment-specific deploy steps, secret scanning, and health checks.

## 14. Testing

Frontend tests:

- Vitest
- jsdom
- Testing Library
- Tests cover API client behavior, auth store flows, sheet store behavior, notifications, import validation, premium, public sheet copy, etc.

Backend tests:

- JUnit 5
- Mockito
- Spring MockMvc
- Tests cover sheet service, sheet controller, premium access, entitlements, and collaboration service.

Examples:

- `SheetServiceTest` tests default sheet title, mutable updates, not-found behavior, delete.
- `SheetControllerTest` tests API responses, validation errors, lightweight list payload, structured errors.
- `apiClient.test.js` tests JSON parsing, network errors, normalized API errors.
- `authStore.test.js` tests signup/OTP/login lock behavior.

## 15. Important Design Decisions

### Why Spring Boot?

- Strong REST API support.
- Dependency injection and service layering.
- Good validation/error-handling ecosystem.
- Easy MongoDB integration through Spring Data.
- Suitable for enterprise backend/DevOps interviews.

### Why MongoDB?

- Sheet content is nested and document-shaped.
- Flexible schema works for evolving question metadata.
- One sheet can be fetched as one document for editing.

### Why Zustand?

- Lightweight frontend state management.
- Store actions map well to domain operations.
- Easier than Redux for this project size.

### Why Backend Verification for Google and Razorpay?

- Frontend data can be tampered with.
- Google ID tokens and Razorpay signatures must be verified server-side.
- Premium should only activate after backend validates signature, order ID, amount, currency, and payment status.

### Why Environment-Based Config?

- Same code can run locally, on Vercel, or behind Nginx.
- Secrets stay outside source code.
- CORS/API base URLs can differ by environment.

## 16. Backend Interview Talking Points

Use these as polished talking points:

- I built a layered Spring Boot backend with controllers, services, repositories, DTOs, models, and global exception handling.
- I used MongoDB because the primary sheet model is nested and document-oriented.
- I implemented token-based auth using an interceptor that validates Bearer tokens before protected endpoints.
- I used BCrypt for password hashing and OTP hashing.
- I added OTP expiry, resend cooldown, and lockout for invalid attempts.
- I integrated Google login by verifying Google ID tokens on the backend.
- I implemented backend-side Razorpay order creation and payment signature verification.
- I built server-side authorization for sheet collaboration, so roles are enforced even if someone bypasses the frontend.
- I used Spring Data repositories and Mongo indexes for user, sheet, profile, and notification lookups.
- I added structured error handling so the frontend receives predictable error payloads.
- I configured CORS using a `CorsFilter` because the project uses Spring MVC without full Spring Security web filter setup.
- I added request rate limiting for sensitive public flows like application submissions.
- I added Redis SWR caching to support low-latency responses and background refresh.
- I added CI with separate frontend and backend jobs.

## 17. DevOps Interview Talking Points

- The frontend is built as static assets with Vite and can be deployed to Vercel or served by Nginx.
- The backend is packaged as a Spring Boot jar and runs on Java 17.
- Runtime configuration is environment-driven.
- The app uses separate frontend and backend origins, so CORS and reverse proxy config are important.
- `vercel.json` proxies `/api/*` and rewrites SPA routes to `index.html`.
- Nginx config terminates HTTPS and proxies API traffic to `localhost:8080`.
- GitHub Actions CI validates frontend lint/build/tests and backend Maven tests.
- MongoDB startup verification can fail fast if database connectivity is broken.
- Redis is configured through env vars for caching.
- In production, secrets should be managed through platform secret stores, not committed files.

## 18. Things To Be Honest About / Improvement Areas

These are good improvement points to mention if asked:

- Add Dockerfile and docker-compose for repeatable local/prod environments.
- Add Spring Boot Actuator health checks.
- Add centralized logging/metrics/tracing.
- Add stronger secret hygiene: ignore `.env`, remove real-looking secrets from examples, rotate exposed values.
- Add backend API documentation with OpenAPI/Swagger.
- Add database migrations or schema/index management strategy.
- Improve auth by using a mature JWT library instead of manual JSON parsing/signing.
- Add refresh tokens/session invalidation if needed.
- Add integration tests with test containers for MongoDB/Redis.
- Add deployment pipeline stages after CI.
- Add rate limiting to more public endpoints.
- Add Docker image build and vulnerability scanning.
- Add `.gitignore` entries for `backend/target`.

## 19. Common Interview Questions And Answers

### What is your project?

It is a full-stack coding interview preparation platform where users create structured DSA question sheets, track progress, schedule revisions, share sheets publicly, collaborate with others, and use premium workflows.

### What backend stack did you use?

Java 17, Spring Boot 3.4.4, Spring Web, Spring Data MongoDB, Spring Data Redis, Spring Validation, Spring Mail, Spring Security Crypto, Maven, JUnit/Mockito/MockMvc.

### What database did you use and why?

MongoDB. The core sheet data is hierarchical and document-shaped: sheet -> topics -> subtopics -> questions. MongoDB lets the backend store and retrieve that nested structure naturally.

### How does authentication work?

Signup creates or updates a pending user and sends an OTP. OTPs and passwords are BCrypt-hashed. After OTP verification or login, backend returns an HMAC-signed token. Protected APIs require `Authorization: Bearer <token>`, which is validated by `AuthInterceptor`.

### How does frontend connect to backend?

The frontend has API modules that call a shared `apiRequest` wrapper. The API base URL comes from environment config. Locally, `/api` is proxied by Vite to Spring Boot. In production, it can call `https://api.createsheets.com` or use same-origin proxying.

### How are protected APIs secured?

`WebMvcConfig` registers `AuthInterceptor` for protected route patterns. The interceptor checks Bearer token validity and stores the authenticated user ID in the request. Controllers then use `CurrentUser` to access it.

### How do you handle authorization?

Authentication only proves who the user is. Authorization is done inside services. For example, `SheetCollaborationService` checks owner/editor/viewer roles before allowing sheet edits, comments, sharing changes, or activity access.

### How do payments work?

Frontend asks backend to create a Razorpay order. Backend creates the order and stores it as pending. After checkout, frontend sends payment ID/order ID/signature to backend. Backend verifies signature and payment details with Razorpay before activating premium.

### What DevOps work is present?

There is GitHub Actions CI, environment-based config, Vercel rewrites for SPA/API routing, Nginx reverse proxy config with HTTPS and API proxying, Mongo startup verification, and Redis cache configuration.

### What would you improve next?

I would add Docker/Docker Compose, Actuator health endpoints, OpenAPI docs, stronger secret management, test containers for Mongo/Redis, production deployment pipeline, and artifact/container image publishing.

## 20. Resume Bullet Ideas

- Built a Spring Boot REST backend for a full-stack study-sheet platform with MongoDB persistence, token auth, OTP verification, Google login, and structured API error handling.
- Implemented sheet CRUD, nested document persistence, public sharing, copy/remix workflows, collaborator roles, comments, and activity tracking.
- Integrated Razorpay payments with backend-side order creation, signature verification, payment validation, and premium entitlement activation.
- Added notification and alarm APIs with unread counts, snooze/reschedule/archive flows, push subscription registration, and revision reminder hydration from sheet data.
- Configured CORS, environment-driven runtime config, Nginx reverse proxy rules, Vercel SPA/API rewrites, and GitHub Actions CI for frontend/backend checks.
- Built Redis stale-while-revalidate caching with background refresh, TTLs, and Redis locks to reduce repeated external API calls.

## 21. Files You Should Know

Backend:

- `backend/pom.xml`
- `backend/src/main/resources/application.properties`
- `backend/src/main/resources/application-dev.properties`
- `backend/src/main/java/com/iqms/backend/controller/AuthController.java`
- `backend/src/main/java/com/iqms/backend/service/AuthService.java`
- `backend/src/main/java/com/iqms/backend/security/TokenService.java`
- `backend/src/main/java/com/iqms/backend/security/AuthInterceptor.java`
- `backend/src/main/java/com/iqms/backend/security/WebMvcConfig.java`
- `backend/src/main/java/com/iqms/backend/config/CorsConfig.java`
- `backend/src/main/java/com/iqms/backend/sheet/SheetController.java`
- `backend/src/main/java/com/iqms/backend/sheet/SheetService.java`
- `backend/src/main/java/com/iqms/backend/model/Sheet.java`
- `backend/src/main/java/com/iqms/backend/model/User.java`
- `backend/src/main/java/com/iqms/backend/controller/PremiumController.java`
- `backend/src/main/java/com/iqms/backend/service/RazorpayService.java`
- `backend/src/main/java/com/iqms/backend/notification/RevisionNotificationService.java`
- `backend/src/main/java/com/iqms/backend/cache/swr/SwrCacheService.java`
- `backend/src/main/java/com/iqms/backend/exception/GlobalExceptionHandler.java`

Frontend connection basics:

- `src/config/envConfig.js`
- `src/config/apiConfig.js`
- `src/api/apiClient.js`
- `src/api/authApi.js`
- `src/api/sheetApi.js`
- `src/store/authStore.js`
- `src/store/sheetStore.js`
- `vite.config.js`

DevOps:

- `.github/workflows/ci.yml`
- `vercel.json`
- `deploy/nginx-createsheets.conf`
- `.env.example`
- `backend/.env.example`

## 22. Final Mental Model

Think of the project as three main parts:

1. Product frontend: React UI and Zustand state.
2. Backend API: Spring Boot services enforcing rules, auth, payments, notifications, and persistence.
3. Operations layer: environment variables, CORS, CI, Vercel/Nginx routing, MongoDB, Redis, SMTP, Razorpay.

For backend interviews, emphasize service layering, auth, authorization, MongoDB modeling, payment verification, validation, and error handling.

For DevOps interviews, emphasize CI, environment config, reverse proxying, CORS, production secrets, Java deployment, Mongo/Redis dependencies, and what you would improve next.
