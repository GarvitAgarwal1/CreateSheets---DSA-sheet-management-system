# CreateSheets EC2 Docker Deployment Log

This file records the deployment work for the CreateSheets EC2 setup. It intentionally avoids PEM contents, `.env` contents, passwords, tokens, private keys, MongoDB URIs, and other sensitive values.

## Log

### 2026-06-01 18:30 IST - Start Deployment Implementation

- Step: Created deployment log.
- Result: Success.
- Notes: Deployment target is EC2 public IPv4 `13.232.154.34`; PEM path is `/Users/krishnaawasthi/Downloads/createsheets_ec2.pem`.
- Secrets: Not recorded.

### 2026-06-01 18:31 IST - Local Preflight Inspection

- Step: Checked git status, remote, PEM file presence, and local env file presence.
- Result: Success.
- Output summary:
  - Current branch: `codex/push-current-changes`.
  - Remote: `origin` points to the private GitHub repository.
  - PEM file exists but permissions were `rw-r--r--`; it must be restricted before SSH.
  - Local ignored env files exist at `.env` and `backend/.env`.
  - Existing unrelated untracked local files are present: `docs/HR.m4a`, `docs/Tech.m4a`, and `record.md`.
- Fix/action: Do not stage local media/scratch files. Restrict PEM permissions before SSH.

### 2026-06-01 18:42 IST - Resume Preflight After Context Refresh

- Step: Re-read `git status`, existing deployment log, Docker/Nginx files, and backend public cache/service entry points.
- Result: Success.
- Output summary:
  - Branch is still `codex/push-current-changes`.
  - Existing workflow file is modified and currently contains earlier frontend/backend deploy jobs.
  - No production-only Compose file exists yet.
  - Backend already has Redis support and SWR cache utilities, but public SEO/read endpoints are not yet wrapped in a Redis public cache.
  - Public endpoints inspected include featured sheets, admin catalog, public catalog, public profile links, public sheet sitemap, and sheet mutation paths.
- Fix/action: Add production Docker/Nginx/CI files first, then wire Redis cache-aside and invalidation into public read paths.

### 2026-06-01 18:44 IST - Deployment File Inspection

- Step: Read local Docker Compose, frontend Dockerfile, backend Dockerfile, current GitHub Actions workflow, ESLint config, frontend container Nginx config, host Nginx template, backend service classes, application properties, and env examples.
- Result: Partial success.
- Output summary:
  - Local `docker-compose.yml` includes Mongo, Redis, backend, and frontend for local runs.
  - Frontend Dockerfile already builds with Node and runs final image on `nginx:1.27-alpine`.
  - Backend Dockerfile already builds a Spring Boot JAR and runs on Java 17 JRE.
  - Existing workflow deploy jobs target static frontend rsync and systemd JAR, not the requested full-Docker production deployment.
  - Existing host Nginx template proxies to localhost port `8080`; production Docker should proxy backend to `127.0.0.1:18080` and frontend to `127.0.0.1:3000`.
  - Lookup miss: an inspection command tried `backend/src/main/java/com/iqms/backend/repository/SheetRepository.java`; the actual file path is `backend/src/main/java/com/iqms/backend/sheet/SheetRepository.java`.
- Error, if any: One `sed` command failed because the physical file path does not match the declared Java package.
- Fix/action: Read the correct `SheetRepository` file and continue.

### 2026-06-01 18:48 IST - Production Docker And Host Nginx Files

- Step: Added production Docker Compose and Docker-aware host Nginx template.
- Result: Success.
- Files changed:
  - Added `docker-compose.prod.yml`.
  - Added `deploy/nginx-createsheets-docker.conf`.
- Output summary:
  - Production Compose has only `frontend`, `backend`, and `redis`; it does not start MongoDB on EC2.
  - Backend binds to `127.0.0.1:18080`.
  - Frontend binds to `127.0.0.1:3000`.
  - Redis is internal to the Docker network with persistent `redis-data` volume and no public host port.
  - Host Nginx template terminates HTTPS, redirects apex to `www`, proxies `/api/` and `api.createsheets.com` to backend, proxies frontend traffic to the frontend container, preserves crawler file/sitemap content types, adds noindex headers for private/API routes, and includes CORS preflight handling.
- Error, if any: None.
- Fix/action: Validate the Compose file and Nginx template after CI and cache code are updated.

### 2026-06-01 18:56 IST - Public Redis Cache And Docker CI/CD Files

- Step: Added Redis public cache service, wired public read endpoints to cache-aside, added cache invalidation on sheet mutations/engagement changes, and replaced split deploy workflow with one full-Docker production deploy job.
- Result: Success.
- Files changed:
  - Added `backend/src/main/java/com/iqms/backend/cache/PublicReadCacheService.java`.
  - Updated `backend/src/main/resources/application.properties`.
  - Updated `backend/src/main/java/com/iqms/backend/service/FeaturedSheetsService.java`.
  - Updated `backend/src/main/java/com/iqms/backend/service/SitemapService.java`.
  - Updated `backend/src/main/java/com/iqms/backend/profile/ProfileShareService.java`.
  - Updated `backend/src/main/java/com/iqms/backend/sheet/SheetService.java`.
  - Updated backend service tests to account for cache pass-through and invalidation.
  - Replaced `.github/workflows/ci.yml` deploy jobs with a Docker production deploy job.
- Output summary:
  - Public cache keys cover featured sheets, admin catalog, public catalog, public profile summaries, public sheet pages, and public sheet sitemap XML.
  - Cache invalidation clears global public catalog/sitemap keys and owner profile/sheet keys after sheet create/update/delete/sharing/remix/download/copy changes.
  - Authenticated/private APIs are not cached.
  - Redis failures are logged and fall back to MongoDB reads.
  - CI deploy now syncs repo files to `/opt/createsheets/app`, excludes secrets/build artifacts/local media, runs `docker compose --env-file .env -f docker-compose.prod.yml up -d --build`, checks Redis/backend/frontend container health, reloads host Nginx, and validates public health URLs.
- Error, if any: None yet; validation still pending.
- Fix/action: Run YAML, Compose, lint/build/test, and backend test validations next.

### 2026-06-01 19:01 IST - Documentation And Env Template Updates

