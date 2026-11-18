# CreateSheets CORS Fix Log

This file records the CORS investigation and fix for production CreateSheets. It intentionally avoids real secrets, passwords, tokens, private keys, and environment values.

## 2026-06-02 15:58 IST - User-Reported Browser Error

- Step: Recorded the reported production browser error.
- Reported error: `Access to fetch at 'https://api.createsheets.com/api/auth/google/client-config' from origin 'https://www.createsheets.com' has been blocked by CORS policy: The 'Access-Control-Allow-Origin' header contains multiple values 'https://www.createsheets.com, https://www.createsheets.com', but only one is allowed.`
- Why this matters:
  - Browsers reject a CORS response when `Access-Control-Allow-Origin` appears more than once or contains a comma-separated list.
  - The response must contain exactly one allowed origin value for credentialed cross-origin requests.
- Initial hypothesis:
  - Both host Nginx and the Spring Boot backend are adding CORS response headers.

## 2026-06-02 15:59 IST - Current Worktree And Header Inspection

- Step: Checked local git state and inspected production response headers.
- Commands:
  - `git status -sb && git log -1 --oneline --decorate`
  - `curl -I https://api.createsheets.com/api/auth/google/client-config -H 'Origin: https://www.createsheets.com'`
  - `curl -D - https://api.createsheets.com/api/auth/google/client-config -H 'Origin: https://www.createsheets.com'`
  - `sed -n '1,260p' deploy/nginx-createsheets-docker.conf`
  - `sed -n '1,140p' backend/src/main/java/com/iqms/backend/config/CorsConfig.java`
- Result: Reproduced.
- Output summary:
  - The local repo is on the deployment branch with only unrelated untracked local files.
  - `GET /api/auth/google/client-config` returns HTTP `200` with JSON body.
  - The same `GET` response includes duplicate `Access-Control-Allow-Origin: https://www.createsheets.com` headers.
  - Spring Boot has a global `CorsFilter`.
  - Host Nginx also adds `Access-Control-Allow-*` headers for proxied non-OPTIONS API responses.
- Cause:
  - Duplicate CORS ownership: Spring Boot and Nginx both add CORS headers to actual API responses.
- Fix plan:
  - Keep Nginx handling `OPTIONS` preflight responses because it returns fast `204`.
  - Remove Nginx `Access-Control-Allow-*` headers from non-OPTIONS proxied API responses.
  - Let Spring Boot own CORS headers for real backend responses.

## 2026-06-02 16:00 IST - Nginx CORS Ownership Patch

- Step: Updated host Nginx production config.
- File changed: `deploy/nginx-createsheets-docker.conf`
- What changed:
  - Removed `Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`, and `Vary` from non-OPTIONS proxied API responses in both API locations:
    - `https://www.createsheets.com/api/...`
    - `https://api.createsheets.com/...`
  - Kept `OPTIONS` preflight handling in Nginx.
  - Kept `X-Robots-Tag` noindex behavior.
- Why:
  - Actual API responses should have one CORS owner.
  - Spring Boot already has a global CORS filter and knows the configured allowed origins.
  - Nginx preflight is still useful because it can answer `OPTIONS` quickly without touching the backend.
- Error, if any: None.
- Next action: Deploy the Nginx config to EC2 and verify the Google client-config response has exactly one `Access-Control-Allow-Origin`.

## 2026-06-02 16:02 IST - Production Nginx Deploy And CORS Verification

- Step: Deployed the CORS config fix directly to the EC2 host Nginx and verified production headers.
- Commands:
  - `rsync --archive --checksum --compress --verbose deploy/nginx-createsheets-docker.conf ec2-user@13.232.154.34:/opt/createsheets/app/deploy/nginx-createsheets-docker.conf`
  - `ssh ... 'sudo cp /opt/createsheets/app/deploy/nginx-createsheets-docker.conf /etc/nginx/conf.d/createsheets.conf; sudo nginx -t; sudo systemctl reload nginx; sudo systemctl is-active nginx'`
  - `curl -D - https://api.createsheets.com/api/auth/google/client-config -H 'Origin: https://www.createsheets.com'`
  - `curl -X OPTIONS -D - https://api.createsheets.com/api/auth/google/client-config -H 'Origin: https://www.createsheets.com' -H 'Access-Control-Request-Method: GET' -H 'Access-Control-Request-Headers: Content-Type'`
  - `curl -X POST https://api.createsheets.com/api/auth/login ...`
  - `curl -X POST https://api.createsheets.com/api/sheets ...`
