# API Endpoint Test Prompt (Coverage + Quality Gate)

Use this file as the single source for API validation against `API_WORKING.MD`.

## Validation Objective
For **every documented endpoint**:
1. Confirm the endpoint exists (reachable route + expected method).
2. Include a short **Purpose** section (why this API exists).
3. Run **at least 2 tests**:
   - one happy-path success test,
   - one negative-path robustness test.
4. Define **How to know it is working** and **How to know it is not working**.

## Global Setup
- Base URL: `{{BASE_URL}}` (example: `http://localhost:8080`).
- Auth header for protected APIs: `Authorization: Bearer {{JWT}}`.
- JSON APIs use: `Content-Type: application/json`.
- Use reusable IDs/fixtures: `{{SHEET_ID}}`, `{{TEAM_ID}}`, `{{NOTIFICATION_ID}}`, `{{USERNAME}}`, etc.

## Global Pass/Fail Heuristics
- **Working correctly** when:
  - expected status code is returned,
  - response shape/fields match contract,
  - any DB state changes reflect action (create/update/delete/follow/read/etc.),
  - no unexpected server exception.
- **Not working correctly** when:
  - route returns wrong status for valid/invalid input,
  - required fields are missing in response,
  - side effects do not persist,
  - ownership/security checks are bypassed or overly restrictive.

---

## 1) Authentication APIs (`/api/auth`)

### `POST /api/auth/signup`
- Purpose: start account registration + OTP initiation.
- Test A (success): valid new email payload -> expect `2xx` with signup/otp-init response.
- Test B (negative): missing email/password -> expect `400` validation error.
- Working signal: pending signup/otp flow starts for that email.
- Not working signal: accepts invalid payload or fails valid request.

### `POST /api/auth/signup/resend-otp`
- Purpose: resend OTP for pending signup verification.
- Test A: known pending signup email -> `2xx`.
- Test B: unknown/non-pending email -> `4xx`.
- Working: resend acknowledged only for eligible email.
- Not working: always succeeds regardless of user state.

### `POST /api/auth/signup/verify-otp`
- Purpose: finalize signup by OTP verification.
- Test A: valid email+otp -> `2xx` with auth/session data.
- Test B: wrong/expired otp -> `4xx`.
- Working: verified user can authenticate after success.
- Not working: invalid OTP is accepted.

### `GET /api/auth/google`
- Purpose: diagnostic/instructional route indicating POST usage.
- Test A: GET call -> informational `2xx` response text/json.
- Test B: assert that no auth session is created by GET.
- Working: route responds with guidance, not login.
- Not working: behaves like real login or errors unexpectedly.

### `POST /api/auth/google`
- Purpose: login/signup with Google ID token.
- Test A: valid Google token -> `2xx` with auth payload.
- Test B: invalid/missing token -> `400/401/503` (as configured).
- Working: token validated, user session returned.
- Not working: invalid token accepted or server crashes.

### `POST /api/auth/forgot-password/send-otp`
- Purpose: initiate password reset verification.
- Test A: registered email -> `2xx`.
- Test B: malformed email -> `400`.
- Working: OTP dispatch triggered.
- Not working: malformed payload accepted.

### `POST /api/auth/forgot-password/verify-otp`
- Purpose: verify reset OTP before password change.
- Test A: correct OTP -> `2xx`.
- Test B: bad OTP -> `4xx`.
- Working: verified flag/state advances only with correct OTP.
- Not working: incorrect OTP accepted.

### `POST /api/auth/forgot-password/reset`
- Purpose: set new password after OTP verification.
- Test A: valid email+otp+strong password -> `2xx`.
- Test B: wrong OTP or weak password -> `400/401`.
- Working: old password fails, new password works.
- Not working: password unchanged or insecure reset accepted.

### `POST /api/auth/login`
- Purpose: credential login with fingerprint-aware security flow.
- Test A: valid credentials -> `200` + token/user.
- Test B: wrong password -> `401/403`.
- Working: valid login returns auth artifacts.
- Not working: invalid credentials succeed.