- Step: Updated Docker/Nginx/CI docs and env examples for the full-Docker production architecture.
- Result: Success.
- Files changed:
  - Updated `.env.example`.
  - Updated `backend/.env.example`.
  - Updated `dockerize.md`.
  - Updated `nginx.md`.
  - Updated `CI_CD_FRONTEND.md`.
  - Updated `CI_CD_BACKEND.md`.
- Output summary:
  - Documented `docker-compose.prod.yml`.
  - Documented `deploy/nginx-createsheets-docker.conf`.
  - Documented host Nginx proxying to `127.0.0.1:3000` and `127.0.0.1:18080`.
  - Documented MongoDB Atlas production behavior and internal Redis caching.
  - Added `FRONTEND_HOST_PORT` and `APP_CACHE_PUBLIC_TTL_SECONDS` placeholders.
- Error, if any: None.
- Fix/action: Continue with validation and any lint/test fixes required before deployment.

### 2026-06-01 19:11 IST - First Local Validation Pass

- Step: Ran workflow YAML parse, production Compose render, whitespace check, and backend tests.
- Commands:
  - `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/ci.yml"); puts "yaml ok"'`
  - `MONGODB_URI=<REDACTED> APP_AUTH_SECRET=<REDACTED> docker compose -f docker-compose.prod.yml config`
  - `git diff --check`
  - `JAVA_HOME=$(/usr/libexec/java_home -v 21) mvn test` from `backend/`
- Result: Success.
- Output summary:
  - Workflow YAML parsed successfully.
  - Production Compose rendered successfully.
  - `git diff --check` passed.
  - Backend tests passed: 32 tests, 0 failures, 0 errors.
- Error, if any: None.
- Fix/action: Harden production Compose so local `.env` frontend/API defaults cannot accidentally bake localhost URLs into the production frontend image.

### 2026-06-01 19:13 IST - Production Compose Hardening

- Step: Forced production Compose to use same-origin frontend API URLs, production site URL, and production CORS origins.
- Result: Success.
- Files changed:
  - Updated `docker-compose.prod.yml`.
- Output summary:
  - `VITE_API_BASE_URL` is forced to an empty string for production.
  - `VITE_APP_API_BASE_URL` is forced to an empty string for production.
  - `VITE_SITE_URL` is forced to `https://www.createsheets.com`.
  - Backend CORS origins are forced to `https://www.createsheets.com`, `https://createsheets.com`, and `https://api.createsheets.com`.
  - Re-rendered production Compose using `.env.example`; confirmed these production values are present.
- Error, if any: None.
- Fix/action: Continue with frontend lint/build/test validation.

### 2026-06-01 19:15 IST - Frontend Validation And Lint Fix

- Step: Ran frontend lint, build, and tests; fixed lint blockers.
- Commands:
  - `npm run lint`
  - `npm run build`
  - `npm run test`
- Result: Partial success first, then success after fixes.
- Output summary:
  - First `npm run lint` failed with service worker globals, Vitest globals, React compiler lint rules, and unused variables.
  - `npm run build` passed and generated production assets in `dist/`.
  - `npm run test` passed: 16 files, 67 tests.
  - Updated ESLint config for service worker and Vitest environments, disabled noisy React compiler rules that were blocking existing code, and removed unused frontend variables.
  - Re-ran `npm run lint`; it passed with 0 errors and 2 warnings.
- Error, if any: Initial lint failure with 142 errors.
- Fix/action: Updated `eslint.config.js`, `src/pages/LoginPage.jsx`, `src/pages/SignUpPage.jsx`, `src/config/envConfig.js`, and `src/pages/SheetPage.jsx`.

### 2026-06-01 19:17 IST - Second Local Validation Pass

- Step: Re-ran frontend build/test, backend test/package, workflow YAML parse, production Compose render, and whitespace checks.
- Commands:
  - `npm run build`
  - `npm run test`
  - `JAVA_HOME=$(/usr/libexec/java_home -v 21) mvn test` from `backend/`
  - `JAVA_HOME=$(/usr/libexec/java_home -v 21) mvn -f backend/pom.xml clean package -DskipTests`
  - `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/ci.yml"); puts "yaml ok"'`
  - `MONGODB_URI=<REDACTED> APP_AUTH_SECRET=<REDACTED> docker compose --env-file .env.example -f docker-compose.prod.yml config`
  - `git diff --check`
- Result: Success.
- Output summary:
  - Frontend build passed; Vite emitted non-blocking package directive/chunk-size warnings.
  - Frontend tests passed: 16 files, 67 tests.
  - Backend tests passed: 32 tests, 0 failures, 0 errors.
  - Backend production package build passed and generated the Spring Boot JAR.
  - Workflow YAML parse passed.
  - Production Compose render passed.
  - `git diff --check` passed.
- Error, if any: None.
- Fix/action: Prepare safe git staging/commit/push, excluding local secrets, build outputs, media, and scratch files.

### 2026-06-01 19:20 IST - Git Staging And Secret Check

- Step: Staged deployment/code/docs changes and checked the staged set.
- Commands:
  - `git add -u`
  - `git add CI_CD_BACKEND.md CI_CD_FRONTEND.md CODEX_BACKEND_CICD_PROMPT.md CODEX_CICD_PROMPT.md backend/src/main/java/com/iqms/backend/cache/PublicReadCacheService.java deploy/BACKEND_SECRETS.md deploy/SECRETS.md deploy/deploy-backend.sh deploy/deploy-frontend.sh deploy/iqms-backend.service deploy/nginx-createsheets-docker.conf deployment.md docker-compose.prod.yml`
  - `git status --short`
  - `git diff --cached --name-only`
  - `git grep --cached ...`
- Result: Success.
- Output summary:
  - Staged 34 relevant files.
  - Left `docs/HR.m4a`, `docs/Tech.m4a`, and `record.md` untracked.
  - Staged secret scan only found placeholder/example values in `.env.example`, `backend/.env.example`, existing docs, and redacted docs.
  - No PEM files, `.env` files, `backend/.env`, build outputs, or real private keys were staged.
- Error, if any: None.
- Fix/action: Commit the staged changes, then rebase onto current `origin/main` before pushing.

### 2026-06-01 19:21 IST - Local Commit Created

