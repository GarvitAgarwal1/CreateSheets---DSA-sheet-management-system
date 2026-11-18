# Backend Description

Location: project root, `BACKEND_DESCRIPTION.md`.

This document explains the CreateSheets backend in a way that is useful for interview preparation and codebase orientation. It focuses on what each backend folder and file does, how requests move from controllers to services to repositories, and which files are involved in the important backend flows.

## Backend At A Glance

The backend is a Java Spring Boot application under `backend/`. It exposes REST APIs, stores data in MongoDB, uses Redis for public and private cache layers, supports JWT-like signed bearer tokens, handles authentication, sheet management, public sharing, SEO sitemaps, premium payments, feedback mail, notifications, platform stats, and study teams.

Normal request flow:

1. HTTP request reaches Spring Boot.
2. `CorsConfig` handles CORS before the request gets to controllers.
3. `WebMvcConfig` applies interceptors:
   - `NoIndexHeaderInterceptor` adds `X-Robots-Tag` to `/api/**`.
   - `AuthInterceptor` protects private API routes.
   - `RequestRateLimitInterceptor` throttles feedback/application routes.
4. A controller receives the request and reads path/body/query data.
5. The controller calls a service for business logic.
6. The service calls repositories, cache services, mail services, payment services, or external APIs.
7. Repositories read/write MongoDB documents.
8. DTOs shape request and response payloads.
9. `GlobalExceptionHandler` converts errors into structured API responses.

Important backend technologies:

- Spring Boot Web for controllers and JSON APIs.
- Spring Data MongoDB for persistence.
- Redis for public read cache, private sheet cache, and SWR cache examples.
- JavaMailSender for OTP and feedback email.
- Razorpay HTTP API for payments.
- Google ID token verifier for Google login.
- Maven for build and tests.
- Dockerfile for containerized production runtime.

## Main Request Flows

### Authentication Flow

Entry file: `backend/src/main/java/com/iqms/backend/controller/AuthController.java`

Flow:

1. `AuthController` receives `/api/auth/signup`, `/login`, OTP, forgot-password, and Google auth requests.
2. It calls `AuthService`.
3. `AuthService` validates input, checks `UserRepository`, hashes passwords or OTPs with `PasswordEncoder`, sends OTP through `AuthMailService`, verifies Google tokens through `GoogleTokenVerifierService`, applies login limits through `LoginAttemptService`, and issues signed tokens through `TokenService`.
4. `UserRepository` persists and loads `User` documents from MongoDB.
5. The response is usually `AuthResponse`, which includes user profile data, premium state, and an auth token.

### Private Sheet CRUD Flow

Entry file: `backend/src/main/java/com/iqms/backend/sheet/SheetController.java`

Flow:

1. `WebMvcConfig` protects `/api/sheets/**` except public sheet/catalog routes.
2. `AuthInterceptor` validates `Authorization: Bearer ...` and stores the user id on the request.
3. `SheetController` uses `CurrentUser` to read the authenticated user id.
4. `SheetController` calls `SheetService` for create, list, get, update, sharing, copy, remix, delete, and engagement.
5. `SheetService` uses `ActionQueueService` for serialized sheet mutations, `PremiumAccessService` for limits, `SheetCollaborationService` for access checks, `SheetRepository` for MongoDB, and Redis cache services for read/write performance.
6. After mutations, `SheetService` invalidates public and private cache keys.

### Public Explore And Featured Sheets Flow

Entry file: `backend/src/main/java/com/iqms/backend/controller/FeaturedSheetsController.java`

Flow:

1. Public frontend pages call `/api/sheets/featured`, `/api/sheets/admin-catalog`, or `/api/sheets/public-catalog`.
2. `FeaturedSheetsController` calls `FeaturedSheetsService`.
3. `FeaturedSheetsService` uses `PublicReadCacheService` first. On cache miss, it reads public sheets through `SheetRepository` and admin user info through `UserRepository`.
4. Responses are lightweight DTOs: `FeaturedSheetResponse` or `PublicSheetCatalogResponse`.
5. `/api/sheets/public-catalog` presents public catalog sheets under the configured `CreateSheets` username alias when needed, while still filtering to public, non-archived sheets.

### Public Profile And Public Sheet Flow

Entry files:

- `backend/src/main/java/com/iqms/backend/profile/ProfileController.java`
- `backend/src/main/java/com/iqms/backend/controller/PublicProfileLinkController.java`
- `backend/src/main/java/com/iqms/backend/controller/ShareLinkController.java`

Flow:

1. Public profile APIs use `/api/profile/public/{username}` and `/api/profile/public/{username}/{sheetSlug}`.
2. `ProfileController` calls `ProfileShareService`.
3. `ProfileShareService` loads users through `UserRepository`, owner sheets through `SheetService`, and public catalog alias sheets through `SheetRepository` when the username is the configured admin alias.
4. It uses `PublicReadCacheService` for public profile and public sheet cache keys.
5. Link controllers under `/profile/**` and `/shared/**` return simple HTML pages with frontend redirect/meta behavior for public crawlers and users.

