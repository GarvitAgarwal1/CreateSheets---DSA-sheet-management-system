# Backend Production Readiness Plan

## Current Backend Structure
- Spring Boot app entry: `backend/src/main/java/com/iqms/backend/IqmsBackendApplication.java`.
- Controllers:
  - Auth/application/premium/platform/team/discovery in `backend/src/main/java/com/iqms/backend/controller/`.
  - Profile in `backend/src/main/java/com/iqms/backend/profile/`.
  - Notifications in `backend/src/main/java/com/iqms/backend/notification/`.
  - Sheet controller is located under `backend/src/main/java/com/iqms/backend/sheet/SheetController.java` while its package is `com.iqms.backend.controller`.
- Services:
  - Core services in `backend/src/main/java/com/iqms/backend/service/`.
  - Sheet service located under `backend/src/main/java/com/iqms/backend/sheet/SheetService.java` while its package is `com.iqms.backend.service`.
  - Notification services in `backend/src/main/java/com/iqms/backend/notification/`.
- Models: `backend/src/main/java/com/iqms/backend/model/`.
- Repositories: mostly `backend/src/main/java/com/iqms/backend/repository/`, with sheet repository under `backend/src/main/java/com/iqms/backend/sheet/SheetRepository.java`.
- Security: `backend/src/main/java/com/iqms/backend/security/`.
- Config: `backend/src/main/java/com/iqms/backend/config/`.
- Tests: backend tests exist under `backend/src/test/java/com/iqms/backend/`.

## Current Problems Found
- Package/file path mismatch in the sheet module can confuse tooling and future developers.
- Core sheet content is processed as raw `Map<String,Object>` structures, increasing runtime type risk.
- Platform connector logic is concentrated in one large service and makes synchronous external calls.
- Custom token service manually builds/parses tokens instead of using a standard JWT library.
- Rate limiting is narrow and appears focused on application submission routes, not auth/platform sync/profile scraping.
- Notification hydration runs during reads, which can become expensive.
- Public/profile payloads are broad and need strict privacy regression tests.
- External platform scraping needs timeouts, retries, source monitoring, and legal/ToS awareness.
- API responses mix DTOs, entities, and raw maps.
- Embedded platform stats on `User` can grow and lacks historical query flexibility.

## API Improvements Needed
- Standardize response envelopes for errors and important mutations.
- Add DTOs for every request/response that currently uses raw `Map`.
- Add pagination to all list endpoints where data can grow:
  - public sheets,
  - profile sheets,
  - comments,
  - activity,
  - teams,
  - platform snapshot history.
- Version important public APIs or at least document compatibility rules.
- Add idempotency keys for copy/remix/sync/import operations.
- Add endpoint-level rate limits for:
  - auth OTP/login,
  - platform verification,
  - platform sync,
  - public profile scraping-heavy endpoints,
  - payments.

## Validation Plan
- Introduce typed DTOs for:
  - sheet content tree,
  - platform verification/sync payloads,
  - profile update payload,
  - collaboration invite/comment payload,
  - team invite/assignment payload.
- Use Jakarta validation annotations and service-level business validation.
- Keep compatibility adapters for old sheet documents.
- Validate all external URLs and normalize usernames/slugs.
- Add request size limits for import/sheet update/profile bio.

## Authentication and Authorization Plan
- Replace or wrap custom token implementation with a standard JWT library.
- Add token version/revocation support for logout and password reset.
- Add refresh token or short-lived access token strategy before production.
- Add ownership and role tests for every protected domain.
- Review public endpoint allowlist in `WebMvcConfig`.
- Add optional CSRF strategy if cookie auth is ever introduced.
- Add audit logs for sensitive changes: email, username, password, premium status, payment, collaborator role.

## Database Improvement Plan
- Add explicit indexes for high-use queries:
  - `users.email`, `users.username`, `users.profileShareId` already exist in model annotations.
  - `sheets.ownerId + updatedAt`.
  - `sheets.shareId`.
  - comments/activity by sheetId + createdAt.
  - notifications by userId + status + scheduledFor.
  - platform profiles by userId + platform + username if moved out of `User`.
- Add schema version fields to `Sheet` and platform stats snapshots.
- Move high-growth embedded data out of `User` where needed:
  - platform stat snapshot history,
  - achievement history,
  - analytics snapshots.
- Add migration scripts or startup compatibility mappers.

## Error Handling Plan
- Continue using `GlobalExceptionHandler`, but ensure every controller returns consistent `ErrorResponse`.
- Map external connector failures to clear user-safe messages.
- Include internal correlation id in logs, not necessarily in user-facing body unless desired.
- Avoid leaking third-party HTML/API internals to users.
- Add validation error field details.

## External Platform Connector Plan
- Split `PlatformStatsService` into connector classes behind a common interface.
- Add per-connector:
  - timeout,
  - retry/backoff,
  - parser tests,
  - source metadata,
  - strict verification support flag,
  - known limitations.
- Cache platform responses briefly to avoid repeat scraping.
- Sync verified profiles asynchronously.
- Keep CSES unavailable unless a real public user-profile source appears.
- Track connector health for admin/debug visibility.

## Security Plan
- Never store verification codes in plain text long-term; store hash where possible.
- Expire verification codes.
- Rate-limit verification attempts.
- Sanitize all scraped public HTML before storing/logging.
- Validate and sanitize profile bio/portfolio markdown.
- Review CORS config for production origins.
- Store secrets only in env; document required variables without committing values.
- Add payment webhook signature verification if webhooks are introduced.

## Logging Plan
- Add structured logs for:
  - auth success/failure,
  - OTP send/resend,
  - sheet mutation failures,
  - platform sync start/end/failure,
  - payment order/verification,
  - notification delivery.
- Avoid logging passwords, OTPs, tokens, payment signatures, or full scraped pages.
- Add correlation id filter/interceptor.
- Add external API duration logs.

## Pagination, Filtering, and Sorting Plan
- Standard parameters: `page`, `size`, `sort`, `direction`, `filter`.
- Enforce max page size, default 20 or 40 depending on domain.
- Add cursor pagination later for large activity feeds.
- Apply to:
  - notifications,
  - public sheets,
  - comments/activity,
  - platform snapshot history,
  - leaderboards,
  - search results.

## Environment Variable Plan
- Document required envs in `.env.example` files later:
  - `SPRING_DATA_MONGODB_URI`
  - auth token secret/signing key
  - mail SMTP settings
  - Google OAuth client id
  - Razorpay key/secret
  - frontend API base URL
  - allowed frontend origins
  - Redis/SWR settings if enabled
- Add startup checks for critical production variables.
- Separate local/dev/test/prod profiles.

## Testing Plan
- Backend unit tests for services:
  - sheet permissions,
  - platform verification,
  - platform sync aggregation,
  - notification recurrence,
  - premium entitlements,
  - profile privacy.
- Controller integration tests for auth-protected routes.
- Contract tests for frontend API payloads.
- Mock external platform APIs.
- Resolve Java/Mockito compatibility issues in local environment before relying on full Maven test results.

## Step-by-Step Backend Refactor Plan
1. Clean package/file path alignment for sheet module.
2. Add DTOs and validators around current sheet APIs without changing database structure.
3. Add tests around current public/private profile payloads.
4. Split platform connectors from `PlatformStatsService`.
5. Add connector timeout/retry/error handling.
6. Add rate limits to auth and platform endpoints.
7. Introduce typed attempt and analytics models.
8. Move high-growth platform snapshots to their own collection.
9. Add background job/scheduler for platform sync and notification hydration.
10. Harden token lifecycle and add audit logs.
