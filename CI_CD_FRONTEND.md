# Frontend CI/CD Implementation Notes

This file tracks only the frontend CI/CD plan for deploying the CreateSheets Vite frontend to Nginx.

It is designed to be updated while Codex implements CI/CD, so the implementation is easy to understand during an interview or handoff.

## Status

Current status: frontend CI/CD implementation added on June 1, 2026. Production deployment still requires GitHub Actions secrets and one-time server setup before a push to `main` can deploy successfully.

Update for full-Docker EC2 deployment:

- The earlier static `deploy-frontend` job has been replaced by a unified `deploy-production` job.
- Frontend is now deployed by syncing the repo to `/opt/createsheets/app` and running `docker compose --env-file .env -f docker-compose.prod.yml up -d --build` on EC2.
- The production frontend still runs only Nginx in its final Docker image.
- Host Nginx terminates HTTPS and proxies `https://www.createsheets.com` to the frontend container on `127.0.0.1:3000`.
- The server `.env` file is required on EC2 and is never copied from GitHub Actions.

Implemented in this pass:

- Replaced the earlier guarded `deploy-frontend` job with a unified full-Docker `deploy-production` job in `.github/workflows/ci.yml`.
- Added `deploy/deploy-frontend.sh` for manual frontend deployments.
- Added `deploy/SECRETS.md` for GitHub Actions secrets and server setup.
- Updated `deploy/nginx-createsheets.conf` with gzip, security headers, no-cache app-shell rules, and immutable Vite asset caching.
- Added `docker-compose.prod.yml` and `deploy/nginx-createsheets-docker.conf` for the EC2 Docker architecture.
- Updated this file with the real command log, errors, and validation results.

## Purpose

The frontend is served by Nginx in production. CI/CD should make deployment repeatable:

1. GitHub Actions runs frontend checks.
2. GitHub Actions runs backend tests.
3. On a push to `main`, GitHub Actions builds the frontend production bundle.
4. The generated `dist/` folder is synced to the server path used by Nginx.
5. Nginx is gracefully reloaded.

This avoids manual SSH deploys, avoids running `npm run dev` in production, and keeps production serving lightweight.

## Detected Frontend Context

These facts were detected from the repository:

| Item | Detected value |
| --- | --- |
| Frontend framework | React 19 with Vite 7 |
| Package manager | npm |
| Lock file | `package-lock.json` |
| Build command | `npm run build` |
| Build output folder | `dist/` |
| Lint command | `npm run lint` |
| Test command | `npm run test` |
| Vite config | `vite.config.js` |
| Backend path | `backend/` |
| Backend test command | `mvn test` from `backend/` |
| Production domain | `https://www.createsheets.com` |
| Production frontend path | `/var/www/createsheets-frontend/dist` |
| Production Nginx config in repo | `deploy/nginx-createsheets.conf` |
| Docker Nginx config in repo | `deploy/frontend-nginx.conf` |

## Existing CI Context

The current workflow file is `.github/workflows/ci.yml`.

It currently has:

- `frontend` job
  - checkout
  - setup Node 20
  - `npm ci`
  - `npm run lint`
  - `npm run build`
  - `npm run test --if-present`
- `backend` job
  - checkout
  - setup Java 17
  - `mvn test` in `backend/`

It currently does not deploy the frontend.

## Uploaded Files Read

The uploaded zip at `/Users/krishnaawasthi/Downloads/files.zip` contained:

| File | Purpose |
| --- | --- |
| `CODEX_CICD_PROMPT.md` | A prompt describing how Codex should implement frontend CI/CD |
| `CI_CD_FRONTEND.md` | A long CI/CD explanation and implementation guide |

Those files were read and used as the basis for this repo-local documentation.

## Commands Already Run While Preparing This File

