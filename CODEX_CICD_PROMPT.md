# Codex Prompt: Implement Frontend CI/CD for CreateSheets Nginx Deployment

Copy this whole prompt into a fresh Codex task when you want Codex to implement the frontend CI/CD pipeline.

## Project Context

You are working on the CreateSheets production codebase:

- Repository: Interactive Question Management Sheet
- Product/domain: CreateSheets, https://www.createsheets.com
- Frontend: React 19, Vite 7, Tailwind CSS 4
- Frontend package manager: npm, with `package-lock.json`
- Frontend scripts:
  - `npm run lint`
  - `npm run build`
  - `npm run test`
- Frontend build output: `dist/`
- Backend: Java 17 Spring Boot under `backend/`
- Backend test command: `mvn test` from `backend/`
- Production frontend serving: Nginx
- Production frontend path: `/var/www/createsheets-frontend/dist`
- Production Nginx config in repo: `deploy/nginx-createsheets.conf`
- Docker Nginx config in repo: `deploy/frontend-nginx.conf`
- Existing GitHub Actions workflow: `.github/workflows/ci.yml`

Important existing behavior:

- Nginx serves frontend static files.
- Nginx reverse proxies API requests to the Spring Boot backend.
- SEO files and crawler routes already exist in the Nginx config, including `robots.txt`, `llms.txt`, `llms-full.txt`, `sitemap.xml`, `sitemap-static.xml`, and `sitemap-public-sheets.xml`.
- Private routes and API routes have noindex protections in Nginx.
- Do not remove or weaken SEO, robots, sitemap, API proxy, auth, Docker, or noindex behavior.

## Goal

Implement a safe frontend CI/CD pipeline so that:

1. Pull requests run frontend and backend checks, but never deploy.
2. Pushes to `main` run checks and then deploy the frontend to the production Nginx server.
3. GitHub Actions builds the Vite frontend with production build-time environment variables.
4. GitHub Actions syncs `dist/` to `/var/www/createsheets-frontend/dist/` over SSH using `rsync`.
5. Nginx is gracefully reloaded with `nginx -s reload`, not restarted.
6. Secrets are stored only in GitHub Actions secrets.
7. The implementation is fully documented in `CI_CD_FRONTEND.md`.

## Very Important Documentation Requirement

Before editing files, create or update `CI_CD_FRONTEND.md`.

During the implementation, keep `CI_CD_FRONTEND.md` updated with:

- Every command run.
- The directory where each command was run.
- Why each command was run.
- Output summary.
- Error, if any.
- Fix, if any.
- Every file edited.
- What changed.
- Why it changed.
- Before and after content for important configuration files.
- How to explain the implementation in an interview.

Do not include real secrets, private keys, passwords, tokens, API keys, or private environment values. Use `<REDACTED>` for sensitive examples.

## Start by Inspecting the Repository

Run and record these commands in `CI_CD_FRONTEND.md`:

```bash
git status -sb
rg --files .github deploy . | rg '(^\.github/|^deploy/|package\.json$|vite\.config|nginx|docker-compose|Dockerfile|README|\.env\.example)'
sed -n '1,240p' .github/workflows/ci.yml
sed -n '1,220p' package.json
sed -n '1,220p' vite.config.js
sed -n '1,260p' deploy/nginx-createsheets.conf
sed -n '1,260p' deploy/frontend-nginx.conf
sed -n '1,220p' .gitignore
```

Also inspect backend build files:

```bash
rg --files backend | rg '(pom.xml|mvnw|Dockerfile|application.*|\.env\.example)'
sed -n '1,220p' backend/pom.xml
```

Use the actual repository state. Do not assume the workflow, Nginx config, Docker setup, or scripts are unchanged.

## Files to Create or Modify

Implement these files unless inspection shows a better local pattern:

| File | Action | Purpose |
| --- | --- | --- |
| `.github/workflows/ci.yml` | Modify | Add frontend deploy job after checks |
| `deploy/deploy-frontend.sh` | Create | Manual deploy helper for `dist/` |
| `deploy/SECRETS.md` | Create | GitHub Actions secret and server setup documentation |
| `deploy/nginx-createsheets.conf` | Modify only if needed | Add missing gzip/cache/security rules while preserving existing routes |
| `CI_CD_FRONTEND.md` | Create/update throughout | Full implementation log and interview explanation |

Do not commit `dist/`, `.env`, private keys, backend target output, or local logs.

## GitHub Actions Requirements

Update `.github/workflows/ci.yml` carefully.

Existing jobs should keep their original purpose:

- `frontend`: install, lint, build, test.
- `backend`: run Maven tests.

Add a deploy job:

- Job name: `deploy-frontend`
- Runs on: `ubuntu-latest`
- Only deploys on push to `main`
- Must not deploy on pull requests
- Use this condition:

```yaml
if: github.ref == 'refs/heads/main' && github.event_name == 'push'
```

- Prefer `needs: [frontend, backend]` so production deploys only after full CI passes. If you choose only `needs: frontend`, document why in `CI_CD_FRONTEND.md`.
- Use Node 20 and npm cache.
- Install with `npm ci`.
- Build with production Vite environment variables.
- Verify `dist/` exists before deploying.
- Use `webfactory/ssh-agent@v0.9.0`.
- Add the server to `known_hosts` with `ssh-keyscan`.
- Deploy using `rsync`.
- Test Nginx config before reload if possible.
- Reload with `sudo nginx -s reload`, not restart.