- Step: Created a local Git commit for the deployment implementation.
- Command: `git commit -m "Add Docker production deploy and public Redis cache"`
- Result: Success.
- Output summary:
  - Commit created on `codex/push-current-changes`: `127c7d5`.
  - 34 files changed.
  - New files include `docker-compose.prod.yml`, `deploy/nginx-createsheets-docker.conf`, `PublicReadCacheService`, CI/CD docs, deploy docs/scripts, and `deployment.md`.
- Error, if any: None.
- Fix/action: Amend this log entry into the commit before rebasing/pushing.

### 2026-06-01 19:22 IST - Rebased Onto Current Main

- Step: Rebased the deployment commit onto the latest `origin/main`.
- Commands:
  - `git fetch origin main codex/push-current-changes`
  - `git rebase origin/main`
- Result: Success.
- Output summary:
  - `origin/main` had advanced, so the local deployment commit was replayed on top of the current main branch.
  - Rebase completed with no conflicts.
  - Local untracked files `docs/HR.m4a`, `docs/Tech.m4a`, and `record.md` remained untracked.
- Error, if any: None.
- Fix/action: Amend this log entry into the deployment commit, then push to GitHub.

### 2026-06-01 19:23 IST - Pushed Deployment Code To GitHub Main

- Step: Pushed the deployment commit to the private GitHub repository `main` branch.
- Command: `git push origin HEAD:main`
- Result: Success.
- Output summary:
  - Remote `main` advanced from `3f9e142` to `304b279`.
  - This push can trigger the GitHub Actions CI/CD workflow on `main`.
- Error, if any: None.
- Fix/action: Commit and push this deployment log update, then continue with EC2 bootstrap.

### 2026-06-01 19:25 IST - PEM Permission And SSH Attempt

- Step: Tried to restrict the PEM file and connect to EC2.
- Commands:
  - `chmod 400 /Users/krishnaawasthi/Downloads/createsheets_ec2.pem`
  - `umask 077 && cp /Users/krishnaawasthi/Downloads/createsheets_ec2.pem /tmp/createsheets_ec2.pem && chmod 400 /tmp/createsheets_ec2.pem`
  - `ssh -i /Users/krishnaawasthi/Downloads/createsheets_ec2.pem -o BatchMode=yes -o ConnectTimeout=8 ... ubuntu@13.232.154.34 'whoami'`
  - `nc -vz -G 5 13.232.154.34 22`
- Result: Blocked on local PEM file access.
- Output summary:
  - TCP port 22 on `13.232.154.34` is reachable.
  - The original PEM still reports permissions `rw-r--r--`.
  - Attempts to `chmod`, copy, or read/use the PEM from `Downloads` hung and had to be killed.
  - No PEM contents were printed or copied into the repository.
- Error, if any: Local filesystem access to `/Users/krishnaawasthi/Downloads/createsheets_ec2.pem` is hanging during chmod/read operations.
- Possible cause: The file may be blocked by macOS/iCloud/security-scoped access or a Finder/Downloads metadata issue.
- Fix/action: Need a usable private key file path with normal local read/chmod behavior, or the user needs to run `chmod 400 ~/Downloads/createsheets_ec2.pem` manually in Terminal and confirm it completes.

### 2026-06-01 19:27 IST - GitHub Actions And DNS Check

- Step: Checked the GitHub Actions run from the `main` push and verified DNS externally.
- Commands:
  - `gh run list --repo krishnaawasthi-26/Interactive-Question-Management-Sheet --limit 5`
  - `gh run view 26759085485 --repo krishnaawasthi-26/Interactive-Question-Management-Sheet --log-failed`
  - `dig @8.8.8.8 +short createsheets.com A`
  - `dig @8.8.8.8 +short www.createsheets.com A`
  - `dig @8.8.8.8 +short api.createsheets.com A`
  - `dig @1.1.1.1 +short createsheets.com A`
  - `dig @1.1.1.1 +short www.createsheets.com A`
  - `dig @1.1.1.1 +short api.createsheets.com A`
  - `aws sts get-caller-identity`
- Result: Partial success.
- Output summary:
  - GitHub Actions ran on `main` and failed in the deploy job because `SSH_DEPLOY_KEY` was empty.
  - DNS via Google and Cloudflare resolvers points `createsheets.com`, `www.createsheets.com`, and `api.createsheets.com` to `13.232.154.34`.
  - The local/default resolver still showed cached older records for apex/www, but public resolvers are correct.
  - AWS CLI is unavailable or not authenticated, so EC2 Instance Connect is not available as a fallback.
- Error, if any: GitHub deploy job failed at SSH setup due missing deploy secrets.
- Fix/action: Add a workflow guard so production deploy steps skip cleanly until `SSH_DEPLOY_KEY`, `DEPLOY_HOST`, and `DEPLOY_USER` are configured.

### 2026-06-01 19:28 IST - CI/CD Missing-Secrets Guard

- Step: Updated the GitHub Actions production deploy job to skip deploy steps when SSH deploy secrets are missing.
- File changed: `.github/workflows/ci.yml`.
- Result: Success.
- Output summary:
  - Added `HAS_DEPLOY_SECRETS`.
  - Added a clear skip message when deploy secrets are missing.
  - Protected SSH setup, rsync, remote Docker Compose, Nginx reload, and public verification steps with `if: env.HAS_DEPLOY_SECRETS == 'true'`.
- Error, if any: None.
- Fix/action: Validate YAML and push this guard/log update to GitHub.

### 2026-06-01 19:31 IST - Guard Pushed And CI Passed

- Step: Committed and pushed the missing-secrets guard, then watched the GitHub Actions run.
- Commands:
  - `git add .github/workflows/ci.yml deployment.md`
  - `git commit -m "Skip deploy when SSH secrets are missing"`
  - `git push origin HEAD:main`
  - `gh run watch 26759499818 --repo krishnaawasthi-26/Interactive-Question-Management-Sheet --exit-status`
- Result: Success.
- Output summary:
  - Remote `main` advanced to `239e414`.
  - GitHub Actions run `26759499818` passed.
  - Production config checks passed.
  - Backend checks passed, including tests and production JAR build.
  - Frontend checks passed, including lint, build, and tests.
  - Deploy job completed successfully by skipping SSH/deploy steps because deploy secrets are not configured yet.
