# GitHub Actions Secrets for Frontend CI/CD

This file documents the secrets and one-time server setup required for deploying the CreateSheets frontend to Nginx from GitHub Actions.

Do not commit real private keys, passwords, API secrets, JWT secrets, database URLs, or private environment values. Use GitHub Actions secrets for sensitive values.

## Required GitHub Actions Secrets

Configure these in:

`GitHub -> Repository -> Settings -> Secrets and variables -> Actions -> New repository secret`

| Secret | Description | Example shape |
| --- | --- | --- |
| `SSH_DEPLOY_KEY` | Private SSH key used by GitHub Actions to connect to the server | `<PRIVATE_SSH_KEY_CONTENT>` |
| `DEPLOY_HOST` | Production server IP address or hostname | `<REDACTED_SERVER_IP>` |
| `DEPLOY_USER` | Linux user used for deployment | `deploy` or `ubuntu` |
| `VITE_GOOGLE_CLIENT_ID` | Public Google OAuth client ID baked into the Vite frontend bundle | `<REDACTED>.apps.googleusercontent.com` |
| `VITE_RAZORPAY_KEY_ID` | Public Razorpay key ID baked into the Vite frontend bundle | `rzp_live_<REDACTED>` |

The following production values are intentionally hardcoded in the workflow because they are public and project-specific:

| Variable | Value |
| --- | --- |
| `VITE_API_BASE_URL` | Empty string, so the app can use the deployed API resolution logic |
| `VITE_APP_API_BASE_URL` | Empty string, same reason as above |
| `VITE_GOOGLE_AUTH_ALLOWED_ORIGINS` | `https://www.createsheets.com` |
| `VITE_APP_NAME` | `Create Sheets` |
| `VITE_ADMIN_USERNAME` | `CreateSheets` |
| `VITE_SITE_URL` | `https://www.createsheets.com` |

## Generate an SSH Deploy Key

Run this on your local machine:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy@createsheets" -f ~/.ssh/createsheets_frontend_deploy
```

This creates:

```text
~/.ssh/createsheets_frontend_deploy      private key, paste into SSH_DEPLOY_KEY
~/.ssh/createsheets_frontend_deploy.pub  public key, add to server authorized_keys
```

## Add the Public Key to the Server

Replace `deploy` and `YOUR_SERVER_HOST` with the real user and host.

```bash
ssh-copy-id -i ~/.ssh/createsheets_frontend_deploy.pub deploy@YOUR_SERVER_HOST
```

Or manually on the server:

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
cat createsheets_frontend_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## Add the Private Key to GitHub

Copy the full private key into GitHub Actions only. Do not paste it into repo files.

```text
<PRIVATE_SSH_KEY_CONTENT>
```

Paste it into the GitHub Actions secret named `SSH_DEPLOY_KEY`.

## One-Time Server Directory Setup

Run on the production server:

```bash
sudo mkdir -p /var/www/createsheets-frontend/dist
sudo chown -R deploy:deploy /var/www/createsheets-frontend
```

If the deploy user is `ubuntu`, use:

```bash
sudo chown -R ubuntu:ubuntu /var/www/createsheets-frontend
```

The GitHub workflow syncs files into `/var/www/createsheets-frontend/dist/`.

## Passwordless Nginx Validation and Reload

The workflow runs:

```bash
sudo nginx -t && sudo nginx -s reload
```

Automated CI cannot type a sudo password, so allow only these Nginx commands.

Edit sudoers safely:

```bash
sudo visudo
```

Add one line, replacing `deploy` with the real deploy user:

```text
deploy ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t, /usr/sbin/nginx -s reload, /bin/nginx -t, /bin/nginx -s reload
```

Test it after saving:

```bash
sudo nginx -t
sudo nginx -s reload
```

## Manual Deployment

The manual helper script can deploy a local `dist/` folder:

```bash
npm run build
DEPLOY_HOST=YOUR_SERVER_HOST DEPLOY_USER=deploy ./deploy/deploy-frontend.sh
```

Optional overrides:

```bash
DEPLOY_DIR=/var/www/createsheets-frontend
DIST_DIR=/absolute/path/to/dist
```

## Common Errors and Fixes

### `Permission denied (publickey)`

Cause: `SSH_DEPLOY_KEY` does not match the public key in `authorized_keys`, or SSH permissions are too open.

Fix:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
ssh -i ~/.ssh/createsheets_frontend_deploy deploy@YOUR_SERVER_HOST
```

### `Host key verification failed`

Cause: the GitHub Actions runner has not seen the server before.

Fix: keep the workflow's `ssh-keyscan` step:

```bash
ssh-keyscan -H "$DEPLOY_HOST" >> ~/.ssh/known_hosts
```

### `sudo: a password is required`

Cause: the deploy user does not have the narrow passwordless sudo rule for Nginx.

Fix: add the sudoers rule above with `sudo visudo`.

### `dist/index.html was not found`

Cause: the frontend build failed or the deploy script was run from the wrong directory.

Fix:

```bash
npm run build
test -f dist/index.html
```

### Nginx reload fails

Cause: the Nginx config is invalid, Nginx is not running, or the deploy user cannot run the command.

Fix:

```bash
sudo nginx -t
systemctl status nginx
sudo systemctl start nginx
```