### Sitemap Flow

Entry file: `backend/src/main/java/com/iqms/backend/controller/SitemapController.java`

Flow:

1. Request hits `/sitemap-public-sheets.xml`.
2. `SitemapController` calls `SitemapService`.
3. `SitemapService` uses `PublicReadCacheService` for cached XML.
4. On miss, it queries `SheetRepository.findPublicSheetsForSitemap`, loads owner usernames through `UserRepository`, builds canonical `/sheets/{username}/{slug}` URLs with `SeoUrlUtils`, escapes XML safely, and returns `application/xml`.

### Payment Flow

Entry files:

- `backend/src/main/java/com/iqms/backend/controller/PremiumController.java`
- `backend/src/main/java/com/iqms/backend/controller/ApplicationSubmissionController.java`

Flow:

1. Premium purchase APIs call `PremiumController`; application registration payments call `ApplicationSubmissionController`.
2. Both paths use `RazorpayService` to create/fetch/verify Razorpay payments.
3. Premium payments are stored in `PremiumPaymentOrderRepository` and update `User` premium fields.
4. Application registrations are stored in `ApplicationSubmissionRepository` and prevent duplicate paid submissions for the same email/phone/field/month.

### Notification Flow

Entry files:

- `backend/src/main/java/com/iqms/backend/notification/RevisionNotificationController.java`
- `backend/src/main/java/com/iqms/backend/notification/NotificationPreferencesController.java`

Flow:

1. Notification routes are authenticated by `AuthInterceptor`.
2. `RevisionNotificationController` calls `RevisionNotificationService` for listing, unread count, alarms, read/done/dismiss/archive/delete/snooze/reschedule actions, and push subscriptions.
3. `RevisionNotificationService` hydrates notifications from sheet revision schedules using `SheetRepository`, stores notification rows through `RevisionNotificationRepository`, stores push endpoints through `PushSubscriptionRepository`, and seeds system notifications through `PlatformNotificationSeedService`.
4. Preferences are handled by `NotificationPreferencesController` and `NotificationPreferencesService`.

### Platform Stats Flow

Entry file: `backend/src/main/java/com/iqms/backend/controller/PlatformStatsController.java`

Flow:

1. Authenticated users connect platform profiles like LeetCode, Codeforces, GitHub, and others.
2. `PlatformStatsController` calls `PlatformProfileService`.
3. `PlatformProfileService` stores profile verification state inside the `User` document and calls `PlatformStatsService` to fetch public stats or verification text.
4. `PlatformStatsService` uses `RestTemplate` and `ObjectMapper` to call external APIs or scrape public HTML where needed.

## Folder Summary

### `backend/`

Contains the Spring Boot backend project. It has Maven configuration, Docker build instructions, main Java source, resource properties, tests, and generated `target/` output after builds.

### `backend/src/main/java/com/iqms/backend/`

Main Java package for the backend application. Every runtime class lives under this package tree, grouped by responsibility: controller, service, model, repository, security, config, cache, DTOs, etc.

### `backend/src/main/resources/`

Spring Boot configuration files. These map environment variables into Spring properties for MongoDB, Redis, CORS, auth, mail, Razorpay, cache TTLs, and external API settings.

### `backend/src/test/java/com/iqms/backend/`

JUnit and Spring MVC tests for important backend behavior. Tests cover controllers, sheet service behavior, cache behavior, auth interceptors, sitemap XML, premium access, collaboration, and public catalog/profile behavior.

### `backend/target/`

Generated Maven build output. It contains compiled classes, generated sources, surefire reports, and packaged artifacts after running Maven; it is not source code and should not be edited by hand.

## Root Backend Files

### `backend/pom.xml`

Maven project definition for the backend. It sets Spring Boot 3.4.4, Java 17, web, MongoDB, validation, Redis, mail, Google token verification, security crypto, tests, and the Spring Boot Maven plugin with `IqmsBackendApplication` as the main class.

### `backend/Dockerfile`

Multi-stage Docker build for the backend. The first stage builds the fat JAR with Maven, and the second stage runs it on an Eclipse Temurin 17 JRE image with a non-root `app` user and a `/api/health` healthcheck.

### `backend/.dockerignore`

Backend Docker build ignore file. It keeps local build output, logs, environment files, IDE files, and other unnecessary files out of the backend Docker build context.

### `backend/.env`

Local/backend environment file used by Spring through `spring.config.import`. It can contain real local or production-like secrets, so it should not be copied into documentation, committed, or printed in logs.

### `backend/.env.example`

Safe example environment file for backend configuration. It documents the kinds of variables the backend expects without containing real private values.

## Application Entry

### `IqmsBackendApplication.java`

Spring Boot main class. Running this class starts the backend, scans all Spring components in `com.iqms.backend`, loads configuration, and starts the embedded web server.