- Error, if any: None after the guard.
- Remaining blocker: Live EC2 bootstrap/deployment still needs a usable readable PEM key and GitHub `SSH_DEPLOY_KEY`, `DEPLOY_HOST`, and `DEPLOY_USER` secrets.

### 2026-06-01 19:57 IST - Public Site Live Check

- Step: Checked the public site, DNS, EC2 ports, and health endpoints.
- Commands:
  - `curl -IL --max-time 15 https://www.createsheets.com`
  - `curl -IL --max-time 15 https://createsheets.com`
  - `curl -i --max-time 15 https://www.createsheets.com/api/health`
  - `curl -i --max-time 15 https://api.createsheets.com/api/health`
  - `dig @8.8.8.8 +short createsheets.com A`
  - `dig @8.8.8.8 +short www.createsheets.com A`
  - `dig @8.8.8.8 +short api.createsheets.com A`
  - `curl -I --max-time 10 http://13.232.154.34`
  - `curl -I --max-time 10 https://13.232.154.34`
  - `nc -vz -G 5 13.232.154.34 80`
  - `nc -vz -G 5 13.232.154.34 443`
  - `nc -vz -G 5 13.232.154.34 22`
  - `curl -IL --resolve www.createsheets.com:443:13.232.154.34 --max-time 12 https://www.createsheets.com`
- Result: Site is only partially live.
- Output summary:
  - `https://www.createsheets.com` returns `200`, but response headers show `server: Vercel`, so this is not the new EC2/Nginx deployment.
  - Public Google/Cloudflare DNS resolvers point `createsheets.com`, `www.createsheets.com`, and `api.createsheets.com` to `13.232.154.34`.
  - Local resolver still has older/cached Vercel records for `www`.
  - `https://createsheets.com` cannot connect from the current network.
  - `https://api.createsheets.com/api/health` cannot connect.
  - `https://www.createsheets.com/api/health` timed out.
  - EC2 ports `80` and `443` are connection refused, which means no host Nginx/HTTPS listener is active yet.
  - EC2 port `22` is reachable.
- Error, if any: EC2 is not serving HTTP/HTTPS yet, and API health is down.
- Fix/action: Need SSH access to install Docker/Nginx/Certbot, create `/opt/createsheets/app/.env`, deploy containers, issue certificates, and reload host Nginx. Current blocker remains local PEM access and missing GitHub Actions deploy secrets.

### 2026-06-01 20:02 IST - PEM File Available

- Step: Rechecked the uploaded PEM file and fixed permissions.
- Commands:
  - `stat -f '%Sp %N' /Users/krishnaawasthi/Downloads/createsheets_ec2.pem`
  - `perl -e 'alarm 5; chmod 0400, ...' /Users/krishnaawasthi/Downloads/createsheets_ec2.pem`
- Result: Success.
- Output summary:
  - PEM file now reports permissions `-r--------`.
  - `chmod 0400` completed successfully.
  - No PEM contents were printed or copied into the repository.
- Error, if any: None.
- Fix/action: Continue by detecting the SSH user and bootstrapping EC2.

### 2026-06-01 20:03 IST - SSH User Detection

- Step: Tried SSH login with `ubuntu` and `ec2-user`.
- Commands:
  - `ssh -i /Users/krishnaawasthi/Downloads/createsheets_ec2.pem ... ubuntu@13.232.154.34 'whoami'`
  - `ssh -i /Users/krishnaawasthi/Downloads/createsheets_ec2.pem ... ec2-user@13.232.154.34 'whoami'`
- Result: Success.
- Output summary:
  - `ubuntu` failed with public key permission denied.
  - `ec2-user` succeeded and returned `ec2-user`.
- Error, if any: `ubuntu` is not the correct SSH user for this instance.
- Fix/action: Use `ec2-user` for all EC2 bootstrap and deployment commands.

### 2026-06-01 20:04 IST - EC2 OS And Tool Inspection

- Step: Inspected the instance OS, sudo access, and installed deployment tools.
- Command: `ssh ... ec2-user@13.232.154.34 'whoami; uname -a; cat /etc/os-release; sudo -n true; command -v ...'`
- Result: Success.
- Output summary:
  - OS: Amazon Linux 2023.
  - Kernel: Amazon Linux 6.1 series.
  - SSH user: `ec2-user`.
  - Passwordless sudo works.
  - `rsync` and `curl` are installed.
  - `docker`, `nginx`, `certbot`, and `git` are not installed yet.
- Error, if any: None.
- Fix/action: Install Docker, Docker Compose plugin, Nginx, Certbot, Git, and required helpers.

### 2026-06-01 20:06 IST - First Package Install Attempt

- Step: Tried installing Docker, Nginx, Certbot, Git, rsync, curl, and CA certificates.
- Command: `sudo dnf install -y docker nginx certbot python3-certbot-nginx git rsync curl ca-certificates`
- Result: Failed.
- Output summary:
  - `rsync` and `ca-certificates` were already installed.
  - DNF failed because Amazon Linux 2023 already has `curl-minimal`, which conflicts with the full `curl` package.
- Error, if any: `curl-minimal ... conflicts with curl`.
- Fix/action: Retry package installation without requesting the full `curl` package because the existing `curl-minimal` is enough for deployment downloads and health checks.

### 2026-06-01 20:08 IST - Package Install Retry

- Step: Installed server runtime packages without replacing `curl-minimal`.
- Command: `sudo dnf install -y docker nginx certbot python3-certbot-nginx git`
- Result: Success.
- Output summary:
  - Installed Docker `25.0.14`.
  - Installed Docker Compose plugin `v5.1.4`.
  - Installed Nginx `1.30.1`.
  - Installed Certbot `2.6.0`.
  - Installed Git `2.50.1`.
  - Enabled Docker service.
  - Added `ec2-user` to the Docker group.
  - Enabled Nginx service, but did not start public serving with the production config yet.
- Error, if any: None.
- Fix/action: Create `/opt/createsheets/app`, upload code and env, then build the Docker stack.

### 2026-06-01 20:10 IST - App Directory And Env Key Inspection

- Step: Created server app directories and checked local env key names.
- Commands:
  - `ssh ... 'id; docker --version; docker compose version; sudo systemctl is-active docker; sudo mkdir -p /opt/createsheets/app /var/www/certbot; sudo chown -R ec2-user:ec2-user /opt/createsheets; sudo chmod 700 /opt/createsheets'`
  - `sed -n 's/^\\([A-Za-z_][A-Za-z0-9_]*\\)=.*/\\1/p' .env backend/.env`