Recommended deploy job shape:

```yaml
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

If the production server does not allow `sudo nginx -t`, document the sudoers fix in `deploy/SECRETS.md`.

## Vite Environment Variables

Vite variables are build-time variables. They must be provided when `npm run build` runs.

Use GitHub Actions secrets for:

- `VITE_GOOGLE_CLIENT_ID`
- `VITE_RAZORPAY_KEY_ID`

Use plain non-secret env values for:

- `VITE_API_BASE_URL: ""`
- `VITE_APP_NAME: "Create Sheets"`

Use only public frontend-safe keys in the Vite bundle. Do not put backend secrets, private API keys, JWT secrets, database URLs, or Razorpay secret keys in frontend env variables.

## Manual Deploy Script

Create `deploy/deploy-frontend.sh`.

Requirements:

- Bash script with `set -euo pipefail`.
- Runs from repository root after `npm run build`.
- Validates local `dist/index.html` exists.
- Accepts:
  - `DEPLOY_HOST`
  - `DEPLOY_USER`
  - `DEPLOY_DIR`, default `/var/www/createsheets-frontend`
- Backs up existing server `dist/` to a timestamped backup.
- Uses `rsync --archive --delete --checksum --compress`.
- Runs `sudo nginx -t && sudo nginx -s reload`.
- Prints clear success and failure messages.
- Does not contain secrets.

Make it executable:

```bash
chmod +x deploy/deploy-frontend.sh
```

Record this command in `CI_CD_FRONTEND.md`.

## GitHub Secrets Documentation

Create `deploy/SECRETS.md`.

Document:

- Required secrets
- What each secret does
- Example shape only, no real values
- How to generate an SSH deploy key
- How to add the public key to the server
- How to paste the private key into GitHub Actions secrets
- Required server directory permissions
- Required passwordless sudo rule for only Nginx validation and reload

Required GitHub secrets:

| Secret | Purpose |
| --- | --- |
| `SSH_DEPLOY_KEY` | Private key used by GitHub Actions to SSH into the server |
| `DEPLOY_HOST` | Server IP or hostname |
| `DEPLOY_USER` | SSH user on the server |
| `VITE_GOOGLE_CLIENT_ID` | Public Google OAuth client ID for frontend build |
| `VITE_RAZORPAY_KEY_ID` | Public Razorpay key ID for frontend build |

Example sudoers entry, adjusted to the real deploy user:

```text
deploy ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t, /usr/sbin/nginx -s reload, /bin/nginx -t, /bin/nginx -s reload
```

## Nginx Rules

Review `deploy/nginx-createsheets.conf`. Do not blindly replace it.

Preserve:

- HTTP to HTTPS redirect.
- Apex domain redirect to `www.createsheets.com`.
- Frontend root `/var/www/createsheets-frontend/dist`.
- API reverse proxy.
- Sitemap and llms routes.
- SEO noindex headers for private/auth/API routes.

Add only missing improvements:

- `gzip on`
- gzip MIME types for Vite assets
- hashed asset caching for `/assets/`
- no-cache for `/index.html`
- security headers such as:
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `Referrer-Policy`

Before changing Nginx, record the before content in `CI_CD_FRONTEND.md`. After changing it, record the after content and explain every important rule.

## Local Verification Commands

Run what is reasonable locally and record results in `CI_CD_FRONTEND.md`:

```bash
npm ci
npm run lint
npm run build
npm run test
```

For backend:

```bash
cd backend
mvn test
```

If Docker is available and relevant:

```bash
docker compose config
docker compose build frontend
```

Do not claim Docker or Nginx verification passed unless commands actually ran successfully.

## Production Verification Commands for the User

After merging to `main` and configuring secrets, give the user:

```bash
curl -I https://www.createsheets.com
curl -I https://www.createsheets.com/assets/
curl -I https://www.createsheets.com/index.html
curl -I https://www.createsheets.com/dashboard
curl -I https://www.createsheets.com/api/health
curl https://www.createsheets.com/robots.txt
curl https://www.createsheets.com/sitemap.xml
```

Also tell the user to check:

- GitHub Actions run status.
- Deploy job logs.
- Browser hard refresh.
- Nginx logs on server if deployment fails.

## Common Errors to Document

Add these to `CI_CD_FRONTEND.md` and `deploy/SECRETS.md` where useful:

- `Permission denied (publickey)`
- `Host key verification failed`
- `sudo: a password is required`
- `dist/ not found`
- Nginx reload failed
- API returns 502
- Browser white screen from cached `index.html`
- Deploy job accidentally runs on pull requests
- Vite env variable is missing or becomes `undefined`

For each error include:

- Exact error text
- Why it happens
- How to fix it
- Command to re-run after fixing

## Final Answer Required

When finished, report:

- Files changed
- Files added
- GitHub Actions jobs added or changed
- Nginx rules changed
- Secrets required
- Commands run
- Tests passed or failed
- Errors faced and fixes
- Manual server steps still required
- Final production URLs to verify
- Assumptions made
- Remaining limitations
- Recommended next improvements

Do not expose private secrets or environment values.
