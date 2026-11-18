# Codex Prompt: Implement Backend CI/CD for CreateSheets systemd JAR Deployment

Use this prompt when implementing or revisiting backend CI/CD for CreateSheets.

## Context

You are working in the CreateSheets repository.

- Backend: Spring Boot 3.4, Java 17, Maven.
- Backend path: `backend/`.
- Backend artifact: `backend/target/iqms-backend-0.0.1-SNAPSHOT.jar`.
- Runtime port: `8080`.
- Production service manager: systemd.
- Production service name: `iqms-backend`.
- Production backend directory: `/opt/iqms-backend`.
- Production JAR path: `/opt/iqms-backend/iqms-backend.jar`.
- Runtime env file: `/opt/iqms-backend/.env`.
- Health endpoint: `http://localhost:8080/api/health`.
- Public verification URL: `https://www.createsheets.com/api/health`.

## Goal

Implement backend CI/CD so pushes to `main`:

1. Run backend tests.
2. Build the Spring Boot fat JAR.
3. SSH to the production server.
4. Back up the current JAR.
5. Upload the new JAR.
6. Restart `iqms-backend`.
7. Poll `/api/health`.
8. Print systemd status and journal logs if startup fails.

Pull requests must never deploy.

## Required Changes

Add or update:

- `.github/workflows/ci.yml`
- `deploy/deploy-backend.sh`
- `deploy/iqms-backend.service`
- `deploy/BACKEND_SECRETS.md`
- `CI_CD_BACKEND.md`
- `dockerize.md`

Do not put backend runtime secrets in GitHub Actions.

## Workflow Requirements

Add a `deploy-backend` job:

- `needs: backend`
- `if: github.ref == 'refs/heads/main' && github.event_name == 'push'`
- `concurrency.group: production-backend`
- Java 17 using `actions/setup-java@v4`
- Build command: `mvn -f backend/pom.xml clean package -DskipTests`
- Verify `backend/target/iqms-backend-0.0.1-SNAPSHOT.jar`
- SSH with `webfactory/ssh-agent@v0.9.0`
- Add host key with `ssh-keyscan`
- Verify `/opt/iqms-backend` exists
- Back up current JAR to `iqms-backend.jar.backup.<timestamp>`
- Upload with `rsync --archive --checksum --compress --verbose`
- Restart with `sudo systemctl restart iqms-backend`
- Poll `http://localhost:8080/api/health` for up to 90 seconds
- On failure, print:
  - `sudo systemctl status iqms-backend --no-pager -l`
  - `sudo journalctl -u iqms-backend -n 80 --no-pager`

## Manual Deploy Script Requirements

Create `deploy/deploy-backend.sh`:

- Bash with `set -euo pipefail`
- Requires `DEPLOY_HOST`
- Defaults:
  - `DEPLOY_USER=deploy`
  - `REMOTE_DIR=/opt/iqms-backend`
  - `SERVICE_NAME=iqms-backend`
  - `HEALTH_URL=http://localhost:8080/api/health`
  - `MAX_ATTEMPTS=18`
- Validates the local JAR exists
- Verifies remote directory exists
- Backs up existing JAR
- Uploads with rsync
- Restarts systemd
- Polls health
- Prints logs/status on failure

## systemd Requirements

Create `deploy/iqms-backend.service`:

- `User=deploy`
- `Group=deploy`
- `WorkingDirectory=/opt/iqms-backend`
- `ExecStart=/usr/bin/java -Xms256m -Xmx512m -Dspring.profiles.active=prod -jar /opt/iqms-backend/iqms-backend.jar`
- `Restart=on-failure`
- `TimeoutStopSec=30`
- journald logging

## Documentation Requirements

`deploy/BACKEND_SECRETS.md` must explain:

- GitHub only needs SSH deploy secrets.
- Backend runtime secrets live only in `/opt/iqms-backend/.env`.
- Required env keys from `backend/.env.example` and `application.properties`.
- Server directory permissions.
- `.env` permissions.
- SSH key setup.
- sudoers setup.
- first deploy checklist.
- rollback.
- common errors and fixes.

`CI_CD_BACKEND.md` must record:

- commands run
- directory
- reason
- output summary
- error
- fix
- files changed
- tests passed/failed
- interview explanation

## Validation

Run:

```bash
ruby -e 'require "yaml"; YAML.load_file(".github/workflows/ci.yml"); puts "yaml ok"'
bash -n deploy/deploy-backend.sh
git diff --check
JAVA_HOME=$(/usr/libexec/java_home -v 21) mvn test
mvn -f backend/pom.xml clean package -DskipTests
test -f backend/target/iqms-backend-0.0.1-SNAPSHOT.jar
```

Use Java 17 if available locally; Java 21 is acceptable for local verification here because Java 25 is known to fail with this Mockito/Byte Buddy version.
