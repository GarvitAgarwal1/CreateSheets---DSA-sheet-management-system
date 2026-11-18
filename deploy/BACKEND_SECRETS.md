# Backend CI/CD Secrets and Server Setup

This file documents the GitHub Actions secrets and server-side configuration required for CreateSheets backend deployments.

Do not commit real private keys, passwords, database URLs, API secrets, JWT secrets, or production `.env` values. Use `<REDACTED>` in examples.

## Deployment Model

- GitHub Actions builds `backend/target/iqms-backend-0.0.1-SNAPSHOT.jar`.
- The JAR is uploaded to `/opt/iqms-backend/iqms-backend.jar`.
- The server runs the backend through systemd service `iqms-backend`.
- Backend runtime secrets live only in `/opt/iqms-backend/.env`.
- GitHub Actions only receives SSH deployment secrets, not backend app secrets.

## Required GitHub Actions Secrets

Configure these in:

`GitHub -> Repository -> Settings -> Secrets and variables -> Actions -> New repository secret`

| Secret | Description | Example shape |
| --- | --- | --- |
| `SSH_DEPLOY_KEY` | Private SSH key used by GitHub Actions to connect to the server | `<PRIVATE_SSH_KEY_CONTENT>` |
| `DEPLOY_HOST` | Production server IP address or hostname | `<REDACTED_SERVER_IP>` |
| `DEPLOY_USER` | Linux user used for deployment | `deploy` or `ubuntu` |

These can be the same SSH secrets used by the frontend deploy job.

## One-Time Server Setup

Replace `deploy` with `ubuntu` if that is the real server user.

```bash
sudo useradd --system --create-home --shell /bin/bash deploy
sudo mkdir -p /opt/iqms-backend
sudo chown -R deploy:deploy /opt/iqms-backend
sudo chmod 700 /opt/iqms-backend
```

Install the systemd unit:

```bash
sudo cp deploy/iqms-backend.service /etc/systemd/system/iqms-backend.service
sudo systemctl daemon-reload
sudo systemctl enable iqms-backend
```

If the service should run as `ubuntu`, edit the installed unit and set:

```ini
User=ubuntu
Group=ubuntu
```

## Backend `.env` on the Server

Create this file manually on the server:

```bash
sudo -u deploy nano /opt/iqms-backend/.env
chmod 600 /opt/iqms-backend/.env
```

Required or commonly used keys:

| Key | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB connection string |
| `APP_AUTH_SECRET` | Yes | Token signing secret; use a long random value |
| `APP_AUTH_EXPIRATION_SECONDS` | No | Token lifetime, defaults to `604800` |
| `APP_AUTH_GOOGLE_CLIENT_ID` | If Google login is enabled | Primary Google OAuth web client ID |
| `APP_AUTH_GOOGLE_CLIENT_IDS` | No | Comma-separated allowed Google OAuth client IDs |
| `APP_AUTH_OTP_BYPASS_KEY` | No | Testing bypass key; leave empty in production |
| `ADMIN_USERNAME` | No | Admin username for featured catalog ownership, defaults to `CreateSheets` |
| `APP_CORS_ALLOWED_ORIGINS` | Recommended | Allowed frontend origins |
| `APP_CORS_ALLOWED_ORIGIN_PATTERNS` | No | Allowed frontend origin patterns |
| `MONGO_STARTUP_PING_ENABLED` | Recommended | Verifies MongoDB during startup |
| `REDIS_HOST` | If Redis cache is used | Redis host |
| `REDIS_PORT` | If Redis cache is used | Redis port |
| `REDIS_PASSWORD` | If Redis needs auth | Redis password |
| `APP_MAIL_ENABLED` | No | Enables SMTP-backed mail |
| `APP_MAIL_HOST` | If mail enabled | SMTP host |
| `APP_MAIL_PORT` | If mail enabled | SMTP port |
| `APP_MAIL_USERNAME` | If mail enabled | SMTP username |
| `APP_MAIL_PASSWORD` | If mail enabled | SMTP password |
| `APP_MAIL_FROM` | No | From email address |
| `APP_MAIL_FROM_NAME` | No | From display name |
| `APP_MAIL_AUTH` | If mail enabled | SMTP auth flag |
| `APP_MAIL_STARTTLS` | If mail enabled | SMTP STARTTLS flag |
| `APP_FEEDBACK_TO` | No | Feedback recipient email |
| `APP_PAYMENT_RAZORPAY_ENABLED` | No | Enables Razorpay integration |
| `RAZORPAY_KEY_ID` | If payments enabled | Razorpay public key ID |
| `RAZORPAY_KEY_SECRET` | If payments enabled | Razorpay secret; server only |
| `APP_QUEUE_PROCESSING_DELAY_MS` | No | Queue processing delay |
| `APP_REVISION_INTERVALS_HOURS` | No | Revision reminder intervals |
| `APP_CACHE_SWR_STALE_TTL_SECONDS` | No | SWR cache stale TTL |
| `APP_CACHE_SWR_HARD_TTL_SECONDS` | No | SWR cache hard TTL |
| `APP_CACHE_SWR_LOCK_TTL_SECONDS` | No | SWR cache lock TTL |
| `APP_EXTERNAL_RESOURCE_URL_TEMPLATE` | No | External resource API template |
| `APP_EXTERNAL_AUTH_TOKEN` | No | External API auth token |