| Command | Directory | Why it was run | Output summary | Error | Fix |
| --- | --- | --- | --- | --- | --- |
| `unzip -l /Users/krishnaawasthi/Downloads/files.zip` | Repo root | List uploaded files | Zip contained `CODEX_CICD_PROMPT.md` and `CI_CD_FRONTEND.md` | None | None |
| `unzip -p /Users/krishnaawasthi/Downloads/files.zip CODEX_CICD_PROMPT.md` | Repo root | Read uploaded Codex prompt | Confirmed requested CI/CD implementation steps | None | None |
| `unzip -p /Users/krishnaawasthi/Downloads/files.zip CI_CD_FRONTEND.md` | Repo root | Read uploaded CI/CD documentation | Confirmed required documentation sections and examples | None | None |
| `git status -sb` | Repo root | Check current worktree before adding docs | Existing uncommitted frontend changes and untracked local files were present | None | None |
| `rg --files .github deploy . \| rg '(^\.github/\|^deploy/\|package\.json$\|vite\.config\|nginx\|docker-compose\|Dockerfile\|README\|\.env\.example)'` | Repo root | Find workflow, deployment, and frontend-serving files | Found `.github/workflows/ci.yml`, Nginx configs, Docker files, package files, README | None | None |
| `sed -n '1,220p' .github/workflows/ci.yml` | Repo root | Inspect current CI workflow | Found frontend and backend checks with no deploy job | None | None |
| `sed -n '1,220p' package.json` | Repo root | Detect scripts and dependencies | Confirmed npm, React, Vite, lint, build, test commands | None | None |
| `sed -n '1,220p' vite.config.js` | Repo root | Detect Vite settings | Confirmed Vite env prefix, dev proxy, jsdom test setup | None | None |
| `sed -n '1,260p' deploy/nginx-createsheets.conf` | Repo root | Inspect production Nginx config | Found HTTPS redirects, static root, API proxy, SEO routes, noindex rules | None | None |
| `sed -n '1,260p' deploy/frontend-nginx.conf` | Repo root | Inspect Docker frontend Nginx config | Found gzip, static caching, API proxy, SPA fallback, noindex rules | None | None |
| `sed -n '1,220p' .gitignore` | Repo root | Check ignored build and secret files | Confirmed `dist/`, env files, node_modules, and backend targets are ignored | None | None |

## Files To Change During Real CI/CD Implementation

These files were changed for the CI/CD implementation:

| File | Action | Why |
| --- | --- | --- |
| `.github/workflows/ci.yml` | Modified | Added a production deploy job that only runs on push to `main` after frontend and backend checks pass |
| `deploy/deploy-frontend.sh` | Created | Allows manual deployment of a local `dist/` folder to the same Nginx production directory |
| `deploy/SECRETS.md` | Created | Documents required GitHub Actions secrets and one-time server setup |
| `deploy/nginx-createsheets.conf` | Modified | Added gzip, cache headers, security headers, no-cache app shell rules, and immutable asset caching |
| `CI_CD_FRONTEND.md` | Updated | Tracks exact commands, diffs, errors, fixes, and interview notes |

## Actual Implementation Summary

### `.github/workflows/ci.yml`

What changed:

- Workflow name changed from `CI` to `CI / CD`.
- Frontend test step now runs `npm run test` directly because this project has a real `test` script.
- Added `deploy-frontend`.
- `deploy-frontend` has `needs: [frontend, backend]`, so deployment waits for both frontend and backend checks.
- `deploy-frontend` only runs when `github.ref == 'refs/heads/main' && github.event_name == 'push'`.
- Added deployment concurrency group `production-frontend` to avoid overlapping production frontend deploys.
- Production build injects public Vite build-time variables:
  - `VITE_API_BASE_URL`
  - `VITE_APP_API_BASE_URL`
  - `VITE_APP_AUTH_GOOGLE_CLIENT_ID`
  - `VITE_GOOGLE_CLIENT_ID`
  - `VITE_GOOGLE_AUTH_ALLOWED_ORIGINS`
  - `VITE_RAZORPAY_KEY_ID`
  - `VITE_APP_NAME`
  - `VITE_ADMIN_USERNAME`
  - `VITE_SITE_URL`