### `GET /api/auth/google/client-config`
- Purpose: expose Google auth enablement/client ID for frontend.
- Test A: normal env -> `200` with config flags.
- Test B: missing config scenario -> graceful `4xx/5xx`.
- Working: response contains expected config keys.
- Not working: malformed response or uncaught exception.

---

## 2) Sheet APIs (`/api/sheets`)

### `GET /api/sheets`
- Purpose: list user-accessible sheets.
- Test A: authorized user -> `200` list.
- Test B: missing token -> `401`.

### `POST /api/sheets`
- Purpose: create new sheet.
- Test A: valid payload -> `200/201` with new id.
- Test B: missing title -> `400`.

### `GET /api/sheets/{sheetId}`
- Purpose: fetch one accessible sheet.
- Test A: valid accessible id -> `200`.
- Test B: non-existent/inaccessible id -> `404/403`.

### `PUT /api/sheets/{sheetId}`
- Purpose: owner-controlled sheet update.
- Test A: owner valid update -> `200`.
- Test B: non-owner update -> `403`.

### `PUT /api/sheets/{sheetId}/sharing`
- Purpose: change sharing/comment settings.
- Test A: owner updates settings -> `200`.
- Test B: non-owner -> `403`.

### `POST /api/sheets/{sheetId}/invite`
- Purpose: add collaborator to sheet.
- Test A: valid invite -> `2xx`.
- Test B: duplicate/invalid collaborator input -> `400`.

### `GET /api/sheets/{sheetId}/comments`
- Purpose: read collaboration comments.
- Test A: collaborator/owner reads -> `200` array.
- Test B: unauthorized user -> `403`.

### `POST /api/sheets/{sheetId}/comments`
- Purpose: add comment to sheet context.
- Test A: valid body -> `200/201`.
- Test B: empty text -> `400`.

### `GET /api/sheets/{sheetId}/activity`
- Purpose: view sheet collaboration activity timeline.
- Test A: authorized -> `200` list.
- Test B: unauthorized -> `403`.

### `GET /api/sheets/{sheetId}/ai/suggest-next`
- Purpose: fetch AI suggested next learning action.
- Test A: valid sheet -> `200` suggestion payload.
- Test B: bad sheet id -> `404`.

### `POST /api/sheets/{sheetId}/remix`
- Purpose: create derived/remixed sheet.
- Test A: allowed remix -> `200/201`.
- Test B: invalid remix input -> `400`.

### `POST /api/sheets/{sheetId}/copy`
- Purpose: copy shared/public sheet into user library.
- Test A: copy allowed source -> `200/201`.
- Test B: private/forbidden source -> `403`.

### `DELETE /api/sheets/{sheetId}`
- Purpose: delete owned sheet.
- Test A: owner delete -> `200/204`.
- Test B: non-owner delete -> `403`.

### `GET /api/sheets/shared/{shareId}`
- Purpose: resolve share-link sheet by share id.
- Test A: valid share id -> `200`.
- Test B: invalid share id -> `404`.

### `POST /api/sheets/{sheetId}/engagement`
- Purpose: record engagement action and return metrics.
- Test A: valid action enum -> `200`.
- Test B: invalid action -> `400`.

Working signal for sheet module: authorization, ownership, and state transitions behave consistently.
Not working signal: unauthorized writes succeed, or valid owner actions fail.

---

## 3) Profile APIs (`/api/profile`)

### `GET /api/profile`
- Purpose: fetch current user profile + stats.
- Test A: authenticated user -> `200`.
- Test B: unauthenticated -> `401`.

### `PUT /api/profile`
- Purpose: update editable profile fields.
- Test A: valid profile update -> `200`.
- Test B: duplicate username/email or invalid format -> `400/409`.

### `GET /api/profile/shared/{profileShareId}`
- Purpose: read shared profile by share id.
- Test A: valid share id -> `200`.
- Test B: invalid share id -> `404`.

### `GET /api/profile/public/{username}`
- Purpose: fetch public profile by username.
- Test A: existing public username -> `200`.
- Test B: unknown username -> `404`.