Example shape:

```dotenv
MONGODB_URI=mongodb+srv://<REDACTED>
APP_AUTH_SECRET=<REDACTED_LONG_RANDOM_SECRET>
APP_AUTH_GOOGLE_CLIENT_ID=<REDACTED>.apps.googleusercontent.com
APP_AUTH_GOOGLE_CLIENT_IDS=
APP_AUTH_OTP_BYPASS_KEY=
ADMIN_USERNAME=CreateSheets
APP_CORS_ALLOWED_ORIGINS=https://www.createsheets.com,https://createsheets.com
APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://*.vercel.app
MONGO_STARTUP_PING_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
APP_MAIL_ENABLED=false
APP_PAYMENT_RAZORPAY_ENABLED=false
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

## SSH Key Setup

Generate a deploy key locally:

```bash
ssh-keygen -t ed25519 -C "github-actions-backend-deploy@createsheets" -f ~/.ssh/createsheets_backend_deploy
```

Install the public key on the server:

```bash
ssh-copy-id -i ~/.ssh/createsheets_backend_deploy.pub deploy@YOUR_SERVER_HOST
```

Paste the full private key into GitHub secret `SSH_DEPLOY_KEY`.

## Passwordless systemd Commands

GitHub Actions needs to restart the backend and read status/logs during health-check failure.

Edit sudoers safely:

```bash
sudo visudo
```

Add one line, replacing `deploy` if needed:

```text
deploy ALL=(ALL) NOPASSWD: /bin/systemctl restart iqms-backend, /usr/bin/systemctl restart iqms-backend, /bin/systemctl status iqms-backend --no-pager -l, /usr/bin/systemctl status iqms-backend --no-pager -l, /bin/journalctl -u iqms-backend -n 80 --no-pager, /usr/bin/journalctl -u iqms-backend -n 80 --no-pager
```

Test:

```bash
sudo systemctl status iqms-backend --no-pager -l
sudo systemctl restart iqms-backend
sudo journalctl -u iqms-backend -n 80 --no-pager
```

## First Deploy Checklist

```bash
ss -tlnp | grep 8080
ls -la /opt/iqms-backend
sudo systemctl daemon-reload
sudo systemctl enable iqms-backend
```

After GitHub Actions deploys the JAR:

```bash
sudo systemctl status iqms-backend --no-pager -l
curl http://localhost:8080/api/health
curl https://www.createsheets.com/api/health
```

## Rollback

List backups:

```bash
ls -t /opt/iqms-backend/iqms-backend.jar.backup.*
```

Restore one backup:

```bash
cp /opt/iqms-backend/iqms-backend.jar.backup.TIMESTAMP /opt/iqms-backend/iqms-backend.jar
sudo systemctl restart iqms-backend
curl http://localhost:8080/api/health
```

## Common Errors and Fixes

### `rsync: Permission denied`

Cause: deploy user cannot write to `/opt/iqms-backend`.

Fix:

```bash
sudo chown -R deploy:deploy /opt/iqms-backend
sudo chmod 700 /opt/iqms-backend
```

### `sudo: a password is required`

Cause: sudoers does not allow the required systemd/journalctl commands.

Fix: add the narrow sudoers rule above with `sudo visudo`.

### Backend health check times out

Cause: the JVM failed to start, MongoDB is unreachable, `APP_AUTH_SECRET` is missing, or port 8080 is occupied.

Fix:

```bash
sudo systemctl status iqms-backend --no-pager -l
sudo journalctl -u iqms-backend -n 120 --no-pager
ss -tlnp | grep 8080
```

### `.env` is not being read

Cause: systemd `WorkingDirectory` does not point to `/opt/iqms-backend`, or the `.env` file has wrong permissions/owner.

Fix:

```bash
sudo systemctl cat iqms-backend
ls -la /opt/iqms-backend/.env
chmod 600 /opt/iqms-backend/.env
```