## Auth Package

### `auth/GoogleTokenPayload.java`

Small record that represents the verified Google token data used by the backend: email, email verification flag, display name, and Google subject id. `GoogleTokenVerifierService` returns this record to `AuthService`.

### `auth/GoogleTokenVerifierService.java`

Creates and uses Google ID token verification for configured Google OAuth client IDs. It verifies an incoming Google ID token, validates the audience and email verification, and returns `GoogleTokenPayload` to `AuthService`.

## Cache Package

### `cache/PrivateSheetCacheService.java`

Redis cache for authenticated sheet reads. `SheetService` uses it to cache per-user accessible sheet lists and per-user sheet details; it validates cached sheet access before returning data and evicts user/sheet keys after mutations.

### `cache/PublicReadCacheDiagnosticsAdvice.java`

Response advice that adds cache diagnostic headers such as `X-Cache`, `X-Cache-Store`, and `Server-Timing` based on diagnostics collected during the request. It helps verify whether public/private Redis-backed reads were HIT, MISS, or BYPASS.

### `cache/PublicReadCacheDiagnosticsFilter.java`

Request filter that clears per-request cache diagnostics at the start/end of each request. It prevents diagnostics from leaking between requests handled by the same thread.

### `cache/PublicReadCacheService.java`

Redis cache service for public SEO/read endpoints. `FeaturedSheetsService`, `SitemapService`, and `ProfileShareService` use it for public catalog, featured sheets, sitemap XML, profile summaries, and public sheet detail caches; Redis failures fail open to the database.

## SWR Cache Package

### `cache/swr/CacheKeyBuilder.java`

Builds normalized Redis keys for stale-while-revalidate cache entries. `SwrCacheService` uses it to create user-scoped cache keys from a user id and resource name.

### `cache/swr/CacheMetadata.java`

Record that stores SWR timing metadata: when the data was cached, when it becomes stale, and when it hard-expires. It travels with `CachedPayload`.

### `cache/swr/CachedPayload.java`

Generic record that wraps cached data and cache metadata. `RedisCacheService` serializes and deserializes this object.

### `cache/swr/RedisCacheService.java`

Low-level Redis JSON helper for SWR cache entries and lock keys. `SwrCacheService` uses it to read/write `CachedPayload`, acquire refresh locks, and release locks.

### `cache/swr/SwrCacheService.java`

Implements stale-while-revalidate cache behavior. It returns cached data immediately when available, marks stale responses, and refreshes in the background using the executor from `SwrCacheConfig`.

### `cache/swr/SwrResponse.java`

Response wrapper for SWR endpoints. It contains the actual data, whether the response was stale, and metadata used by callers/debugging.

## Config Package

### `config/AuthConfigurationValidator.java`

Startup validator for optional mail and Razorpay configuration. If mail or Razorpay is enabled but required properties are missing, it raises clear startup configuration errors.

### `config/CorsConfig.java`

Defines the global Spring CORS filter. It reads allowed origins and patterns from properties, allows common HTTP methods/headers, supports credentials, and is important for frontend-to-backend browser calls.

### `config/GoogleAuthConfigService.java`

Normalizes and exposes configured Google OAuth client IDs. This is a support service for checking whether Google auth is enabled and which client ID should be shown to the frontend.

### `config/MailConfig.java`

Creates the `JavaMailSender` bean from `MailProperties`. `AuthMailService` and `FeedbackMailService` depend on this bean when mail is enabled.

### `config/MongoStartupVerifier.java`

Optional startup ping for MongoDB. It uses `MongoTemplate` to run a lightweight ping so deployment failures surface early instead of silently failing after traffic arrives.

### `config/SecurityConfig.java`

Defines the `PasswordEncoder` bean, currently `BCryptPasswordEncoder`. `AuthService` uses it to hash passwords and OTPs and to verify password/OTP matches.

### `config/SwrCacheConfig.java`

Defines a bounded executor for SWR background refresh and a `RestTemplate` bean. `SwrCacheService`, `ExternalResourceService`, and platform stats code use these supporting beans.

## Config Properties

### `config/properties/MailProperties.java`

Configuration properties for mail host, port, credentials, sender identity, feedback inbox, auth/starttls flags, and enabled flag. Mail services read this class instead of pulling raw properties everywhere.

### `config/properties/RazorpayProperties.java`

Configuration properties for Razorpay enablement, key id, and key secret. `RazorpayService` reads this to decide whether payments are available and how to authenticate API calls.

### `config/properties/SwrCacheProperties.java`

Configuration record for SWR cache TTLs, lock TTL, retry delay, retry count, and lock prefix. `SwrCacheService` reads it to decide stale/hard expiry and background refresh behavior.

## Controllers

### `controller/ApplicationSubmissionController.java`

Public application registration payment controller under `/api/applications`. It exposes metadata, creates Razorpay orders through `ApplicationSubmissionService`, and verifies completed payments through the same service.