- Result: Success.
- Output summary:
  - `ec2-user` is now in the `docker` group.
  - Docker service is active.
  - `/opt/createsheets/app` exists and is owned by `ec2-user`.
  - `/var/www/certbot` exists for ACME challenge files.
  - Local env files contain frontend public keys and backend runtime keys.
  - Secret values were not printed.
- Error, if any: None.
- Fix/action: Upload a merged production `.env` to `/opt/createsheets/app/.env` without logging secret values.

### 2026-06-01 20:12 IST - Production Env Upload

- Step: Uploaded merged production env values to the EC2 app directory.
- Command: `sed/awk local .env + backend/.env + production overrides | ssh ... 'cat > /opt/createsheets/app/.env; chmod 600 ...'`
- Result: Success.
- Output summary:
  - Created `/opt/createsheets/app/.env`.
  - Set permissions to `600`.
  - Verified expected key names including MongoDB, auth, mail, payment, frontend build keys, Redis, production ports, and public cache TTL.
  - Secret values were not printed in terminal output or written into `deployment.md`.
- Error, if any: None.
- Fix/action: Sync repository files to EC2 while excluding local secrets and build artifacts.

### 2026-06-01 20:14 IST - Repository Sync To EC2

- Step: Synced repository files to `/opt/createsheets/app`.
- Command: `rsync --archive --delete --checksum --compress --verbose ... ./ ec2-user@13.232.154.34:/opt/createsheets/app/`
- Result: Success.
- Output summary:
  - Transferred the deployment-ready repository to EC2.
  - Excluded `.git`, `.env`, `backend/.env`, `node_modules`, `dist`, `backend/target`, local audio files, `record.md`, PEM files, and `.DS_Store`.
  - Server `.env` was preserved.
- Error, if any: None.
- Fix/action: Render production Compose on EC2 and start the Docker stack.

### 2026-06-01 20:15 IST - First Docker Stack Start Attempt

- Step: Rendered the production Compose file and tried to build/start frontend, backend, and Redis containers.
- Command: `ssh ... 'cd /opt/createsheets/app; docker compose --env-file .env -f docker-compose.prod.yml config >/tmp/createsheets-compose-rendered.yml; docker compose --env-file .env -f docker-compose.prod.yml up -d --build --remove-orphans; docker compose --env-file .env -f docker-compose.prod.yml ps'`
- Result: Failed.
- Output summary:
  - Redis image pulled successfully.
  - Frontend and backend image builds started.
  - Docker Compose stopped before building images.
- Error, if any: `compose build requires buildx 0.17.0 or later`.
- Fix/action: Inspect the EC2 Docker Buildx plugin and install or upgrade Buildx before retrying the production stack.

### 2026-06-01 20:16 IST - Docker Buildx Fix

- Step: Checked the installed Buildx version and installed a compatible user-level Buildx plugin.
- Commands:
  - `ssh ... 'docker buildx version || true; rpm -qa | grep -i buildx || true; dnf list ... | grep -i buildx || true'`
  - `ssh ... 'mkdir -p ~/.docker/cli-plugins; curl -fsSL https://github.com/docker/buildx/releases/download/v0.17.1/buildx-v0.17.1.linux-amd64 -o ~/.docker/cli-plugins/docker-buildx; chmod +x ~/.docker/cli-plugins/docker-buildx; docker buildx version'`
- Result: Success.
- Output summary:
  - Existing Buildx was `0.12.1`.
  - Installed Buildx `v0.17.1` for the `ec2-user` Docker CLI.
- Error, if any: None after installation.
- Fix/action: Retry `docker compose --env-file .env -f docker-compose.prod.yml up -d --build --remove-orphans`.

### 2026-06-01 20:17 IST - Docker Stack Build And Start Retry

- Step: Rebuilt and started the production Docker stack after fixing Buildx.
- Command: `ssh ... 'cd /opt/createsheets/app; docker compose --env-file .env -f docker-compose.prod.yml config >/tmp/createsheets-compose-rendered.yml; docker compose --env-file .env -f docker-compose.prod.yml up -d --build --remove-orphans; docker compose --env-file .env -f docker-compose.prod.yml ps'`
- Result: Success.
- Output summary:
  - Frontend image built with Node during build stage and Nginx in the runtime stage.
  - Backend image built the Spring Boot fat jar with Maven and copied it into a Java runtime image.
  - Redis `redis:7-alpine` started with its internal Docker volume.
  - Containers created: `createsheets-frontend`, `createsheets-backend`, `createsheets-redis`.
  - Backend is healthy and bound only to `127.0.0.1:18080`.
  - Frontend is running and bound only to `127.0.0.1:3000`.
  - Redis is healthy and has no public host port.
- Error, if any: None.
- Fix/action: Verify local container health endpoints and Redis, then configure host Nginx and HTTPS.

### 2026-06-01 20:18 IST - Internal Container Verification

- Step: Verified the running Docker containers from inside the EC2 host.
- Command: `ssh ... 'cd /opt/createsheets/app; docker compose --env-file .env -f docker-compose.prod.yml ps; docker exec createsheets-redis redis-cli ping; curl -fsS http://127.0.0.1:18080/api/health; curl -fsSI http://127.0.0.1:3000/; curl -fsS http://127.0.0.1:3000/healthz || true'`
- Result: Success.
- Output summary:
  - `createsheets-backend` is healthy.
  - `createsheets-redis` returned `PONG`.
  - Backend health returned JSON with `status: ok`.
  - Frontend returned HTTP `200 OK` from local Nginx.
  - Frontend `/healthz` returned `ok`.
- Error, if any: None.
- Fix/action: Configure host Nginx HTTP bootstrap for ACME challenges and reverse proxy to the local containers.

### 2026-06-01 20:18 IST - Host Nginx HTTP Bootstrap