- Deploy uses `webfactory/ssh-agent@v0.9.0`.
- Deploy adds the production host to `known_hosts` using `ssh-keyscan`.
- Deploy backs up the existing production frontend directory.
- Deploy syncs `dist/` with `rsync --archive --delete --checksum --compress --verbose`.
- Deploy validates and gracefully reloads Nginx with `sudo nginx -t && sudo nginx -s reload`.

Why:

- Pull requests should prove the code builds and tests, but should not deploy.
- Pushes to `main` should deploy only after CI passes.
- `rsync --delete` removes stale Vite chunks from older builds.
- `nginx -s reload` is graceful and avoids downtime.
- `VITE_SITE_URL` keeps SEO/canonical URLs production-correct.
- `VITE_ADMIN_USERNAME` keeps CreateSheets-owned template/gallery logic consistent in the production build.

### `deploy/deploy-frontend.sh`

What changed:

- New executable Bash script.
- Requires `DEPLOY_HOST`.
- Defaults `DEPLOY_USER` to `deploy`.
- Defaults `DEPLOY_DIR` to `/var/www/createsheets-frontend`.
- Validates `dist/index.html`.
- Backs up current server `dist/` to `dist.backup.<timestamp>`.
- Syncs with `rsync --delete`.
- Runs `sudo nginx -t && sudo nginx -s reload`.

Why:

- GitHub Actions handles normal CD, but a manual script is useful for emergency deploys or server testing.
- The script keeps manual deploys aligned with the same Nginx directory and reload behavior as CI/CD.

### `deploy/SECRETS.md`

What changed:

- New documentation for required GitHub Actions secrets:
  - `SSH_DEPLOY_KEY`
  - `DEPLOY_HOST`
  - `DEPLOY_USER`
  - `VITE_GOOGLE_CLIENT_ID`
  - `VITE_RAZORPAY_KEY_ID`
- Added SSH deploy key generation instructions.
- Added server authorized key setup.
- Added `/var/www/createsheets-frontend/dist` ownership setup.
- Added narrow sudoers rule for Nginx validation and reload.
- Added common errors and fixes.

Why:

- CI/CD cannot work until the GitHub secrets and server permissions exist.
- Keeping this in `deploy/` makes deployment setup reproducible without exposing secret values.

### `deploy/nginx-createsheets.conf`

What changed:

- Added gzip compression in the `www.createsheets.com` frontend server block.
- Added security headers:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- Added no-cache headers for `/index.html`.
- Added no-cache headers for `/sw.js`.
- Added one-year immutable cache headers for `/assets/`.
- Disabled access logs for `/assets/` and `/sw.js`.

Why:

- Vite hashed assets are safe to cache for a long time.
- `index.html` should stay fresh so browsers load the latest hashed chunks after each deploy.
- Gzip improves transfer size for JavaScript, CSS, XML, JSON, SVG, and text.
- Security headers improve baseline browser hardening.

## Implementation Command Log