- Result: Success.
- Output summary:
  - Nginx config syntax passed.
  - Nginx reloaded and remained active.
  - `GET /api/auth/google/client-config` returns HTTP `200`.
  - `GET /api/auth/google/client-config` now has exactly one `Access-Control-Allow-Origin` header.
  - `GET /api/auth/google/client-config` now has exactly one `Access-Control-Allow-Credentials` header.
  - `OPTIONS /api/auth/google/client-config` returns HTTP `204` with one allowed origin and the expected allowed methods/headers.
  - API login with the test account succeeded; the token was not printed or written here.
  - `POST /api/sheets` succeeded and returned a created sheet.
- Error, if any:
  - Before the fix, browser GET responses had duplicate CORS headers.
  - After the fix, duplicate CORS headers are gone.
- Next action:
  - Verify the live browser UI path for login and create sheet.
  - Commit and push `cors.md` plus the Nginx config fix so CI/CD keeps the server config stable.

## 2026-06-02 16:05 IST - Live Browser UI Verification

- Step: Tested the live production UI in the browser with the provided test account.
- Commands/actions:
  - Opened `https://www.createsheets.com/login`.
  - Checked browser console logs for CORS, Google client-config, failed fetch, and unable-to-connect errors.
  - Signed in with the provided test account. The password was not written into this file.
  - Opened `https://www.createsheets.com/mysheets`.
  - Clicked the real `Create Sheet` button.
  - Swept 24 live routes after login:
    - `/`
    - `/home`
    - `/explore`
    - `/public-sheets`
    - `/sheets`
    - `/about`
    - `/careers`
    - `/contact`
    - `/how-to-use`
    - `/apply`
    - `/profile/test123`
    - `/profile/test123/mysheets`
    - `/mysheets`
    - the newly created `/mysheets/{sheetId}` URL
    - `/learning-insights`
    - `/premium`
    - `/notifications`
    - `/alerts`
    - `/alarms`
    - `/feedback`
    - `/edit-profile`
    - `/add_accounts`
    - `/import`
    - `/export`
- Result: Success.
- Output summary:
  - Login page had no relevant CORS or Google client-config console errors after the Nginx fix.
  - Login succeeded and landed on `/profile/test123`.
  - `/mysheets` loaded and showed the `Create Sheet` button.
  - Clicking `Create Sheet` created a new sheet and navigated to `/mysheets/{sheetId}`.
  - The page showed the new `Untitled Sheet`.
  - No checked route showed `Unable to connect right now`.
  - No checked route showed `Could not create sheet`.
- Error, if any: None after the CORS fix.
- Next action: Make CI/CD copy the updated host Nginx config into `/etc/nginx/conf.d/createsheets.conf` on deploy, then commit and push.

## 2026-06-02 16:07 IST - CI/CD Host Nginx Config Persistence

- Step: Updated GitHub Actions deployment so future deploys apply the repo host Nginx config before reloading Nginx.
- File changed: `.github/workflows/ci.yml`
- What changed:
  - Added `sudo cp '${EC2_APP_DIR}/deploy/nginx-createsheets-docker.conf' /etc/nginx/conf.d/createsheets.conf` before `sudo nginx -t` and `sudo systemctl reload nginx`.
- Why:
  - The production CORS fix lives in `deploy/nginx-createsheets-docker.conf`.
  - The old deploy job synced the repo to `/opt/createsheets/app` but did not copy the host Nginx config into `/etc/nginx`.
  - Without this step, future deploys could leave host Nginx running an older config.
- Error, if any: None.
- Next action: Run local validation, commit the CORS fix, push to GitHub, and watch CI/CD.

## 2026-06-02 16:08 IST - Local And Live Validation Before Commit

- Step: Validated local config and live production CORS headers before committing.
- Commands:
  - `git diff --check`
  - `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/ci.yml"); puts "yaml ok"'`
  - `docker compose --env-file .env --env-file backend/.env -f docker-compose.prod.yml config >/tmp/createsheets-prod-compose-cors-check.yml`
  - `curl -D - https://api.createsheets.com/api/auth/google/client-config -H 'Origin: https://www.createsheets.com'`
  - `curl -X OPTIONS -D - https://api.createsheets.com/api/auth/google/client-config -H 'Origin: https://www.createsheets.com' -H 'Access-Control-Request-Method: GET' -H 'Access-Control-Request-Headers: Content-Type'`
  - `git status -sb`
  - `git diff --stat`