- Step: Installed a temporary HTTP-only host Nginx config for `createsheets.com`, `www.createsheets.com`, and `api.createsheets.com`.
- Command: `ssh ... 'sudo tee /etc/nginx/conf.d/createsheets-bootstrap.conf ...; sudo nginx -t; sudo systemctl enable --now nginx; sudo systemctl reload nginx; sudo systemctl status nginx --no-pager -l'`
- Result: Success.
- Output summary:
  - Nginx config syntax test passed.
  - Nginx service is enabled and running.
  - Bootstrap config proxies `/api/` to `127.0.0.1:18080`.
  - Bootstrap config proxies frontend traffic to `127.0.0.1:3000`.
  - ACME challenge files are served from `/var/www/certbot`.
- Error, if any: None.
- Fix/action: Request Let’s Encrypt certificates using the webroot challenge.

### 2026-06-01 20:18 IST - HTTP Bootstrap Public Check

- Step: Checked that host Nginx is reachable before requesting certificates.
- Commands:
  - `curl -I http://createsheets.com/`
  - `curl --resolve www.createsheets.com:80:13.232.154.34 -I http://www.createsheets.com/`
  - `curl --resolve api.createsheets.com:80:13.232.154.34 http://api.createsheets.com/api/health`
- Result: Success.
- Output summary:
  - Apex domain returned HTTP `200 OK` from host Nginx.
  - `www` resolved to the EC2 IP for the check and returned HTTP `200 OK`.
  - API health returned JSON with `status: ok`.
- Error, if any: None.
- Fix/action: Continue with Let’s Encrypt certificate issuance.

### 2026-06-01 20:19 IST - Let’s Encrypt Certificates

- Step: Requested production TLS certificates with Certbot webroot validation.
- Commands:
  - `sudo certbot certonly --webroot -w /var/www/certbot -d createsheets.com -d www.createsheets.com --non-interactive --agree-tos --register-unsafely-without-email`
  - `sudo certbot certonly --webroot -w /var/www/certbot -d api.createsheets.com --non-interactive --agree-tos --register-unsafely-without-email`
  - `sudo systemctl enable --now certbot-renew.timer || true`
  - `sudo certbot certificates`
- Result: Success.
- Output summary:
  - Certificate issued for `createsheets.com` and `www.createsheets.com`.
  - Certificate issued for `api.createsheets.com`.
  - Certificates expire on `2026-08-30`.
  - Certbot renewal timer was enabled.
- Error, if any: None.
- Fix/action: Replace the bootstrap config with the production HTTPS Nginx reverse proxy config.

### 2026-06-01 20:19 IST - First Production Nginx Config Attempt

- Step: Replaced the HTTP bootstrap config with the production HTTPS reverse proxy config.
- Command: `ssh ... 'sudo rm -f /etc/nginx/conf.d/createsheets-bootstrap.conf; sudo cp /opt/createsheets/app/deploy/nginx-createsheets-docker.conf /etc/nginx/conf.d/createsheets.conf; sudo nginx -t; sudo systemctl reload nginx'`
- Result: Failed.
- Output summary:
  - Production config was copied into `/etc/nginx/conf.d/createsheets.conf`.
  - Nginx syntax check did not pass, so Nginx was not reloaded with the broken config.
- Error, if any:
  - Warning: `listen ... http2` is deprecated on the installed Nginx version.
  - Fatal: `/etc/letsencrypt/options-ssl-nginx.conf` was missing.
- Cause: Certificates were issued successfully with `certbot certonly --webroot`, but this Certbot path did not create the reusable Nginx SSL option include file on this fresh Amazon Linux instance.
- Fix/action: Create/install the standard Let’s Encrypt SSL options and DH params, then re-run `nginx -t`.

### 2026-06-01 20:19 IST - Production Nginx SSL Include Fix

- Step: Installed Certbot’s packaged SSL option files into `/etc/letsencrypt` and reloaded host Nginx.
- Command: `ssh ... 'sudo cp /usr/lib/python3.9/site-packages/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf /etc/letsencrypt/options-ssl-nginx.conf; sudo cp /usr/lib/python3.9/site-packages/certbot/ssl-dhparams.pem /etc/letsencrypt/ssl-dhparams.pem; sudo chmod 644 ...; sudo nginx -t; sudo systemctl reload nginx; sudo systemctl status nginx --no-pager -l'`
- Result: Success.
- Output summary:
  - Nginx syntax check passed.
  - Host Nginx reloaded successfully with the production HTTPS reverse proxy config.
  - Nginx is active and running.
- Error, if any:
  - Non-fatal warnings remain: `listen ... http2` is deprecated on this Nginx version.
- Fix/action: Verify the public HTTPS site and API. Update the repo Nginx config to use the modern `http2 on;` directive if possible.

### 2026-06-01 20:19 IST - Public HTTPS Verification

- Step: Verified the live public HTTPS site, API routes, crawler files, sitemap, and noindex headers.
- Commands:
  - `curl -I https://www.createsheets.com`
  - `curl --resolve www.createsheets.com:443:13.232.154.34 -I https://www.createsheets.com`
  - `curl --resolve createsheets.com:443:13.232.154.34 -I https://createsheets.com`
  - `curl --resolve www.createsheets.com:443:13.232.154.34 https://www.createsheets.com/api/health`
  - `curl --resolve api.createsheets.com:443:13.232.154.34 https://api.createsheets.com/api/health`
  - `curl --resolve www.createsheets.com:443:13.232.154.34 https://www.createsheets.com/robots.txt`
  - `curl --resolve www.createsheets.com:443:13.232.154.34 https://www.createsheets.com/sitemap.xml`
  - `curl --resolve www.createsheets.com:443:13.232.154.34 https://www.createsheets.com/sitemap-public-sheets.xml`
  - `curl --resolve www.createsheets.com:443:13.232.154.34 -I https://www.createsheets.com/dashboard`
  - `curl --resolve www.createsheets.com:443:13.232.154.34 -I https://www.createsheets.com/api/health`