### `controller/AuthController.java`

Public auth controller under `/api/auth`. It maps signup, OTP, login, forgot password, Google auth, and Google client config requests to `AuthService`, `RequestFingerprintService`, and `GoogleTokenVerifierService`.

### `controller/CreatorDiscoveryController.java`

Public discovery endpoint under `/api/discovery`. It calls `CreatorDiscoveryService`, which combines user and public sheet information for creator/community discovery UI.

### `controller/DifficultyCategoryController.java`

Authenticated controller for per-user difficulty categories under `/api/difficulty-categories`. It reads the current user, stores category preferences directly on the `User` document through `UserRepository`, and returns the user-defined list.

### `controller/FeaturedSheetsController.java`

Public sheet catalog controller under `/api/sheets`. It exposes `/featured`, `/admin-catalog`, and `/public-catalog` by delegating to `FeaturedSheetsService`.

### `controller/FeedbackController.java`

Authenticated feedback endpoint under `/api/feedback`. It accepts multipart feedback content and image files, reads the current user, and delegates validation/email sending to `FeedbackMailService`.

### `controller/HealthController.java`

Simple health endpoint at `/api/health`. Used by Docker, CI/CD, Nginx deployment checks, and external monitoring to verify the backend process is alive.

### `controller/PlatformStatsController.java`

Authenticated controller for coding-platform stats under `/api/platform-stats`. It delegates platform catalog, verification, sync, delete, and stat-fetch requests to `PlatformProfileService` and `PlatformStatsService`.

### `controller/PremiumController.java`

Authenticated premium/payment controller under `/api`. It returns plan data, premium status, creates Razorpay orders, verifies Razorpay payments, writes `PremiumPaymentOrder`, and updates premium fields on `User`.

### `controller/PublicProfileLinkController.java`

Public HTML redirect/meta controller under `/profile`. It builds lightweight HTML pages for `/profile/{username}` and `/profile/{username}/{sheetSlug}` so public links can resolve to frontend routes.

### `controller/ShareLinkController.java`

Public HTML redirect/meta controller under `/shared`. It supports legacy/public shared sheet and profile URLs, loads data with `SheetService` or `ProfileShareService`, and emits frontend-friendly HTML.

### `controller/SitemapController.java`

Public sitemap endpoint controller. It returns `/sitemap-public-sheets.xml` as XML by delegating to `SitemapService`.

### `controller/StudyTeamController.java`

Authenticated team/classroom controller under `/api/teams`. It calls `StudyTeamService` for team creation, invitations, sheet assignments, admin dashboard, and member dashboard.

### `controller/SwrCacheDemoController.java`

Authenticated demo endpoint under `/api/swr`. It demonstrates SWR caching by calling `SwrCacheService` with an `ExternalResourceService` fetcher.

## DTOs

### `dto/AuthResponse.java`

Main auth response object returned after login/signup/Google auth/reset. It includes user identity, profile fields, username/email change counters, premium state, and the issued token.

### `dto/EmailChangeRequest.java`

Request body for changing email. It stores the new email value with validation annotations where used.

### `dto/ErrorResponse.java`

Standard API error payload. `GlobalExceptionHandler` returns it for validation errors, `ResponseStatusException`, duplicate keys, rate limits, API request exceptions, data access errors, and unhandled exceptions.

### `dto/ForgotPasswordRequest.java`

Forgot-password request body containing the target email. `AuthController` uses it for `/forgot-password/send-otp`.

### `dto/GoogleAuthRequest.java`

Google auth request body containing an ID token. `AuthController` passes it to `AuthService.authenticateWithGoogle`.

### `dto/GoogleClientConfigResponse.java`

Response record for frontend Google auth configuration. It tells the frontend the primary Google client id, whether Google auth is enabled, and whether a client id is configured.

### `dto/LoginRequest.java`

Login request body with identifier and password. Identifier can be email or username, and `AuthService` decides which lookup to perform.

### `dto/ResetPasswordRequest.java`

Forgot-password reset request body with email, OTP, and new password. `AuthService` verifies the OTP and writes the new password hash.

### `dto/SignUpInitiateResponse.java`

Response returned when signup or OTP resend starts. It contains message text, target email, and resend cooldown.

### `dto/SignUpOtpRequest.java`

Request body for verifying a signup or forgot-password OTP. `AuthService` uses email and OTP to find the pending user and validate the hash.

### `dto/SignUpRequest.java`

Signup request body with name, email, username, and password. Validation annotations help reject malformed requests before service logic runs.

### `dto/SignUpResendOtpRequest.java`

Request body for resending signup OTP. It contains the email address of the pending signup.

### `dto/application/ApplicationCreateOrderRequest.java`

Record for paid application-form order creation. `ApplicationSubmissionService` validates identity/contact/field data before creating a Razorpay order.

### `dto/application/ApplicationVerifyPaymentRequest.java`

Record for application payment verification. It carries Razorpay order id, payment id, and signature to `ApplicationSubmissionService`.

