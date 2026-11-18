# Interactive Question Management Sheet

Create Sheets is a full-stack platform to build topic-wise DSA and coding sheets with per-question solve tracking, notes, and revision reminders.
It also includes public sheet sharing/copying, progress analytics, notifications, and premium productivity workflows for interview preparation.

**Live frontend:** createsheets.com

## AI crawler and SEO readiness

CreateSheets publishes `robots.txt`, `llms.txt`, `llms-full.txt`, static sitemaps, and a dynamic public sheet sitemap for `https://www.createsheets.com`.

- Production robots policy allows AI search/user-request bots such as `OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, and `Claude-User`.
- Training crawlers `GPTBot` and `ClaudeBot` are blocked by default.
- Public discovery is canonical at `/explore`; public sheets are canonical at `/sheets/{username}/{sheetSlug}`.
- Private/auth/API routes are protected by auth and marked noindex.

See [`docs/AI_CRAWLER_SEO.md`](./docs/AI_CRAWLER_SEO.md) for final URLs, verification commands, Nginx deployment notes, and how to switch to the allow-training robots policy.

## Coding profiles

Create Sheets includes a connected coding profiles dashboard at `/add_accounts`.

- Users can add platform usernames with fixed URL prefixes, generate verification codes, and prove ownership through public name/bio/profile text.
- Verified profiles can be synced through the backend; the backend calls platform APIs or public profile pages, measures API time, stores snapshots in MongoDB, and serves cached data on later visits.
- Public profiles include a full coding stats view for verified profiles only.
- Supported sync sources include LeetCode, Codeforces, CodeChef, AtCoder, HackerRank, HackerEarth, Topcoder, SPOJ, Kattis, Codewars, Exercism, CodeSignal, CodinGame, DMOJ, GitHub, and a clear unavailable state for CSES user stats.
- Verification is strict: if the generated code cannot be read from a public profile field, the profile remains pending or failed and is not shown publicly.

## Sheet editing and transfer

- Recently updated sheets open by stable sheet id when the viewer owns the sheet, so duplicate titles no longer send users to the wrong sheet.
- New, renamed, copied, and backend-created duplicate sheet names are de-duplicated with numeric suffixes such as `Sheet Name (1)`.
- Question rows use a compact practice layout with a primary `Solve` action, up to two additional resource actions, and a `Tags & resources` edit control.
- Each question stores and exports at most three resource links. The primary problem URL is named `Problem Link`.
- JSON export and import use the same normalized sheet shape, including `resourceLinks`, and the downloadable sample in `public/sample-import-sheet.json` matches that schema.

## Reliability guarantees (copy/create/session)

- Authenticated sheet actions are now session-safe end to end:
  - backend token validation also checks that the token user still exists,
  - stale sessions return `401` immediately,
  - frontend auto-clears stale session storage and redirects to login with `next` return path.
- Public sheet copy prefers canonical source sheet ids and keeps source metadata (including description) on copied sheets.
- Direct editor-route metadata is no longer dependent on preloaded list state; sheet title/description/visibility now resolve from loaded sheet payload and persist correctly after refresh.
- Progress persistence for attempt logs and topic/subtopic rollups is validated through save + reload flows.

## Notifications

- Notifications support read, done, dismiss, archive, delete, snooze, and reschedule flows.
- Inbox and alerts hide archived notifications; the Archived section shows only archived items.
- `Archive Read` bulk-archives read/completed/dismissed notifications through the backend.

## Project overview

This repository contains:
- A **React + Vite frontend** at the repo root.
- A **Spring Boot backend** in `backend/` for authentication and API services.
- A **MongoDB datastore** for users and sheet data.

The app is designed to work well for day-to-day editing while supporting progressive backend integration and online sync workflows.

## Architecture overview

The current architecture follows a clear client/store/API/server split:

```text
[React Frontend]
       |
       v
[Zustand Store] <-> [API Layer]
                        |
                        v
              [Spring Boot Backend]
                        |
                        v
                    [MongoDB]
```

### Components
- **React frontend:** rendering, routing, interaction flows.
- **Zustand store:** local UI/domain state management.
- **API layer:** encapsulated HTTP calls and sync/auth integration points.
- **Spring Boot backend:** REST APIs, validation, authentication logic.
- **MongoDB:** persistent storage for backend-managed data.


## Requirements document

For a consolidated frontend/backend requirement list, see [`requirements.md`](./requirements.md).

## Frontend stack

- React 19
- Vite 7
- Zustand 5
- React Router DOM 7
- Tailwind CSS 4
- ESLint 9

## Backend stack

- Java 17
- Spring Boot 3.4
- Spring Web
- Spring Data MongoDB
- Spring Validation
- Spring Security Crypto
- Maven

## Environment variables

### Frontend (`.env`)

Copy and update:

```bash
cp .env.example .env
```

Variables:
- `VITE_API_BASE_URL` (optional; when empty, frontend uses `/api` in local dev and same-origin in deployments. Avoid setting this to `http://localhost:8080` on HTTPS/deployed frontends.)
- `VITE_SYNC_API_BASE_URL` (default: `/api/sync/outbox`)
- `VITE_PUBLIC_SHEET_API_BASE_URL` (default: public sheet endpoint)
- `VITE_RAZORPAY_KEY_ID` (Razorpay publishable key id; optional fallback if backend does not return key id)
- `VITE_GOOGLE_AUTH_ALLOWED_ORIGINS` (optional comma-separated list of local/deployed origins where the Google sign-in button may render, e.g. `http://127.0.0.1:5174`)