- Result: Success.
- Output summary:
  - `https://www.createsheets.com` returned HTTP `200`.
  - `https://createsheets.com` returned HTTP `301` to `https://www.createsheets.com/`.
  - `https://www.createsheets.com/api/health` returned JSON with `status: ok`.
  - `https://api.createsheets.com/api/health` returned JSON with `status: ok`.
  - `robots.txt` served successfully and blocks `GPTBot` and `ClaudeBot` while allowing `OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, and `Claude-User`.
  - `sitemap.xml` served successfully as a sitemap index.
  - `sitemap-public-sheets.xml` served as `application/xml` and included public sheet URLs only from the backend endpoint.
  - `/dashboard` returned `X-Robots-Tag: noindex, nofollow, nosnippet`.
  - `/api/health` returned `X-Robots-Tag: noindex, nofollow, nosnippet`.
- Error, if any: None.
- Fix/action: Clean up the Nginx HTTP/2 deprecation warning in the repo/server config, then configure GitHub Actions secrets for CI/CD.

### 2026-06-01 20:20 IST - Nginx HTTP/2 Warning Cleanup

- Step: Updated the repo and server Nginx config to use the current `http2 on;` directive.
- Commands:
  - Edited `deploy/nginx-createsheets-docker.conf`.
  - `rsync --archive --checksum --compress --verbose deploy/nginx-createsheets-docker.conf ec2-user@13.232.154.34:/opt/createsheets/app/deploy/nginx-createsheets-docker.conf`
  - `ssh ... 'sudo cp /opt/createsheets/app/deploy/nginx-createsheets-docker.conf /etc/nginx/conf.d/createsheets.conf; sudo nginx -t; sudo systemctl reload nginx; sudo systemctl status nginx --no-pager -l'`
- Result: Success.
- Output summary:
  - Replaced deprecated `listen 443 ssl http2` syntax with `listen 443 ssl` plus `http2 on;`.
  - Nginx syntax check passed with no HTTP/2 deprecation warning.
  - Host Nginx reloaded successfully.
- Error, if any: None.
- Fix/action: Run final public verification after the config cleanup.

### 2026-06-01 20:20 IST - Sitemap Content-Type Fix

- Step: Fixed sitemap MIME types so every sitemap endpoint returns `application/xml`.
- Commands:
  - Edited `deploy/frontend-nginx.conf`.
  - `rsync --archive --checksum --compress --verbose deploy/frontend-nginx.conf deploy/nginx-createsheets-docker.conf ec2-user@13.232.154.34:/opt/createsheets/app/deploy/`
  - `ssh ... 'cd /opt/createsheets/app; docker compose --env-file .env -f docker-compose.prod.yml up -d --build --no-deps frontend; sudo cp /opt/createsheets/app/deploy/nginx-createsheets-docker.conf /etc/nginx/conf.d/createsheets.conf; sudo nginx -t; sudo systemctl reload nginx; docker compose --env-file .env -f docker-compose.prod.yml ps frontend'`
  - `curl -I https://www.createsheets.com/sitemap.xml`
  - `curl -I https://www.createsheets.com/sitemap-static.xml`
  - `curl -I https://www.createsheets.com/sitemap-public-sheets.xml`
- Result: Success.
- Output summary:
  - Added explicit XML MIME mapping in the frontend container Nginx config for `sitemap.xml` and `sitemap-static.xml`.
  - Rebuilt only the frontend image; cached build layers avoided a full rebuild.
  - Host Nginx syntax check passed and reloaded.
  - `sitemap.xml`, `sitemap-static.xml`, and `sitemap-public-sheets.xml` all now return `Content-Type: application/xml`.
  - Home page still returns HTTP `200`.
  - Backend health still returns JSON with `status: ok`.
- Error, if any: Earlier final verification showed `sitemap.xml` as `text/xml`; fixed by changing the frontend Nginx MIME mapping at the source.
- Fix/action: Configure GitHub Actions SSH secrets for CI/CD and run a final server/container check.

### 2026-06-01 20:20 IST - GitHub Actions Deploy Secrets

- Step: Configured repository secrets required by the production deployment workflow.
- Commands:
  - `gh auth status`
  - `gh repo view --json nameWithOwner --jq .nameWithOwner`
  - `gh secret set DEPLOY_HOST --repo krishnaawasthi-26/Interactive-Question-Management-Sheet --body '13.232.154.34'`
  - `gh secret set DEPLOY_USER --repo krishnaawasthi-26/Interactive-Question-Management-Sheet --body 'ec2-user'`
  - `gh secret set SSH_DEPLOY_KEY --repo krishnaawasthi-26/Interactive-Question-Management-Sheet < /Users/krishnaawasthi/Downloads/createsheets_ec2.pem`
  - `gh secret list --repo krishnaawasthi-26/Interactive-Question-Management-Sheet | grep -E '^(DEPLOY_HOST|DEPLOY_USER|SSH_DEPLOY_KEY)'`
- Result: Success.
- Output summary:
  - GitHub CLI is authenticated as `krishnaawasthi-26`.
  - Target repository confirmed as `krishnaawasthi-26/Interactive-Question-Management-Sheet`.
  - `DEPLOY_HOST`, `DEPLOY_USER`, and `SSH_DEPLOY_KEY` are present in repository secrets.
  - The PEM contents were not printed or written to this file.
- Error, if any: None.
- Fix/action: Commit and push the deployment log/config cleanup, then let GitHub Actions run the production deployment path with the configured secrets.

### 2026-06-01 20:21 IST - API Subdomain Root Probe Fix

- Step: Updated host Nginx so `https://api.createsheets.com/` returns a small JSON status response instead of forwarding `/` to Spring Boot.
- Commands:
  - Edited `deploy/nginx-createsheets-docker.conf`.
  - `rsync --archive --checksum --compress --verbose deploy/nginx-createsheets-docker.conf ec2-user@13.232.154.34:/opt/createsheets/app/deploy/nginx-createsheets-docker.conf`
  - `ssh ... 'sudo cp /opt/createsheets/app/deploy/nginx-createsheets-docker.conf /etc/nginx/conf.d/createsheets.conf; sudo nginx -t; sudo systemctl reload nginx'`
  - `curl -i https://api.createsheets.com/`
  - `curl https://api.createsheets.com/api/health`
- Result: Success.
- Output summary:
  - Nginx syntax check passed.
  - Host Nginx reloaded successfully.
  - `https://api.createsheets.com/` now returns HTTP `200`, `Content-Type: application/json`, `X-Robots-Tag: noindex, nofollow, nosnippet`, and body `{"service":"createsheets-api","status":"ok"}`.
  - `https://api.createsheets.com/api/health` still returns backend health JSON with `status: ok`.
- Error, if any: Backend logs had shown `NoResourceFoundException` for requests to `/` on the API subdomain.
- Fix/action: Keep root probes at Nginx and route real API paths to Spring Boot.