### `dto/notification/CreateAlarmRequest.java`

Request body for creating a manual alarm notification. It includes title, message, scheduled time, priority, source, action URL, and recurrence.

### `dto/notification/NotificationActionResponse.java`

Small response object for notification actions. It returns notification id and the resulting status after read, done, archive, snooze, etc.

### `dto/notification/NotificationFilterRequest.java`

Filter object for notification listing. It carries type, status, page, and size so the service can query and filter visible notifications.

### `dto/notification/NotificationPreferencesUpdateRequest.java`

Request body for notification preference updates. `NotificationPreferencesService` applies non-null fields to the user's saved preferences.

### `dto/notification/PushSubscriptionRequest.java`

Request body for browser push subscription registration. `RevisionNotificationService` stores endpoint and key material in `PushSubscriptionRepository`.

### `dto/notification/RescheduleRequest.java`

Request body for rescheduling a notification. It carries the new `scheduledFor` timestamp.

### `dto/notification/SnoozeRequest.java`

Request body for snoozing a notification. It carries the number of minutes, defaulting to 30.

### `dto/notification/UnreadCountResponse.java`

Simple response object for unread notification count. `RevisionNotificationController` returns it from `/unread-count`.

### `dto/sheet/FeaturedSheetResponse.java`

Lightweight public sheet card DTO for featured/admin catalog sections. It is built from a `Sheet` without returning full heavy topic data.

### `dto/sheet/PublicSheetCatalogResponse.java`

Public explore/catalog DTO with owner username, sheet slug, canonical frontend path, canonical URL, metadata, and topic tags. `FeaturedSheetsService` uses it for `/api/sheets/public-catalog`.

### `dto/sheet/SheetCreateRequest.java`

Request body for creating a sheet. It includes title plus optional logo/reference URL metadata.

### `dto/sheet/SheetEngagementRequest.java`

Request body for public engagement actions like download or copy. `SheetService.trackEngagement` decides which counter/list to update.

### `dto/sheet/SheetEngagementResponse.java`

Response record after engagement tracking. It returns sheet id, download count, and copy count.

### `dto/sheet/SheetListItemResponse.java`

Lightweight private sheet list DTO. It summarizes sheet metadata and calculates a progress snapshot from nested topic/question data without returning full sheet content.

### `dto/sheet/SheetUpdateRequest.java`

Request body for sheet updates. It carries mutable fields like title, description, URLs, topics, tags, custom topics, public/archive flags, and shared-progress behavior.

## Exceptions

### `exception/ApiRequestException.java`

Custom runtime exception for structured API errors that need status, code, retry timing, or disabled-until timing. Rate limiting and OTP cooldown paths use it.

### `exception/GlobalExceptionHandler.java`

Central exception-to-response mapper. It catches Spring validation errors, `ResponseStatusException`, bad requests, duplicate keys, `ApiRequestException`, data access failures, and unhandled exceptions, returning `ErrorResponse`.

## Models

### `model/ApplicationSubmission.java`

Mongo document for paid application submissions. It stores applicant details, normalized duplicate-check fields, payment status, application status, Razorpay ids/signature, month key, and timestamps.

### `model/ConnectedPlatformProfile.java`

Embedded profile object stored inside `User`. It tracks a connected coding platform username, verification code/status, profile URL, sync timings, errors, and fetched stats.

### `model/DifficultyCategory.java`

User-defined difficulty category object embedded in `User`. It stores id, name, color, and timestamps.

### `model/NotificationPreferences.java`

Mongo document for per-user notification settings. It stores platform/revision/alarm toggles, browser notification flag, quiet hours, digest frequency, revision intervals, default snooze, and timestamps.

### `model/PremiumPaymentOrder.java`

Mongo document for premium Razorpay orders. It stores provider order id, user id, plan, amount/currency, verification/payment status, provider payment id, and timestamps.

### `model/PushSubscription.java`

Mongo document for browser push subscription endpoints. It stores user id, endpoint, push keys, and timestamps.

### `model/RevisionNotification.java`

Mongo document for platform, revision, and alarm notifications. It stores owner user, type, title/message, status, priority, schedule/delivery/read/completion times, source identifiers, action URL, recurrence, audit trail, and soft-delete fields.

### `model/Sheet.java`

Core Mongo document for a CreateSheets sheet. It stores owner, title, description, logo/reference URLs, share id, timestamps, public/archive/visibility flags, comments setting, remix/copy ancestry, engagement usernames, collaborators, topics, topic tags, and custom topics.

### `model/SheetActivityEvent.java`

Mongo document for sheet activity history. It stores sheet id, actor user id, event type, metadata, and timestamp.

### `model/SheetComment.java`

Mongo document for comments on a sheet or specific topic/subtopic/question. It stores sheet id, author user id, optional topic/subtopic/question ids, content, and timestamp.

### `model/SheetCopyEvent.java`