| Command | Directory | Why it was run | Output summary | Error | Fix |
| --- | --- | --- | --- | --- | --- |
| `chmod +x deploy/deploy-frontend.sh` | Repo root | Make the manual deploy script executable | Script mode became executable | None | None |
| `bash -n deploy/deploy-frontend.sh` | Repo root | Validate shell script syntax | Passed with no output | None | None |
| `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/ci.yml"); puts "yaml ok"'` | Repo root | Validate workflow YAML parses as YAML | Printed `yaml ok` | None | None |
| `git diff --check` | Repo root | Check whitespace and patch formatting | Passed with no output | None | None |
| `docker compose config` | Repo root | Validate Compose syntax after Nginx/frontend changes | Compose config rendered successfully | None | None |
| `npm ci` | Repo root | Install exact frontend dependencies from `package-lock.json` | Added 292 packages; npm reported 2 moderate vulnerabilities | None blocking | Audit separately with `npm audit` if desired |
| `npm run lint` | Repo root | Run existing frontend CI lint step | Failed with 142 errors and 3 warnings | Existing app lint errors, including service worker globals, Vitest globals, unused vars, React hook purity rules, and fast-refresh export rules | Not fixed in this CI/CD pass because the errors are unrelated app lint debt |
| `npm run build` | Repo root | Verify Vite production build works | Passed; generated `dist/index.html`, CSS, and JS bundle | Non-blocking warnings for dependency `"use client"` directives and a chunk over 500 kB | No fix required for CI/CD |
| `npm run test` | Repo root | Verify frontend Vitest tests | Passed: 16 test files, 67 tests | Non-blocking `--localstorage-file` warnings | No fix required for CI/CD |
| `mvn test` | `backend/` | Run backend tests using local Maven default Java | Failed under Java 25 | Byte Buddy used by Mockito does not support Java 25 class file version yet | Reran with Java 21 locally; GitHub Actions uses Java 17 |
| `/usr/libexec/java_home -V` | Repo root | Check installed Java versions | Java 21 and Java 8 were found; Java 17 was not listed locally | Java 17 missing locally | Use Java 21 locally or install Java 17 for closer parity |
| `JAVA_HOME=$(/usr/libexec/java_home -v 21) mvn test` | `backend/` | Rerun backend tests with a supported local JDK | Passed: 32 tests, 0 failures, 0 errors | None | None |

## Validation Results

| Check | Result |
| --- | --- |
| Workflow YAML parse | Passed |
| Deploy script Bash syntax | Passed |
| Git diff whitespace check | Passed |
| Docker Compose config parse | Passed |
| `npm ci` | Passed, with 2 moderate npm audit findings |
| `npm run lint` | Failed on existing app lint issues |
| `npm run build` | Passed |
| `npm run test` | Passed, 67 tests |
| `mvn test` with local default Java 25 | Failed because Mockito/Byte Buddy does not support Java 25 here |
| `mvn test` with Java 21 | Passed, 32 tests |

## Current Blockers Before Production Auto-Deploy

1. GitHub Actions secrets must be added before deploy can SSH to the server.
2. The production deploy user must own `/var/www/createsheets-frontend` or otherwise have write permission.
3. The production deploy user must be allowed to run `sudo nginx -t` and `sudo nginx -s reload` without a password.
4. Existing frontend lint errors should be fixed before relying on the workflow for deployment, because `deploy-frontend` correctly waits for `frontend` to pass.
5. Local Java 17 is not installed. Backend tests passed with Java 21 locally and should run with Java 17 in GitHub Actions as configured.

## Current `.github/workflows/ci.yml` Before CI/CD

```yaml
name: CI

on:
  push:
    branches:
      - main
  pull_request:

jobs:
  frontend:
    name: Frontend checks
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build

      - name: Run frontend tests (if present)
        run: npm run test --if-present

  backend:
    name: Backend checks
    runs-on: ubuntu-latest

    defaults:
      run:
        working-directory: backend

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '17'
          cache: maven

      - name: Run backend tests
        run: mvn test
```

## Recommended `.github/workflows/ci.yml` After CI/CD

This is the recommended target shape. Verify it against the real repository before applying.