### Backend (`backend/.env`)

```bash
cd backend
cp .env.example .env
```

Variables:
- `MONGODB_URI` (default example: `mongodb://localhost:27017/create-sheets`)
- `APP_AUTH_SECRET` (required for real deployments)
- `APP_PAYMENT_RAZORPAY_ENABLED` (`true` to require and enable Razorpay payments)
- `RAZORPAY_KEY_ID` (Razorpay API key id, safe to share with frontend through backend response)
- `RAZORPAY_KEY_SECRET` (Razorpay API secret, **keep only on backend/server env**)

## How to get each required credential/service

Use the provided sample files first:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Then fill values service by service:

1. **MongoDB (`MONGODB_URI`)**
   - Create a cluster in MongoDB Atlas (or run local MongoDB).
   - In Atlas: Database → Connect → Drivers → copy connection string.
   - Replace username, password, and database name in `backend/.env`.

2. **Auth secret (`APP_AUTH_SECRET`)**
   - Generate a strong random secret (32+ chars).
   - Example:
     ```bash
     openssl rand -base64 48
     ```
   - Paste output into `APP_AUTH_SECRET`.

   - Add origin: `http://localhost:5173` for local development.

   - Use your mail provider SMTP credentials.
   - For Gmail:
     - `APP_MAIL_HOST=smtp.gmail.com`
     - `APP_MAIL_PORT=587`
     - `APP_MAIL_AUTH=true`
     - `APP_MAIL_STARTTLS=true`
     - Use an App Password in `APP_MAIL_PASSWORD`.
   - Set `APP_MAIL_ENABLED=true` only after all mail fields are configured.

5. **Razorpay (`APP_PAYMENT_RAZORPAY_ENABLED`, `RAZORPAY_*`, `VITE_RAZORPAY_KEY_ID`)**
   - Create Razorpay account → Dashboard → API Keys.
   - Generate test keys first.
   - Put:
     - `RAZORPAY_KEY_ID` in `backend/.env`
     - `RAZORPAY_KEY_SECRET` in `backend/.env` (never expose publicly)
     - `VITE_RAZORPAY_KEY_ID` in frontend `.env` (publishable key id)
   - Enable payments by setting `APP_PAYMENT_RAZORPAY_ENABLED=true`.

6. **Optional frontend-only vars**
   - `VITE_API_TIMEOUT_MS`: request timeout (default `12000`).
   - `VITE_WEB_PUSH_PUBLIC_KEY`: required only for push subscription support.

### Razorpay premium flow (secure)

- Frontend opens `checkout.razorpay.com` only after requesting an order from backend.
- Backend creates Razorpay order, stores pending order in MongoDB, and verifies signature + payment details before activating premium.
- Premium is activated only after backend verification succeeds.




Required backend env vars:

- `APP_MAIL_HOST`
- `APP_MAIL_PORT` (typically `587` for STARTTLS)
- `APP_MAIL_USERNAME`
- `APP_MAIL_PASSWORD`
- `APP_MAIL_FROM`

Optional backend env vars:

- `APP_MAIL_FROM_NAME` (default: `IQMS`)
- `APP_MAIL_AUTH` (default: `true`)
- `APP_MAIL_STARTTLS` (default: `true`)



1. **Backend env setup (`backend/.env`)**
   - Add:
   - For multiple accepted IDs, use:
2. **Frontend env setup (`.env`)**
   - Add one of:
3. **Match IDs**
   - The frontend client ID must be one of the backend accepted IDs.
5. **Restart both apps after env changes**
   - Stop and restart backend and frontend; Vite/Spring do not reliably pick up changed env vars without restart.

Quick verification:

```bash
```


Run backend with explicit env values:

```bash
cd backend
APP_MAIL_ENABLED="true" \
APP_MAIL_HOST="smtp.gmail.com" \
APP_MAIL_PORT="587" \
APP_MAIL_USERNAME="<smtp-username>" \
APP_MAIL_PASSWORD="<smtp-password-or-app-password>" \
APP_MAIL_FROM="<from-email>" \
APP_MAIL_FROM_NAME="IQMS" \
MONGODB_URI="<your-mongodb-uri>" \
mvn spring-boot:run
```

Then start frontend:

```bash
cd /workspace/Interactive-Question-Management-Sheet
npm run dev
```