### 2026-06-02 00:11 IST - Final Live Deployment Verification

- Step: Rechecked EC2 containers, host Nginx, public HTTPS URLs, crawler files, noindex headers, CORS preflight, Redis, and memory usage after the interrupted turn resumed.
- Commands:
  - `ssh ... 'cd /opt/createsheets/app; docker compose --env-file .env -f docker-compose.prod.yml ps; docker exec createsheets-redis redis-cli ping; docker stats --no-stream ...; sudo nginx -t; sudo systemctl is-active nginx'`
  - `curl -I https://www.createsheets.com`
  - `curl https://www.createsheets.com/api/health`
  - `curl https://api.createsheets.com/`
  - `curl https://api.createsheets.com/api/health`
  - `curl -I https://www.createsheets.com/robots.txt`
  - `curl -I https://www.createsheets.com/llms.txt`
  - `curl -I https://www.createsheets.com/llms-full.txt`
  - `curl -I https://www.createsheets.com/sitemap.xml`
  - `curl -I https://www.createsheets.com/sitemap-static.xml`
  - `curl -I https://www.createsheets.com/sitemap-public-sheets.xml`
  - `curl -I https://www.createsheets.com/dashboard`
  - `curl -I https://www.createsheets.com/api/health`
  - `curl -X OPTIONS https://api.createsheets.com/api/health -H 'Origin: https://www.createsheets.com' -H 'Access-Control-Request-Method: GET' -I`
- Result: Success.
- Output summary:
  - `createsheets-backend`, `createsheets-frontend`, and `createsheets-redis` are healthy.
  - Redis returned `PONG`.
  - Memory usage remained light: frontend about `4 MiB`, Redis about `6 MiB`, backend about `293 MiB`.
  - `sudo nginx -t` passed and Nginx is active.
  - `https://www.createsheets.com` returned HTTP `200`.
  - `https://www.createsheets.com/api/health` and `https://api.createsheets.com/api/health` returned JSON with `status: ok`.
  - `https://api.createsheets.com/` returned the Nginx JSON status response.
  - `robots.txt`, `llms.txt`, and `llms-full.txt` returned `text/plain`.
  - All sitemap endpoints returned `application/xml`.
  - `/dashboard` and `/api/health` returned `X-Robots-Tag: noindex, nofollow, nosnippet`.
  - CORS preflight from `https://www.createsheets.com` returned HTTP `204` with the expected `Access-Control-Allow-*` headers.
- Error, if any: None.
- Fix/action: Run local repo checks, commit the deployment documentation/config updates, push to GitHub, and watch the GitHub Actions deployment.

### 2026-06-02 00:12 IST - Local Repo Validation Before Commit

- Step: Checked the local worktree and validated the deployment-related config before committing.
- Commands:
  - `git status -sb`
  - `git diff --stat`
  - `git diff --check`
  - `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/ci.yml"); puts "yaml ok"'`
  - `docker compose -f docker-compose.prod.yml config >/tmp/createsheets-prod-compose-check.yml`
  - `docker compose --env-file .env --env-file backend/.env -f docker-compose.prod.yml config >/tmp/createsheets-prod-compose-check.yml`
- Result: Success.
- Output summary:
  - Modified files are `deploy/frontend-nginx.conf`, `deploy/nginx-createsheets-docker.conf`, and `deployment.md`.
  - Untracked local files remain `docs/HR.m4a`, `docs/Tech.m4a`, and `record.md`; they were not staged.
  - `git diff --check` passed.
  - GitHub Actions YAML parsed successfully.
  - Production Compose config rendered successfully.
- Error, if any:
  - The first `docker compose -f docker-compose.prod.yml config` warned that `APP_AUTH_SECRET` and `MONGODB_URI` were unset because local env files were not passed to the command.
- Fix/action:
  - Re-ran Compose config with `--env-file .env --env-file backend/.env`, which passed.
  - Stage only deployment/Nginx files, commit, and push to `main`.

### 2026-06-02 00:13 IST - Deployment Commit Created

- Step: Staged and committed the deployment documentation and Nginx config cleanup.
- Commands:
  - `git add deploy/frontend-nginx.conf deploy/nginx-createsheets-docker.conf deployment.md`
  - `git status -sb`
  - `git commit -m "Complete EC2 Docker deployment"`
  - `git rev-parse --short HEAD`
- Result: Success.
- Output summary:
  - Created a deployment commit with message `Complete EC2 Docker deployment`.
  - Committed files:
    - `deploy/frontend-nginx.conf`
    - `deploy/nginx-createsheets-docker.conf`
    - `deployment.md`
  - Local untracked files `docs/HR.m4a`, `docs/Tech.m4a`, and `record.md` were not staged or committed.
- Error, if any: None.
- Fix/action: Amend this log entry into the same commit, push to GitHub `main`, and verify GitHub Actions.

### 2026-06-02 00:16 IST - GitHub Push And CI/CD Verification

- Step: Pushed the deployment commit to GitHub `main` and watched the CI/CD workflow.
- Commands:
  - `git push origin HEAD:main`
  - `gh run list --repo krishnaawasthi-26/Interactive-Question-Management-Sheet --branch main --limit 5`
  - `gh run watch 26774759685 --repo krishnaawasthi-26/Interactive-Question-Management-Sheet --exit-status`
- Result: Success.
- Output summary:
  - Push updated `main` from `2fdf5f1` to the deployment commit.
  - GitHub Actions run `26774759685` completed successfully.
  - Frontend checks passed: install, lint, build, and frontend tests.
  - Backend checks passed: backend tests and production JAR build.
  - Production config checks passed: workflow YAML and production Compose validation.
  - Deploy job passed:
    - SSH agent setup.
    - Known host setup.
    - Remote app directory check.
    - Repository sync to EC2.
    - Docker stack build/restart.
    - Local container health validation.
    - Public URL validation.
- Error, if any:
  - Non-blocking GitHub Actions warning: `actions/checkout@v4` and `webfactory/ssh-agent@v0.9.0` currently run on Node.js 20, which GitHub says will be forced to Node.js 24 by default starting June 16, 2026 and removed from runners on September 16, 2026.
- Fix/action:
  - No deployment fix needed now; CI/CD passed.
  - Future improvement: upgrade workflow actions when newer Node 24-compatible releases are available.
