# Backend CI/CD Implementation Notes

This file tracks the backend CI/CD implementation for deploying the CreateSheets Spring Boot backend as a systemd-managed JAR.

## Status

Current status: backend CI/CD implementation added on June 1, 2026. Production deployment still requires GitHub Actions secrets and one-time server setup before a push to `main` can deploy successfully.

Update for full-Docker EC2 deployment:

- The earlier systemd/JAR `deploy-backend` job has been replaced by a unified `deploy-production` job.
- Backend is now deployed as a Docker container built from `backend/Dockerfile`.
- Production backend binds to `127.0.0.1:18080` and host Nginx proxies `/api/` and `api.createsheets.com` to it.
- MongoDB runs in Atlas and is provided through `MONGODB_URI` in the server `.env`.
- Redis runs as an internal Docker service and is used for public/read cache data.
- The systemd/JAR files remain as historical/manual references but are not the active production deploy path.

Implemented in this pass:

- Replaced the earlier `deploy-backend` job with a unified full-Docker `deploy-production` job in `.github/workflows/ci.yml`.
- Added `deploy/deploy-backend.sh` for manual backend deployments.
- Added `deploy/iqms-backend.service` as a systemd unit template.
- Added `deploy/BACKEND_SECRETS.md` for GitHub SSH secrets, server `.env`, permissions, sudoers, and rollback.
- Added `CODEX_BACKEND_CICD_PROMPT.md` as a reusable implementation prompt.
- Updated `dockerize.md` to clarify that backend CI/CD is systemd/JAR based and does not replace Docker.
- Added `docker-compose.prod.yml`, `deploy/nginx-createsheets-docker.conf`, and public Redis cache invalidation for the Docker production path.

## Detected Backend Context

| Item | Value |
| --- | --- |
| Backend framework | Spring Boot 3.4 |
| Build tool | Maven |
| Java version in CI | 17 |
| Backend directory | `backend/` |
| Maven test command | `mvn test` from `backend/` |
| Deploy build command | `mvn -f backend/pom.xml clean package -DskipTests` |
| JAR output | `backend/target/iqms-backend-0.0.1-SNAPSHOT.jar` |
| Runtime port | `8080` |
| Health endpoint | `/api/health` |
| systemd service | `iqms-backend` |
| Server app directory | `/opt/iqms-backend` |
| Server JAR path | `/opt/iqms-backend/iqms-backend.jar` |
| Server env path | `/opt/iqms-backend/.env` |

## Uploaded Files Read

The uploaded zip at `/Users/krishnaawasthi/Downloads/files (1).zip` contained:

| File | Purpose |
| --- | --- |
| `CODEX_BACKEND_CICD_PROMPT.md` | Backend CI/CD implementation prompt |
| `CI_CD_BACKEND.md` | Backend CI/CD documentation guide |

Those files were read and used as the basis for this repo-local implementation.

## Files Changed

| File | Action | Why |
| --- | --- | --- |
| `.github/workflows/ci.yml` | Modified | Added `deploy-backend` job |
| `deploy/deploy-backend.sh` | Created | Manual backend JAR deploy helper |
| `deploy/iqms-backend.service` | Created | systemd service template for production |
| `deploy/BACKEND_SECRETS.md` | Created | Backend deployment secrets and server setup documentation |
| `CODEX_BACKEND_CICD_PROMPT.md` | Created | Reusable Codex implementation prompt |
| `CI_CD_BACKEND.md` | Created | Backend CI/CD implementation log |
| `dockerize.md` | Modified | Notes that backend CI/CD uses systemd/JAR and does not replace Docker |

## Workflow Behavior

The `backend` job still runs tests from `backend/` using Java 17.

The new `deploy-backend` job:

- Runs only on push to `main`.
- Does not run on pull requests.
- Waits only for the `backend` job.
- Builds the production JAR from repo root with `mvn -f backend/pom.xml clean package -DskipTests`.
- Verifies the JAR exists.
- Uses `SSH_DEPLOY_KEY`, `DEPLOY_HOST`, and `DEPLOY_USER`.
- Verifies `/opt/iqms-backend` exists on the server.
- Backs up the current JAR.
- Uploads the new JAR with rsync.
- Restarts `iqms-backend`.
- Polls `http://localhost:8080/api/health` for up to 90 seconds.
- Prints service status and recent logs if health check fails.

Backend deployment intentionally does not wait for frontend checks because existing frontend lint errors would block backend deployment even when backend code is valid.

## Server Setup Summary

Run once on the production server, replacing `deploy` if the real user is different:

```bash
sudo useradd --system --create-home --shell /bin/bash deploy
sudo mkdir -p /opt/iqms-backend
sudo chown -R deploy:deploy /opt/iqms-backend
sudo chmod 700 /opt/iqms-backend
sudo cp deploy/iqms-backend.service /etc/systemd/system/iqms-backend.service
sudo systemctl daemon-reload
sudo systemctl enable iqms-backend
```

Create `/opt/iqms-backend/.env` manually on the server and secure it:

```bash
chmod 600 /opt/iqms-backend/.env
```

GitHub Actions should never receive `MONGODB_URI`, `APP_AUTH_SECRET`, Razorpay secrets, SMTP passwords, or other backend runtime secrets.