- Add your frontend URL to **Authorized JavaScript origins** (for local dev: `http://localhost:5173`).
- If you are testing on a non-default local port, add that exact origin too, for example `http://127.0.0.1:5174`.
- Also set `VITE_GOOGLE_AUTH_ALLOWED_ORIGINS` to the same origin during local testing. If this env var is not set for a local URL, the app shows an email/password fallback note instead of opening Google's `origin_mismatch` error page.


- For Gmail, use an App Password (not your normal account password) in `APP_MAIL_PASSWORD`.

## Local development steps

### 1) Start backend

```bash
cd backend
mvn spring-boot:run
```

Backend runs at `http://localhost:8080`.

If Maven reports a missing file like `backend/backend/pom.xml`, you are launching from the wrong directory (or with an extra `-f backend/pom.xml`). Run from the repository root exactly as shown above (`cd backend` once, then `mvn spring-boot:run`).

### 2) Start frontend

```bash
cd /workspace/Interactive-Question-Management-Sheet
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

### Local test login

For local UI smoke testing, use the existing test account:

- Username: `test123`
- Password: `test@123`

These credentials are only for local/dev verification. Do not use them for production accounts.

### Alternate-port UI testing

Recent UI testing used non-default ports to avoid conflicts:

```bash
cd backend
JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home \
APP_AUTH_SECRET="dev-only-change-me-for-ui-test" \
MONGO_STARTUP_PING_ENABLED=false \
APP_CORS_ALLOWED_ORIGINS="http://localhost:5174,http://127.0.0.1:5174" \
mvn spring-boot:run -Dspring-boot.run.profiles=dev -Dspring-boot.run.arguments="--server.port=8091"
```

```bash
VITE_API_BASE_URL="http://127.0.0.1:8091" npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Verify CORS:

```bash
curl -i -X OPTIONS http://127.0.0.1:8091/api/auth/login \
  -H 'Origin: http://127.0.0.1:5174' \
  -H 'Access-Control-Request-Method: POST'
```

## Testing steps

### Frontend checks

```bash
npm run lint
npm run build
```

### Backend checks

```bash
cd backend
mvn test
```

## Deployment notes

### Vercel routing and API proxy

If you deploy the frontend on Vercel with React Router `BrowserRouter`, add `vercel.json` rewrites so deep links (like `/login`) load `index.html` and `/api/*` calls are proxied to backend.

This repository includes:
- `/api/* -> http://15.207.72.139:8080/api/*`
- `/* -> /index.html`

If your backend host changes, update `vercel.json` before deploying.


- Frontend is currently deployed on **Vercel** (see live link above).
- For production deployments, set environment variables in your hosting platform instead of hardcoding config.
- Backend can be deployed to any Java-compatible platform (Render, Railway, Fly.io, ECS, etc.) with:
  - Java 17 runtime
  - `MONGODB_URI` configured
  - strong `APP_AUTH_SECRET` configured
- Ensure CORS/API base URLs are aligned between deployed frontend and backend environments.

## Local Development Troubleshooting

### CORS Errors ("Unable to reach auth server")
If the frontend fails to communicate with the backend on localhost (e.g., throwing network errors or 403 Forbidden on preflight requests), ensure that the backend's `.env` file (`backend/.env`) has the `APP_CORS_ALLOWED_ORIGINS` property set correctly to match your frontend URL:
```env
APP_CORS_ALLOWED_ORIGINS=http://localhost:5172,http://localhost:5173,http://localhost:8080
```
*Note: Avoid putting quotes around the list of origins in the `.env` file for Spring Boot.*

### Compilation Errors on Backend Start
If you see errors like `NoClassDefFoundError: Sheet` when starting the backend, verify that `Sheet.java` is in the correct directory matching its package: `src/main/java/com/iqms/backend/model/Sheet.java`. If it is in a `sheet/` subdirectory but claims to be in the `model` package, move it physically to the `model/` folder.

## Known improvements made

Recent refactors improved maintainability and onboarding:
- Migrated from custom hash routing to **React Router + BrowserRouter**.
- Introduced route-guard patterns for protected/public-only auth flows.
- Consolidated routing helpers into a dedicated routes service.
- Clarified local-first architecture direction (state, persistence, sync pipeline).
- Standardized environment-driven runtime configuration for frontend/backend.
- Fixed mobile navigation so phone-width screens use a hamburger drawer instead of showing the collapsed desktop rail.
- Fixed the collapsed laptop/desktop sidebar so all sidebar actions stay visible as icons while labels collapse.
- Simplified profile sheet controls so users see the main action first and advanced actions behind a `Manage` disclosure.
- Added a local Google OAuth guard to avoid the `Error 400: origin_mismatch` page on unregistered local origins.
- Styled theme character images as circular avatar-like controls in the topbar.
- Styled lotus premium indicators as small circular account badges beside profile names.
- Added a defensive test storage mock so frontend tests pass reliably in Vitest.

See [`CHANGELOG.md`](./CHANGELOG.md) for the latest detailed change notes.