Mongo document for copy/remix-like events. It records source sheet, source owner, copying user, copied sheet id, and copy timestamp.

### `model/StudyTeam.java`

Mongo document for classrooms/study teams. It stores owner, name, mode, timestamps, memberships with roles, and assigned sheet ids.

### `model/TeamSheetProgress.java`

Mongo document for per-user progress inside a team. It stores team id, sheet id, user id, progress percent, due count, overdue revision count, and timestamp.

### `model/User.java`

Core Mongo document for application users. It stores auth identity, email/OTP state, profile fields, follow graph, copied sheet ids, difficulty categories, connected platform profiles, premium/subscription fields, and account limits.

## Notification Package

### `notification/NotificationPreferencesController.java`

Authenticated controller for `/api/notification-preferences`. It reads the current user and delegates get/update operations to `NotificationPreferencesService`.

### `notification/NotificationPreferencesService.java`

Service for loading or creating default notification preferences and applying updates. It uses `NotificationPreferencesRepository` and clamps quiet-hour values.

### `notification/RevisionNotificationController.java`

Authenticated controller for `/api/notifications`. It maps list/count/alarm/action/push-subscription routes to `RevisionNotificationService`.

### `notification/RevisionNotificationService.java`

Business logic for notifications. It hydrates revision notifications from sheet question revision data, seeds platform notifications, delivers due alarms, manages statuses, appends audit trail entries, soft deletes, handles recurrence, and stores push subscriptions.

### `notification/support/PlatformNotificationSeedService.java`

Seeds default/platform notifications for a user if they do not already exist. It uses `RevisionNotificationRepository`.

### `notification/support/RevisionScheduleService.java`

Creates revision schedules from a base time and configured hour intervals. `RevisionNotificationService` uses it when questions have attempt logs but no explicit revision dates.

## Profile Package

### `profile/ProfileController.java`

Authenticated and public profile API controller under `/api/profile`. It handles current user profile get/update, public/shared profile lookup, public sheet lookup, and follow/unfollow operations.

### `profile/ProfileShareService.java`

Service for public profile and public sheet payloads. It uses `UserRepository`, `SheetService`, `PremiumAccessService`, `PlatformProfileService`, `PublicReadCacheService`, and `SheetRepository` to build public profile data and safely load only public sheets.

## Queue Package

### `queue/ActionQueueService.java`

Single-threaded action queue for serializing mutation operations. `SheetService` uses it so sheet writes, engagement updates, and cache invalidations happen in order and are less likely to conflict.

## Repositories

### `repository/ApplicationSubmissionRepository.java`

Mongo repository for `ApplicationSubmission`. It supports duplicate checks by normalized email/phone/field/month/status and lookup by Razorpay payment order id.

### `repository/NotificationPreferencesRepository.java`

Mongo repository for `NotificationPreferences`. It finds preferences by user id.

### `repository/PremiumPaymentOrderRepository.java`

Mongo repository for `PremiumPaymentOrder`. It finds payment order rows by provider order id during Razorpay verification.

### `repository/PushSubscriptionRepository.java`

Mongo repository for `PushSubscription`. It finds an existing subscription by user id and endpoint so repeated registrations update the same row.

### `repository/RevisionNotificationRepository.java`

Mongo repository for `RevisionNotification`. It has custom queries for visible notifications, unread counts, owned notification lookup, duplicate revision lookup, due alarms, and upcoming/revision candidates.

### `repository/SheetActivityEventRepository.java`

Mongo repository for `SheetActivityEvent`. It returns the latest 100 activity events for a sheet.

### `repository/SheetCommentRepository.java`

Mongo repository for `SheetComment`. It returns the latest 100 comments for a sheet.

### `repository/SheetCopyEventRepository.java`

Mongo repository for `SheetCopyEvent`. It finds copy events by source/copier and lists copies by source owner.

### `repository/StudyTeamRepository.java`

Mongo repository for `StudyTeam`. It lists teams by owner and by membership.

### `repository/TeamSheetProgressRepository.java`

Mongo repository for `TeamSheetProgress`. It lists progress by team and by team/user.

### `repository/UserRepository.java`

Mongo repository for `User`. It supports lookup by email, username, profile share id, and case-insensitive email/username variants.

## Security Package

### `security/AuthInterceptor.java`

Spring MVC interceptor that protects private routes. It reads the bearer token, calls `TokenService`, verifies the user still exists through `UserRepository`, and stores the authenticated user id on the request.

### `security/CurrentUser.java`

Small helper for controllers. It reads the authenticated user id from the request attribute set by `AuthInterceptor`.

### `security/NoIndexHeaderInterceptor.java`

Adds `X-Robots-Tag: noindex, nofollow, nosnippet` to API responses. This protects private/API routes from search indexing signals.

### `security/RequestFingerprintService.java`

Builds a per-request client fingerprint from request headers/IP data. Login attempts and request rate limits use it to track activity by device/client.