- Result: Success.
- Output summary:
  - `git diff --check` passed.
  - Workflow YAML parsed successfully.
  - Production Compose rendered successfully with env files.
  - Live `GET /api/auth/google/client-config` has exactly one `Access-Control-Allow-Origin`.
  - Live `GET /api/auth/google/client-config` has exactly one `Access-Control-Allow-Credentials`.
  - Live `OPTIONS /api/auth/google/client-config` returns HTTP `204` with expected CORS preflight headers.
  - Files changed for this fix:
    - `.github/workflows/ci.yml`
    - `deploy/nginx-createsheets-docker.conf`
    - `cors.md`
  - Untracked local files `docs/HR.m4a`, `docs/Tech.m4a`, and `record.md` remain unrelated and will not be staged.
- Error, if any: None.
- Next action: Commit and push the CORS fix to GitHub.

## 2026-06-02 16:09 IST - CORS Fix Commit

- Step: Staged and committed the CORS fix.
- Commands:
  - `git diff --check`
  - `git add .github/workflows/ci.yml deploy/nginx-createsheets-docker.conf cors.md`
  - `git status -sb`
  - `git commit -m "Fix production CORS headers"`
- Result: Success.
- Output summary:
  - Created a commit for the production CORS fix.
  - Staged files:
    - `.github/workflows/ci.yml`
    - `deploy/nginx-createsheets-docker.conf`
    - `cors.md`
  - Untracked local files `docs/HR.m4a`, `docs/Tech.m4a`, and `record.md` were not staged.
- Error, if any: None.
- Next action: Push the committed fix to `main` and watch CI/CD.

## 2026-06-02 16:10 IST - Push And GitHub Actions Verification

- Step: Pushed the production CORS fix to GitHub and watched the deployment workflow.
- Commands:
  - `git push origin HEAD:main`
  - `gh run watch 26814165937 --exit-status`
- Result: Success.
- Output summary:
  - Commit pushed to `main`: `995e385 Fix production CORS headers`.
  - GitHub Actions run: `26814165937`.
  - Production config checks passed.
  - Backend tests and production JAR build passed.
  - Frontend install, lint, build, and tests passed.
  - Production Docker deploy job passed.
  - The deploy job synced the repo to EC2, rebuilt/restarted the Docker stack, copied the host Nginx config into `/etc/nginx/conf.d/createsheets.conf`, reloaded Nginx, and verified public URLs.
- Warnings:
  - GitHub Actions reported a Node 20 deprecation warning for actions. This is not blocking right now, but actions should be upgraded before GitHub removes Node 20 action support.
  - Existing React hook dependency warnings were reported in `src/pages/SheetPage.jsx` and `src/pages/AlarmsPage.jsx`. These were warnings only and did not block the deploy.
- Error, if any: None.
- Next action: Run one final production CORS and health check.

## 2026-06-02 16:12 IST - Final Production Recheck

- Step: Rechecked live production CORS headers and backend health after deployment.
- Commands:
  - `curl -sS --max-time 12 -D - -o /dev/null https://api.createsheets.com/api/auth/google/client-config -H 'Origin: https://www.createsheets.com' | awk 'BEGIN{IGNORECASE=1} /^access-control-allow-origin:/{acao++} /^access-control-allow-credentials:/{acac++} END{print "acao=" acao+0; print "acac=" acac+0}'`
  - `curl -sS --max-time 12 https://www.createsheets.com/api/health`
  - `curl -sS --max-time 12 https://api.createsheets.com/api/health`
  - `git status -sb`
- Result: Success.
- Output summary:
  - `https://api.createsheets.com/api/auth/google/client-config` returns exactly one `Access-Control-Allow-Origin` header for origin `https://www.createsheets.com`.
  - It returns exactly one `Access-Control-Allow-Credentials` header.
  - `https://www.createsheets.com/api/health` returned backend status `ok`.
  - `https://api.createsheets.com/api/health` returned backend status `ok`.
  - Current local branch is `codex/push-current-changes`; the production commit is also on `origin/main`.
  - Untracked local files `docs/HR.m4a`, `docs/Tech.m4a`, and `record.md` remain unrelated and untouched.
- Error, if any: None.
- Final note: This section is a documentation-only follow-up so the repo contains the final observed CI/CD and production verification results. It does not change production behavior.