### `GET /api/profile/view/{username}`
- Purpose: public profile with viewer-context fields.
- Test A: valid viewer + existing username -> `200`.
- Test B: unknown username -> `404`.

### `GET /api/profile/public/{username}/{sheetSlug}`
- Purpose: public sheet route under a profile.
- Test A: valid username+slug -> `200`.
- Test B: bad slug -> `404`.

### `POST /api/profile/follow/{username}`
- Purpose: follow target user.
- Test A: valid follow -> `200` and counts update.
- Test B: self-follow/unknown user -> `4xx`.

### `DELETE /api/profile/follow/{username}`
- Purpose: unfollow target user.
- Test A: valid unfollow -> `200/204`.
- Test B: not following/unknown user -> `4xx`.

Working signal: follower/following relationship is correctly reflected.
Not working signal: counts or relationship state do not change.

---

## 4) Study Team APIs (`/api/teams`)

### `GET /api/teams`
- Purpose: list teams for current user.
- Test A: authenticated member -> `200` list.
- Test B: unauthenticated -> `401`.

### `POST /api/teams`
- Purpose: create team.
- Test A: valid name/mode -> `200/201`.
- Test B: invalid mode/blank name -> `400`.

### `POST /api/teams/{teamId}/invite`
- Purpose: invite user with role to team.
- Test A: admin invites valid user -> `2xx`.
- Test B: non-admin invite or bad role -> `403/400`.

### `POST /api/teams/{teamId}/assign-sheet/{sheetId}`
- Purpose: assign sheet to team.
- Test A: authorized assign -> `2xx`.
- Test B: invalid sheet/team membership -> `4xx`.

### `GET /api/teams/{teamId}/dashboard/admin`
- Purpose: team admin analytics view.
- Test A: admin access -> `200`.
- Test B: member/non-member access -> `403`.

### `GET /api/teams/{teamId}/dashboard/member`
- Purpose: member personal team progress view.
- Test A: team member -> `200`.
- Test B: outsider -> `403`.

---

## 5) Notifications APIs (`/api/notifications`)

### `GET /api/notifications`
- Purpose: list notifications with filters.
- Test A: valid filters/pagination -> `200`.
- Test B: invalid query params -> `400`.

### `GET /api/notifications/unread-count`
- Purpose: unread count indicator.
- Test A: authenticated -> `200` with count.
- Test B: unauthenticated -> `401`.

### `POST /api/notifications/alarms`
- Purpose: create reminder/alarm.
- Test A: valid datetime payload -> `200/201`.
- Test B: past/invalid datetime -> `400`.

### `POST /api/notifications/mark-all-read`
- Purpose: bulk mark all notifications read.
- Test A: authenticated call -> `200`.
- Test B: unauthenticated -> `401`.

### `POST /api/notifications/{notificationId}/read`
### `POST /api/notifications/{notificationId}/done`
### `POST /api/notifications/{notificationId}/dismiss`
### `POST /api/notifications/{notificationId}/archive`
### `POST /api/notifications/{notificationId}/overdue`
- Purpose: state transitions for single notification.
- Test A: owner performs transition -> `200`.
- Test B: non-owner/invalid id -> `403/404`.

### `DELETE /api/notifications/{notificationId}`
- Purpose: delete one notification.
- Test A: owner deletes -> `200/204`.
- Test B: invalid id/non-owner -> `404/403`.

### `DELETE /api/notifications`
- Purpose: clear all notifications for current user.
- Test A: authenticated call -> `200/204`.
- Test B: unauthenticated -> `401`.

### `POST /api/notifications/{notificationId}/snooze`
- Purpose: postpone reminder by minutes.
- Test A: valid snooze minutes -> `200`.
- Test B: invalid minutes (negative/zero/out-of-range) -> `400`.

### `POST /api/notifications/{notificationId}/reschedule`
- Purpose: set a new scheduled datetime.
- Test A: valid future datetime -> `200`.
- Test B: invalid datetime or ownership -> `400/403`.