### `security/RequestRateLimitInterceptor.java`

In-memory rate limiter for selected endpoints. It limits repeated feedback/application requests by fingerprint and throws `ApiRequestException` with retry metadata during cooldown.

### `security/TokenService.java`

Issues and validates signed bearer tokens. It creates a compact base64url payload with user id and expiry, signs it with HMAC SHA-256, and validates signature/expiration on incoming requests.

### `security/WebMvcConfig.java`

Registers backend interceptors and defines which routes require authentication. It also explicitly excludes public routes such as auth, public profiles, public sheet catalog, shared sheets, and sitemap-related public paths.

## SEO Package

### `seo/SeoUrlUtils.java`

URL helper for SEO-safe slugs and canonical public sheet paths. `PublicSheetCatalogResponse` and `SitemapService` use it to build `/sheets/{username}/{sheet-title}` URLs.

## Service Package

### `service/AiSuggestionService.java`

Simple sheet analysis service for "suggest next question" behavior. `SheetController` calls it after loading an accessible sheet.

### `service/ApplicationSubmissionService.java`

Business logic for paid application forms. It validates applicant data, creates Razorpay orders, stores pending submissions, verifies Razorpay payment details, blocks duplicates, and finalizes submissions.

### `service/AuthMailService.java`

Email service for OTP messages. `AuthService` calls it when signup or password reset OTPs are generated; it uses `JavaMailSender` and `MailProperties`.

### `service/AuthService.java`

Main authentication business service. It handles signup, OTP resend/verify, forgot password, password reset, password login, Google login, token response creation, OTP cooldown/lockout, and user normalization.

### `service/CreatorDiscoveryService.java`

Builds public creator discovery payloads. It combines users from `UserRepository` with public/discoverable sheet data from `SheetRepository`, then ranks/structures creators and sheets for discovery UI.

### `service/EntitlementService.java`

Small feature-gate service. It currently delegates to `PremiumAccessService` for feature checks and keeps controller/team code readable.

### `service/ExternalResourceService.java`

Demo external API fetch service for SWR caching. It uses `RestTemplate`, a configured URL template, and optional auth token to retrieve a resource for a user.

### `service/FeaturedSheetsService.java`

Public catalog service. It reads featured/admin/public catalog sheets, caches them through `PublicReadCacheService`, filters only public non-archived sheets, and builds lightweight DTOs.

### `service/FeedbackMailService.java`

Validates and sends feedback emails with optional images. `FeedbackController` calls it; it enforces topic/message length, image count/size limits, builds an email body, attaches images, and uses mail configuration.

### `service/LoginAttemptService.java`

In-memory login attempt limiter. `AuthService.login` uses it to block repeated failed login attempts for a device fingerprint.

### `service/PlatformProfileService.java`

Manages user-connected coding platform profiles. It creates verification codes, verifies public profiles through `PlatformStatsService`, syncs stats, deletes profiles, and builds dashboard/public aggregate payloads.

### `service/PlatformStatsService.java`

External platform stats collector. It knows supported platforms, fetches stats through official APIs or best-effort public endpoints/HTML parsing, verifies public profile text, and returns normalized stats payloads.

### `service/PremiumAccessService.java`

Premium/trial/limit service. It resolves active premium state, enforces sheet/topic/subtopic/question/word limits, handles old trial flags, and exposes premium state used by auth/profile/premium responses.

### `service/RazorpayService.java`

Low-level Razorpay HTTP client. It creates orders, fetches payment details, validates HMAC signatures, parses JSON responses, and refuses calls when Razorpay is not configured.

### `service/SheetCollaborationService.java`

Sheet collaborator, comment, and activity service. It handles invitations, view/edit/owner checks, comments, activity history, role normalization, and private cache invalidation after collaborator changes.

### `service/SitemapService.java`

Builds XML for public sheet sitemap. It uses cached XML when available, loads public sitemap rows from `SheetRepository`, maps owner ids to usernames, builds canonical URLs, writes lastmod, and escapes XML.

### `service/StudyTeamService.java`

Business logic for study teams/classrooms. It creates teams, manages memberships and roles, assigns sheets, checks team permissions, and builds admin/member dashboard summaries from progress records.

## Sheet Package

Note: these files live physically under `backend/src/main/java/com/iqms/backend/sheet/`, but their Java package declarations are part of the main backend package structure used by imports. The current code compiles, so treat the physical path as historical organization.

### `sheet/SheetController.java`

Main authenticated sheet API controller under `/api/sheets`. It maps HTTP routes to `SheetService`, `SheetCollaborationService`, and `AiSuggestionService`.

### `sheet/SheetRepository.java`

Mongo repository interface for `Sheet`. It defines owner lookup, share id lookup, accessible sheet candidate queries, public catalog queries, public sitemap projections, and discoverable sheet queries.

### `sheet/SheetService.java`

Main sheet business service. It creates, lists, loads, updates, shares, deletes, copies, remixes, tracks engagement, removes/flags progress data during copy, validates access, and invalidates Redis caches.