## Command Log

| Command | Directory | Why it was run | Output summary | Error | Fix |
| --- | --- | --- | --- | --- | --- |
| `unzip -l '/Users/krishnaawasthi/Downloads/files (1).zip'` | Repo root | List uploaded backend CI/CD files | Zip contained backend prompt and backend doc | None | None |
| `unzip -p '/Users/krishnaawasthi/Downloads/files (1).zip' CODEX_BACKEND_CICD_PROMPT.md` | Repo root | Read uploaded prompt | Confirmed requested systemd JAR deployment plan | None | None |
| `unzip -p '/Users/krishnaawasthi/Downloads/files (1).zip' CI_CD_BACKEND.md` | Repo root | Read uploaded backend CI/CD guide | Confirmed docs, server setup, systemd, rollback expectations | None | None |
| `git status -sb` | Repo root | Check current worktree before implementation | Existing frontend CI/CD changes and unrelated local files were present | None | None |
| `sed -n '1,260p' .github/workflows/ci.yml` | Repo root | Inspect current workflow | Found frontend/backend checks and frontend deploy job | None | None |
| `sed -n '1,220p' backend/src/main/java/com/iqms/backend/controller/HealthController.java` | Repo root | Confirm readiness endpoint | Found `GET /api/health` | None | None |
| `sed -n '1,260p' backend/src/main/resources/application.properties` | Repo root | Identify backend runtime env keys | Found MongoDB, auth, CORS, mail, payment, Redis, cache, external API config | None | None |
| `sed -n '1,220p' backend/.env.example` | Repo root | Identify documented backend env keys | Found backend placeholder env file | None | None |
| `chmod +x deploy/deploy-backend.sh` | Repo root | Make manual deploy script executable | Script mode became executable | None | None |
| `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/ci.yml"); puts "yaml ok"'` | Repo root | Validate GitHub Actions YAML syntax | Printed `yaml ok` | None | None |
| `bash -n deploy/deploy-backend.sh` | Repo root | Validate manual deploy script syntax | Passed with no output | None | None |
| `git diff --check` | Repo root | Check patch whitespace and formatting | Passed with no output | None | None |
| `JAVA_HOME=$(/usr/libexec/java_home -v 21) mvn test` | `backend/` | Run backend tests with a supported local JDK | Passed: 32 tests, 0 failures, 0 errors | None | None |
| `mvn -f backend/pom.xml clean package -DskipTests` | Repo root | Build production Spring Boot JAR | Passed and created repackaged Spring Boot JAR | None | None |
| `test -f backend/target/iqms-backend-0.0.1-SNAPSHOT.jar && du -sh backend/target/iqms-backend-0.0.1-SNAPSHOT.jar` | Repo root | Verify deploy artifact exists | JAR exists, size `44M` | None | None |
| `docker compose config` | Repo root | Confirm Docker Compose still parses after docs/workflow changes | Compose config rendered successfully | None | None |

## Validation Results

| Check | Result |
| --- | --- |
| Workflow YAML parse | Passed |
| `deploy/deploy-backend.sh` Bash syntax | Passed |
| `git diff --check` | Passed |
| Docker Compose config parse | Passed |
| Backend tests with Java 21 | Passed, 32 tests |
| Backend package build | Passed |
| JAR existence check | Passed, `44M` |

## Errors Faced and Fixes

No new backend CI/CD implementation errors occurred.

Known local environment issue:

- Maven default Java may be Java 25 on this machine.
- This project's Mockito/Byte Buddy version does not support Java 25.
- Use Java 21 locally or Java 17 in CI.

## Production Verification Commands

After GitHub secrets and server setup are complete, verify:

```bash
curl -I https://www.createsheets.com/api/health
curl https://www.createsheets.com/api/health
ssh "$DEPLOY_USER@$DEPLOY_HOST" "systemctl status iqms-backend --no-pager -l"
ssh "$DEPLOY_USER@$DEPLOY_HOST" "journalctl -u iqms-backend -n 80 --no-pager"
```

Expected:

- Public health URL returns `200`.
- Response contains `"status":"ok"`.
- `iqms-backend` is active/running.
- No startup errors in recent logs.

## Interview Explanation

Use this explanation:

```text
The CreateSheets backend CI/CD pipeline uses GitHub Actions for CI and a systemd-managed JAR deployment for CD. On pull requests and pushes, the backend job runs Maven tests with Java 17. On push to main only, a deploy-backend job builds the Spring Boot fat JAR using Maven, uploads it to /opt/iqms-backend/iqms-backend.jar with rsync, restarts the iqms-backend systemd service, and polls /api/health until the app is ready.

Backend secrets are not stored in GitHub Actions. GitHub only has SSH deploy credentials. Runtime secrets like MONGODB_URI, APP_AUTH_SECRET, SMTP passwords, and Razorpay secrets live in /opt/iqms-backend/.env on the server with chmod 600. The Spring Boot app reads that file from the systemd working directory at startup.

The deploy creates a timestamped backup of the previous JAR before replacing it, so rollback is fast: copy the backup back to iqms-backend.jar and restart the service. This setup has a brief JVM restart window. For zero-downtime backend deploys, the next step would be blue-green or rolling deployment behind a load balancer.
```