### `POST /api/notifications/push-subscriptions`
- Purpose: register/update device push subscription.
- Test A: valid push subscription payload -> `200/201`.
- Test B: malformed subscription body -> `400`.

Working signal: transition rules enforce ownership and correct state flow.
Not working signal: state transitions occur for wrong users or invalid states.

---

## 6) Notification Preferences (`/api/notification-preferences`)

### `GET /api/notification-preferences`
- Purpose: fetch user notification settings.
- Test A: authenticated -> `200` with preferences payload.
- Test B: unauthenticated -> `401`.

### `POST /api/notification-preferences`
- Purpose: update reminder/notification settings.
- Test A: valid settings -> `200` persisted.
- Test B: invalid field/value -> `400`.

---

## 7) Difficulty Categories (`/api/difficulty-categories`)

### `GET /api/difficulty-categories`
- Purpose: list default + custom difficulty categories.
- Test A: authenticated fetch -> `200` list.
- Test B: unauthorized (if protected) -> `401`.

### `POST /api/difficulty-categories`
- Purpose: create custom category.
- Test A: unique valid name + hex color -> `200/201`.
- Test B: duplicate name/bad color -> `400`.

---

## 8) Premium + Payments

### `GET /api/premium/plans`
- Purpose: fetch available premium plans.
- Test A: normal fetch -> `200` list.
- Test B: forced service failure -> graceful `5xx`.

### `GET /api/premium/status`
- Purpose: current user entitlement/premium status.
- Test A: authenticated -> `200` status.
- Test B: unauthenticated -> `401`.

### `POST /api/payments/razorpay/order`
- Purpose: create payment order.
- Test A: valid plan/order payload -> `200` order details.
- Test B: invalid plan/amount -> `400`.

### `POST /api/payments/razorpay/verify`
- Purpose: verify payment signature and activate premium.
- Test A: valid signature payload -> `200` verified.
- Test B: invalid signature -> `400/401`.

Working signal: successful verify updates premium entitlement.
Not working signal: verify succeeds without valid signature.

---

## 9) Application Submission (`/api/applications`)

### `GET /api/applications/meta`
- Purpose: fetch application form metadata + fee info.
- Test A: normal fetch -> `200` metadata.
- Test B: unsupported locale/query -> `400`.

### `POST /api/applications/create-order`
- Purpose: create application fee payment order.
- Test A: valid payload -> `200` order object.
- Test B: invalid payload -> `400`.

### `POST /api/applications/verify-payment`
- Purpose: verify payment and finalize submission.
- Test A: valid payment proof -> `200` success/submission state.
- Test B: bad proof/signature -> `400`.

---

## 10) Creator Discovery (`/api/discovery`)

### `GET /api/discovery`
- Purpose: return creator discovery feed.
- Test A: standard request -> `200` list/payload.
- Test B: invalid query params -> `400`.

---

## 11) Share/Public Link APIs

### `GET /shared/sheet/{shareId}`
- Purpose: public access to shared sheet by share id.
- Test A: valid share id -> `200`.
- Test B: invalid/expired share id -> `404`.

### `GET /shared/profile/{profileShareId}`
- Purpose: public access to shared profile by share id.
- Test A: valid share id -> `200`.
- Test B: invalid share id -> `404`.

### `GET /profile/{username}`
- Purpose: public profile link endpoint.
- Test A: existing username -> `200`.
- Test B: unknown username -> `404`.

### `GET /profile/{username}/{sheetSlug}`
- Purpose: public sheet under user profile link.
- Test A: valid slug -> `200`.
- Test B: invalid slug -> `404`.

Working signal: endpoints are accessible without protected-token flow where intended.
Not working signal: public routes incorrectly require auth or leak private data.

---

## Final Coverage Checklist (must be true)
- [ ] Every endpoint documented in `API_WORKING.MD` appears here.
- [ ] Every endpoint has a purpose statement.
- [ ] Every endpoint has at least two tests.
- [ ] Each module has concrete “working vs not working” criteria.