## Resource Files

### `src/main/resources/application.properties`

Default backend configuration. It maps environment variables for MongoDB, CORS, auth secret/expiry, Google auth, admin username, queue delay, mail, Razorpay, revision intervals, Mongo startup ping, Redis, public/private cache TTLs, SWR cache, and external API template.

### `src/main/resources/application-dev.properties`

Development override configuration. It points MongoDB to a local/dev database by default, allows localhost/Vercel frontend origins, and supplies a dev-only fallback auth secret.

## Tests

### `cache/PrivateSheetCacheServiceTest.java`

Tests private Redis sheet cache behavior: cache hit, miss-and-store, Redis read failure fail-open, invalid access evicts cached data, and write failure fallback.

### `cache/PublicReadCacheServiceTest.java`

Tests public Redis cache behavior: hit, miss, bypass on Redis failure, bypass on write failure, and diagnostic response headers.

### `controller/FeaturedSheetsControllerTest.java`

Spring MVC test for public catalog controller responses. It verifies featured/admin/public catalog endpoints return expected lightweight JSON without auth.

### `controller/SheetControllerTest.java`

Spring MVC test for sheet controller behavior. It verifies sheet creation, validation errors, lightweight list payloads, and structured not-found propagation.

### `controller/SitemapControllerTest.java`

Spring MVC test for sitemap endpoint. It verifies `/sitemap-public-sheets.xml` returns XML from `SitemapService`.

### `profile/ProfileShareServiceTest.java`

Unit tests for public sheet route alias behavior. It verifies `createsheets` public sheet links resolve safely and non-admin users cannot fallback to other owners' sheets.

### `security/AuthInterceptorTest.java`

Unit tests for protected route authentication. It verifies valid tokens for existing users are accepted, deleted users are rejected, and invalid tokens avoid unnecessary user lookup.

### `security/NoIndexHeaderInterceptorTest.java`

Unit test for noindex header behavior. It verifies the API indexing protection header is added.

### `service/EntitlementServiceTest.java`

Unit tests for feature gate behavior. It verifies currently allowed/free feature behavior and premium delegation assumptions.

### `service/FeaturedSheetsServiceTest.java`

Unit tests for featured/admin/public catalog service. It verifies admin sheet limits, missing admin behavior, CreateSheets-owned catalog preference, and CreateSheets alias fallback.

### `service/PremiumAccessServiceTest.java`

Unit tests for premium limit logic. It checks sheet/question/word limit validation, premium user allowance, and new-user trial behavior.

### `service/SheetCollaborationServiceTest.java`

Unit tests for collaboration rules. It verifies owner-only invite behavior and collaborator insertion.

### `service/SheetServiceTest.java`

Unit tests for core sheet service logic. It covers default titles, updates, private cache usage, not-found behavior, delete behavior, copy behavior, repeat copy behavior, and remix behavior.

### `service/SitemapServiceTest.java`

Unit tests for public sitemap generation. It verifies public owners are required and XML escaping is safe.

## Important Cross-Cutting Details

### Authentication Is Interceptor Based

Controllers do not parse tokens directly. `AuthInterceptor` validates tokens before private controllers run, and controllers call `CurrentUser.getUserId(request)` to retrieve the authenticated user id.

### Public Routes Are Explicitly Excluded

`WebMvcConfig` excludes public catalog, public profile, shared sheet, and auth routes from `AuthInterceptor`. This is why `/explore`, public sheets, and sitemap endpoints can work without login.

### Redis Is A Cache, Not The Source Of Truth

MongoDB remains the source of truth. Redis read failures are logged and bypassed, while services load from repositories and continue serving data.

### Cache Invalidation Usually Starts In `SheetService`

Most sheet mutations call `invalidateCachesForSheet`. That method evicts private sheet access caches and public catalog/sitemap/profile caches so later reads see fresh data.

### Public Data Is Filtered Before Exposure

Public catalog/sitemap/profile paths check `isPublic`, `visibility`, and archive status. Private sheet data should only flow through authenticated APIs.

### Payments Are Disabled Unless Configured

`RazorpayService` refuses payment operations when Razorpay is not enabled or credentials are missing. Startup validation also checks enabled Razorpay configuration.

### Generated Output Is Not Source

The `backend/target/` folder is created by Maven. If it exists locally, it can be deleted and regenerated with Maven commands.

## Common Backend Commands

Run backend tests:

```bash
JAVA_HOME=$(/usr/libexec/java_home -v 21) mvn -f backend/pom.xml test
```

Build backend JAR:

```bash
mvn -f backend/pom.xml clean package -DskipTests
```

Build backend Docker image through the production compose file:

```bash
docker compose -f docker-compose.prod.yml build backend
```

Check backend health locally:

```bash
curl http://localhost:8080/api/health
```

Check production health:

```bash
curl https://www.createsheets.com/api/health
```