```yaml
name: CI / CD

on:
  push:
    branches:
      - main
  pull_request:

jobs:
  frontend:
    name: Frontend checks
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build

      - name: Run frontend tests
        run: npm run test

  backend:
    name: Backend checks
    runs-on: ubuntu-latest

    defaults:
      run:
        working-directory: backend

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '17'
          cache: maven

      - name: Run backend tests
        run: mvn test

  deploy-frontend:
    name: Deploy Frontend to Nginx
    runs-on: ubuntu-latest
    needs: [frontend, backend]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build frontend for production
        run: npm run build
        env:
          VITE_API_BASE_URL: ""
          VITE_APP_AUTH_GOOGLE_CLIENT_ID: ${{ secrets.VITE_GOOGLE_CLIENT_ID }}
          VITE_GOOGLE_CLIENT_ID: ${{ secrets.VITE_GOOGLE_CLIENT_ID }}
          VITE_RAZORPAY_KEY_ID: ${{ secrets.VITE_RAZORPAY_KEY_ID }}
          VITE_APP_NAME: "Create Sheets"

      - name: Verify build output
        run: |
          test -d dist
          test -f dist/index.html
          ls -la dist

      - name: Setup SSH agent
        uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.SSH_DEPLOY_KEY }}

      - name: Add server to known_hosts
        run: |
          mkdir -p ~/.ssh
          ssh-keyscan -H "${{ secrets.DEPLOY_HOST }}" >> ~/.ssh/known_hosts
          chmod 644 ~/.ssh/known_hosts

      - name: Deploy dist to Nginx directory
        run: |
          rsync \
            --archive \
            --delete \
            --checksum \
            --compress \
            --verbose \
            dist/ \
            "${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }}:/var/www/createsheets-frontend/dist/"

      - name: Validate and reload Nginx
        run: |
          ssh "${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }}" \
            "sudo nginx -t && sudo nginx -s reload"
```

## Why Each Workflow Piece Exists

| Workflow piece | Why it is used |
| --- | --- |
| `npm ci` | Installs exactly from `package-lock.json`, which makes CI reproducible |
| `npm run lint` | Catches style issues and many simple bugs before deployment |
| `npm run build` | Confirms Vite can compile the app and generates `dist/` |
| `npm run test` | Runs Vitest tests before production deploy |
| `mvn test` | Runs backend tests so broken backend code does not ship with a frontend release |
| `needs: [frontend, backend]` | Prevents deploy when either CI check fails |
| `if: github.ref == 'refs/heads/main' && github.event_name == 'push'` | Prevents production deployment from pull requests |
| `webfactory/ssh-agent` | Loads the private SSH key securely from GitHub Secrets |
| `ssh-keyscan` | Prevents interactive SSH host verification prompts |
| `rsync --delete` | Removes stale Vite chunks from older deployments |
| `rsync --checksum` | Avoids re-uploading unchanged files from fresh CI checkouts |
| `sudo nginx -s reload` | Gracefully reloads Nginx without stopping active connections |

## Required GitHub Actions Secrets

These must be added in GitHub:

`Settings -> Secrets and variables -> Actions -> New repository secret`

| Secret | Description | Example shape |
| --- | --- | --- |
| `SSH_DEPLOY_KEY` | Private SSH key used by GitHub Actions | `<PRIVATE_SSH_KEY_CONTENT>` |
| `DEPLOY_HOST` | Server IP or hostname | `<REDACTED_SERVER_IP>` |
| `DEPLOY_USER` | SSH user on production server | `deploy` or `ubuntu` |
| `VITE_GOOGLE_CLIENT_ID` | Public Google OAuth client ID for the frontend bundle | `<REDACTED>.apps.googleusercontent.com` |
| `VITE_RAZORPAY_KEY_ID` | Public Razorpay key ID for the frontend bundle | `rzp_live_<REDACTED>` |

Do not add backend secrets to Vite env variables. Anything with `VITE_` can become visible in browser JavaScript.

## Manual Server Setup

These commands are examples. Replace the user and host values with the real production values.

Create the frontend directory:

```bash
sudo mkdir -p /var/www/createsheets-frontend/dist
sudo chown -R deploy:deploy /var/www/createsheets-frontend
```

Generate a deploy key locally:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy@createsheets" -f ~/.ssh/createsheets_frontend_deploy
```

Install the public key on the server:

```bash
ssh-copy-id -i ~/.ssh/createsheets_frontend_deploy.pub deploy@YOUR_SERVER_HOST
```

Add the private key to GitHub Actions secret:

```text
SSH_DEPLOY_KEY = full contents of ~/.ssh/createsheets_frontend_deploy
```

Allow only Nginx validation and reload without a password:

```text
deploy ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t, /usr/sbin/nginx -s reload, /bin/nginx -t, /bin/nginx -s reload
```

Use `sudo visudo` to add that line.

## Manual Deploy Script Target

The planned `deploy/deploy-frontend.sh` should look like this in behavior:

```bash
#!/usr/bin/env bash
set -euo pipefail

DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
DEPLOY_DIR="${DEPLOY_DIR:-/var/www/createsheets-frontend}"
DIST_DIR="${DIST_DIR:-$(pwd)/dist}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

if [ -z "$DEPLOY_HOST" ]; then
  echo "ERROR: DEPLOY_HOST is required."
  exit 1
fi

if [ ! -f "$DIST_DIR/index.html" ]; then
  echo "ERROR: $DIST_DIR/index.html not found. Run npm run build first."
  exit 1
fi

ssh "$DEPLOY_USER@$DEPLOY_HOST" "
  mkdir -p '$DEPLOY_DIR'
  if [ -d '$DEPLOY_DIR/dist' ]; then
    cp -a '$DEPLOY_DIR/dist' '$DEPLOY_DIR/dist.backup.$TIMESTAMP'
  fi
"

rsync \
  --archive \
  --delete \
  --checksum \
  --compress \
  --verbose \
  "$DIST_DIR/" \
  "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_DIR/dist/"

ssh "$DEPLOY_USER@$DEPLOY_HOST" "sudo nginx -t && sudo nginx -s reload"
```

## Nginx Rules To Preserve

The production Nginx config currently contains important routes and headers. Preserve them.

| Rule | Why it matters |
| --- | --- |
| HTTP to HTTPS redirect | Keeps traffic encrypted |
| Apex to `www.createsheets.com` redirect | Keeps one canonical domain |
| `root /var/www/createsheets-frontend/dist` | Nginx serves the built frontend |
| `try_files $uri $uri/ /index.html;` | Allows React Router routes to refresh without 404 |
| `/api/` proxy | Sends backend requests to Spring Boot |
| `/robots.txt`, `/llms.txt`, `/sitemap.xml` routes | Keeps SEO and crawler files public |
| `X-Robots-Tag` for private/API routes | Prevents indexing private or API pages |
| `/sitemap-public-sheets.xml` proxy | Lets backend generate dynamic sitemap XML |

If missing, add:

- gzip compression
- long cache for hashed assets
- no-cache for `index.html`
- basic security headers

## Why `try_files $uri $uri/ /index.html;` Matters

CreateSheets is a single page app. When a user visits `/dashboard` or `/sheets/...`, Nginx first checks if there is a real file at that path. Usually there is not. The final fallback serves `index.html`, then React Router reads the URL and renders the correct page.

Without this rule, page refresh on frontend routes would return a 404 from Nginx.

## Why Asset Caching Works

Vite generates hashed filenames such as:

```text
/assets/index-AbCd1234.js
/assets/index-XyZ9876.css
```

When file content changes, the filename changes. That makes it safe to cache `/assets/` for a long time:

```nginx
add_header Cache-Control "public, max-age=31536000, immutable" always;
```

`index.html` should not be cached long term because it points to the latest hashed assets.

## Commands To Run During Real Implementation

Record the real output when these are run.

| Command | Directory | Why |
| --- | --- | --- |
| `npm ci` | Repo root | Install exact frontend dependencies |
| `npm run lint` | Repo root | Verify frontend lint passes |
| `npm run build` | Repo root | Verify frontend build and `dist/` output |
| `npm run test` | Repo root | Run Vitest tests |
| `mvn test` | `backend/` | Run backend tests |
| `chmod +x deploy/deploy-frontend.sh` | Repo root | Make manual deploy script executable |
| `git diff --check` | Repo root | Check whitespace and patch issues |
| `git status -sb` | Repo root | Review final changed files |

If Docker is available:

| Command | Directory | Why |
| --- | --- | --- |
| `docker compose config` | Repo root | Validate compose syntax |
| `docker compose build frontend` | Repo root | Verify frontend Nginx image still builds |

## Errors Faced and Fixes

No major CI/CD implementation error occurred yet. This file was created before changing the actual pipeline.

When implementation starts, add every real error here using this shape:

```text
Error:
<exact error text>

Cause:
<why it happened>

Fix:
<what changed>

Command used after fixing:
<command>

Result:
<passed/failed summary>
```

## Common CI/CD Errors

### `Permission denied (publickey)`

Cause: the private key in `SSH_DEPLOY_KEY` does not match the public key in the server user's `authorized_keys`, or permissions are wrong.

Fix:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
ssh -i ~/.ssh/createsheets_frontend_deploy deploy@YOUR_SERVER_HOST
```

### `Host key verification failed`

Cause: the GitHub runner does not know the server host key.

Fix: keep the workflow step:

```bash
ssh-keyscan -H "${{ secrets.DEPLOY_HOST }}" >> ~/.ssh/known_hosts
```

### `sudo: a password is required`

Cause: the deploy user cannot reload Nginx without entering a password.

Fix: add a narrow sudoers rule with `sudo visudo`.

### `dist/ not found`

Cause: build failed, or the workflow is running from the wrong directory.

Fix:

```bash
npm run build
test -f dist/index.html
```

### White screen after deploy

Cause: browser cached old `index.html`, or stale assets remain on the server.

Fix:

- `index.html` should use no-cache headers.
- `rsync` should use `--delete`.
- Hard refresh browser.

### API returns 502

Cause: Nginx is up, but Spring Boot backend is not reachable.

Fix:

```bash
ss -tlnp | grep 8080
sudo systemctl status createsheets-backend
```

## Verification After Merge To `main`

After secrets are configured and the workflow is merged:

```bash
curl -I https://www.createsheets.com
curl -I https://www.createsheets.com/index.html
curl -I https://www.createsheets.com/dashboard
curl -I https://www.createsheets.com/api/health
curl https://www.createsheets.com/robots.txt
curl https://www.createsheets.com/sitemap.xml
```

Expected:

- Homepage returns `200`.
- `index.html` is not cached aggressively.
- Private routes include noindex behavior or render through the app without exposing private data.
- `/api/health` reaches the backend or returns the expected backend status.
- SEO files remain available.

## Interview Explanation

Use this explanation:

```text
For CreateSheets, the frontend is a React and Vite app. In production it is not served by the Vite dev server. GitHub Actions builds the app into static files under dist, then deploys those files to the server directory that Nginx serves.

The CI part runs on pull requests and pushes. It installs dependencies with npm ci, runs ESLint, builds the Vite app, runs Vitest, and runs backend Maven tests. This protects main from broken builds.

The CD part runs only on push to main. It rebuilds the frontend with production Vite environment variables, loads an SSH deploy key from GitHub Secrets, uses rsync to sync dist to /var/www/createsheets-frontend/dist, and gracefully reloads Nginx. Pull requests never deploy.

Nginx is used because it is very lightweight for static files. Node.js is only needed during the build stage. The final production frontend serving path contains plain HTML, CSS, JS, and assets. Nginx serves hashed Vite assets with long cache headers and serves index.html with no-cache so users get the latest build after deployment.

Secrets are never committed. SSH keys and public frontend build keys are stored in GitHub Actions secrets. Backend secrets never go into Vite variables because Vite variables are visible in browser JavaScript.
```

## Remaining Work

CI/CD files are implemented in this repository. Remaining work is operational:

- Add the required GitHub Actions secrets.
- Complete the one-time server directory, SSH key, and sudoers setup from `deploy/SECRETS.md`.
- Fix the existing frontend lint errors so the `frontend` job can pass and unblock deploy.
- Merge or push these changes to `main` only after reviewing them.
- Watch the first GitHub Actions deploy run and verify production with the curl commands above.

After the first production deploy, update this file with:

- Final GitHub Actions run result.
- Production verification result.
- Any server-specific errors faced.
- Any server-side fixes applied.
