# CreateSheets Frontend Nginx Log

This file tracks only the frontend Nginx/static-serving implementation for CreateSheets. It does not include real secrets, passwords, API keys, tokens, or private environment values.

## 1. Why Nginx Is Being Used

Nginx is used to serve the compiled frontend static files from the production Docker image.

- The CreateSheets frontend is a Vite React app, so the production output is static HTML, CSS, JavaScript, and assets.
- Nginx is lighter than running `npm run dev`.
- `npm run dev` is a development server with hot reload; it is not the right runtime for a production frontend container.
- Node.js is used only during the Docker build stage to install dependencies and run the Vite build.
- The final frontend container runs only Nginx, which saves RAM and avoids shipping the Node.js runtime in production.
- Nginx also handles SPA route fallback, static asset caching, gzip compression, SEO text/XML file content types, and proxying `/api/` to the backend container.

## 2. Frontend Detection

- Frontend location: repository root.
- Detected framework/tooling: React with Vite.
- Detection files:
  - `package.json`
  - `package-lock.json`
  - `vite.config.js`
  - `index.html`
  - `src/`
  - `public/`
- Package manager: npm, because `package-lock.json` exists.
- Install command used in Docker: `npm ci`.
- Build command used: `npm run build`.
- Production output folder: `dist`.
- Nginx serves the copied `dist` output from `/usr/share/nginx/html`.

## 3. Nginx Configuration

Nginx config path:

```text
deploy/frontend-nginx.conf
```

Host Nginx config path for the EC2 full-Docker deployment:

```text
deploy/nginx-createsheets-docker.conf
```

The container config serves the built frontend inside Docker. The host config terminates HTTPS with Let's Encrypt and proxies public traffic to the loopback-bound Docker containers.

The frontend Dockerfile copies it into the runtime image:

```Dockerfile
COPY deploy/frontend-nginx.conf /etc/nginx/conf.d/default.conf
```

### Important Rules

#### `upstream createsheets_backend`

```nginx
upstream createsheets_backend {
    server backend:8080;
}
```

This gives Nginx a named backend target. Docker Compose puts the frontend and backend services on the same network, so the frontend container can reach the backend container by service name: `backend`.

#### Static Root

```nginx
root /usr/share/nginx/html;
index index.html;
```

The built Vite files are copied into `/usr/share/nginx/html`. Nginx serves `index.html` and the generated assets from there.

#### SPA Fallback

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

`try_files $uri $uri/ /index.html;` means:

1. Try to serve an exact file matching the request path.
2. Try to serve a directory matching the request path.
3. If neither exists, serve `/index.html`.

This is required for React/Vite client-side routing. For example, refreshing `/dashboard` should not return a Nginx 404. Nginx serves `index.html`, and then React Router handles the route in the browser.

#### API Proxy

```nginx
location /api/ {
    add_header X-Robots-Tag "noindex, nofollow, nosnippet" always;
    proxy_pass http://createsheets_backend;
}
```

This lets the browser call same-origin URLs like `/api/health`. Nginx forwards those requests to the backend container at `http://backend:8080`.

#### Dynamic Sitemap Proxy

```nginx
location = /sitemap-public-sheets.xml {
    default_type application/xml;
    proxy_pass http://createsheets_backend;
}
```

The static frontend serves fixed files like `/sitemap.xml`, while the backend owns the dynamic public sheet sitemap.

#### SEO Static File Content Types

The config serves:

- `/robots.txt` as `text/plain`
- `/llms.txt` as `text/plain`
- `/llms-full.txt` as `text/plain`
- `/sitemap.xml` as `application/xml`
- `/sitemap-static.xml` as `application/xml`

This keeps crawler-facing files easy for bots and search engines to parse.

#### Gzip Compression

Gzip is enabled in `deploy/frontend-nginx.conf`:

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 5;
gzip_types
    text/plain
    text/css
    text/xml
    application/json
    application/javascript
    application/xml
    image/svg+xml;
```

This compresses text-based assets such as JavaScript, CSS, JSON, XML, and SVG when the browser sends `Accept-Encoding: gzip`.

#### Static Asset Caching

Hashed/static assets use long cache headers:

```nginx
location ~* \.(?:css|js|mjs|png|jpe?g|gif|ico|svg|webp|avif|woff2?|ttf|eot)$ {
    access_log off;
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable" always;
    try_files $uri =404;
}
```

Vite outputs hashed asset names, so long-lived immutable caching is safe for built CSS/JS/image/font assets. New deployments generate new filenames when content changes.

`index.html` and `sw.js` use no-cache behavior:

```nginx
location = /index.html {
    add_header Cache-Control "no-cache" always;
    try_files /index.html =404;
}

location = /sw.js {
    access_log off;
    default_type application/javascript;
    add_header Cache-Control "no-cache" always;
    try_files /sw.js =404;
}
```

This helps browsers pick up new deployments instead of getting stuck on an old app shell.

#### Access Log Reduction

Access logs are disabled for health checks and static assets:

```nginx
location = /healthz {
    access_log off;
}

location ~* \.(?:css|js|mjs|png|jpe?g|gif|ico|svg|webp|avif|woff2?|ttf|eot)$ {
    access_log off;
}
```

This reduces noisy logs from frequent health checks and repeated browser asset requests. API and page route logs remain available through the default Nginx behavior.

## 4. Files Created or Modified

### `Dockerfile`

What changed:

- Created a multi-stage frontend Dockerfile at the repository root.
- Uses `node:22-alpine` during build.
- Uses `nginx:1.27-alpine` for the final runtime image.
- Copies `deploy/frontend-nginx.conf` into the Nginx image.
- Copies the built `dist/` output into `/usr/share/nginx/html`.

Why it changed:

- The frontend lives at the repo root.
- Node is needed only to build the static Vite app.
- Nginx is enough for runtime serving and uses much less memory than a dev server.

### `deploy/frontend-nginx.conf`

What changed:

- Created the frontend container Nginx config.
- Added SPA fallback.
- Added API and dynamic sitemap proxying to the backend service.
- Added correct content types for crawler/SEO files.
- Added private route `X-Robots-Tag` protection.
- Added gzip compression.
- Added immutable static asset caching.
- Added no-cache behavior for `index.html` and `sw.js`.
- Reduced access logs for health checks and static files.

Why it changed:

- The production frontend container needs Nginx rules that are appropriate for Vite, React Router, API proxying, and SEO assets.

### `docker-compose.yml`

What changed:

- Added `frontend` service.
- Maps local port `3000` to Nginx container port `80`.
- Builds frontend from the root `Dockerfile`.
- Passes Vite build args from environment placeholders.
- Makes frontend depend on healthy backend.

Why it changed:

- Docker Compose runs frontend, backend, MongoDB, and Redis together.
- Frontend Nginx can proxy `/api/` to the backend service on the shared Docker network.

### `docker-compose.prod.yml`

What changed:

- Added a production Compose file for EC2.
- Frontend binds to `127.0.0.1:3000`.
- Backend binds to `127.0.0.1:18080`.
- Redis is internal-only and has no public port.
- MongoDB is not included because production uses MongoDB Atlas.

Why it changed:

- Host Nginx should be the only public entry point.
- The frontend container stays lightweight because its final runtime is still Nginx only.
- Production can run frontend, backend, and Redis with one Docker Compose command.

### `deploy/nginx-createsheets-docker.conf`

What changed:

- Added a host Nginx template for Docker-based EC2 deployment.
- Proxies `https://www.createsheets.com` to the frontend container on `127.0.0.1:3000`.
- Proxies `/api/` and `https://api.createsheets.com` to the backend container on `127.0.0.1:18080`.
- Keeps crawler files and sitemap routes readable with the correct content types.
- Adds noindex headers for API/private routes.
- Handles production CORS preflight headers.
- Keeps gzip enabled at the host edge.

Why it changed:

- Host Nginx owns HTTPS certificates and public routing.
- Docker containers stay private on loopback-bound ports.
- The same Nginx layer handles SEO/crawler readiness and browser API calls.

### `.dockerignore`

What changed:

- Added root Docker ignore rules.
- Excludes `node_modules`, `dist`, local env files, backend source from frontend context, media docs, logs, and Git metadata.

Why it changed:

- Keeps frontend Docker builds smaller, faster, and safer.

### `.env.example`

What changed:

- Added frontend Docker build placeholders such as `VITE_SITE_URL`, `VITE_APP_API_BASE_URL`, and related frontend environment keys.
- Added `BACKEND_HOST_PORT=18080` for the backend host port used by Compose.

Why it changed:

- Compose reads `.env` automatically.
- Frontend build args and backend host port should be easy to configure without putting secrets into the repo.

### `public/robots.txt`, `public/llms.txt`, `public/llms-full.txt`, `public/sitemap.xml`, `public/sitemap-static.xml`

What changed:

- These files were not changed during this Nginx-only update.
- They are still important to frontend serving because the Vite build copies `public/` into `dist/`, and Nginx serves them from `/usr/share/nginx/html`.

Why they matter:

- The Nginx config assigns crawler-friendly content types for these public files.
- Static files are served directly by Nginx without involving Node.js or the backend, except for the dynamic `/sitemap-public-sheets.xml` endpoint.

## 5. Commands Run

### Inspect Frontend/Nginx Files

Command:

```bash
sed -n '1,240p' deploy/frontend-nginx.conf
```

Directory:

```text
/Users/krishnaawasthi/lega/Interactive-Question-Management-Sheet
```

Why:

- To review current frontend Nginx behavior before adding gzip, cache headers, and access-log reduction.

Output summary:

- Existing config served the SPA, SEO files, `/api/`, and `/sitemap-public-sheets.xml`.
- It did not yet include explicit gzip or immutable static asset caching.

Error:

- None.

Fix:

- Added gzip, static asset caching, no-cache app shell rules, and reduced access logs.

### Inspect Frontend Dockerfile

Command:

```bash
sed -n '1,120p' Dockerfile
```

Directory:

```text
/Users/krishnaawasthi/lega/Interactive-Question-Management-Sheet
```

Why:

- To confirm frontend image uses Node only for build and Nginx for runtime.

Output summary:

- Build stage uses `node:22-alpine`.
- Runtime stage uses `nginx:1.27-alpine`.
- Runtime copies `deploy/frontend-nginx.conf` and built `dist/`.

Error:

- None.

Fix:

- Not needed.

### Inspect Compose Frontend Service

Command:

```bash
sed -n '1,160p' docker-compose.yml
```

Directory:

```text
/Users/krishnaawasthi/lega/Interactive-Question-Management-Sheet
```

Why:

- To confirm frontend port mapping, build context, build args, and backend dependency.

Output summary:

- Frontend maps `3000:80`.
- Frontend builds from root `Dockerfile`.
- Frontend depends on healthy backend.

Error:

- None.

Fix:

- Not needed.

### Check Worktree Before Nginx Edit

Command:

```bash
git status --short
```

Directory:

```text
/Users/krishnaawasthi/lega/Interactive-Question-Management-Sheet
```

Why:

- To avoid touching unrelated user changes.

Output summary:

- Docker files and docs were untracked/modified.
- Existing unrelated files remained present.

Error:

- None.

Fix:

- Not needed.

### Rebuild and Restart Frontend Stack

Command:

```bash
docker compose up --build -d
```

Directory:

```text
/Users/krishnaawasthi/lega/Interactive-Question-Management-Sheet
```

Why:

- To rebuild the frontend image with the updated Nginx config and restart the stack.

Output summary:

- Backend and frontend images built.
- Frontend Nginx config copy step reran.
- Backend became healthy.
- Frontend started successfully.

Error:

- None for the Nginx/frontend config update.

Fix:

- Not needed.

### Validate Nginx Syntax

Command:

```bash
docker exec createsheets-frontend nginx -t
```

Directory:

```text
/Users/krishnaawasthi/lega/Interactive-Question-Management-Sheet
```

Why:

- To verify the Nginx configuration inside the running frontend container.

Output summary:

- `syntax is ok`
- `test is successful`

Error:

- None.

Fix:

- Not needed.

### Check Running Containers

Command:

```bash
docker compose ps
```

Directory:

```text
/Users/krishnaawasthi/lega/Interactive-Question-Management-Sheet
```

Why:

- To confirm frontend, backend, MongoDB, and Redis are running and healthy.

Output summary:

- `createsheets-frontend` is up and healthy on `3000->80`.
- `createsheets-backend` is up and healthy on `18080->8080`.
- MongoDB and Redis are healthy.

Error:

- None.

Fix:

- Not needed.

### Verify Frontend Root

Command:

```bash
curl -I http://localhost:3000
```

Directory:

```text
/Users/krishnaawasthi/lega/Interactive-Question-Management-Sheet
```

Why:

- To confirm Nginx serves the frontend root.

Output summary:

- Returned HTTP `200 OK`.
- Returned `Server: nginx/1.27.5`.
- Returned `Cache-Control: no-cache` for the app shell.

Error:

- None.

Fix:

- Not needed.

### Verify SPA Route Refresh

Command:

```bash
curl -I http://localhost:3000/dashboard
```

Directory:

```text
/Users/krishnaawasthi/lega/Interactive-Question-Management-Sheet
```

Why:

- To confirm direct refresh on a frontend route falls back to `index.html`.

Output summary:

- Returned HTTP `200 OK`.
- Returned `Cache-Control: no-cache`.
- Confirms SPA fallback works for `/dashboard`.

Error:

- None.

Fix:

- Not needed.

### Verify API Proxy

Command:

```bash
curl -fsS http://localhost:3000/api/health
```

Directory:

```text
/Users/krishnaawasthi/lega/Interactive-Question-Management-Sheet
```

Why:

- To confirm Nginx proxies `/api/` to the backend container.

Output summary:

- Returned backend health JSON with `"status":"ok"`.

Error:

- None.

Fix:

- Not needed.

### Find Built JavaScript Asset

Command:

```bash
node -e "fetch('http://localhost:3000').then(r=>r.text()).then(t=>{const m=t.match(/\\/assets\\/[^\\\"']+\\\\.js/); console.log(m ? m[0] : 'NO_ASSET_FOUND');})"
```

Directory:

```text
/Users/krishnaawasthi/lega/Interactive-Question-Management-Sheet
```

Why:

- To locate a real built asset for cache and gzip verification.

Output summary:

- Found `/assets/index-C9mUPAcu.js`.

Error:

- None.

Fix:

- Not needed.

### Verify Static Asset Cache Headers

Command:

```bash
curl -I http://localhost:3000/assets/index-C9mUPAcu.js
```

Directory:

```text
/Users/krishnaawasthi/lega/Interactive-Question-Management-Sheet
```

Why:

- To confirm static JS assets get long-lived immutable cache headers.

Output summary:

- Returned HTTP `200 OK`.
- Returned `Expires` one year in the future.
- Returned `Cache-Control: public, max-age=31536000, immutable`.

Error:

- None.

Fix:

- Not needed.

### Verify Gzip Compression

Command:

```bash
curl -s -D - -o /dev/null -H 'Accept-Encoding: gzip' http://localhost:3000/assets/index-C9mUPAcu.js
```

Directory:

```text
/Users/krishnaawasthi/lega/Interactive-Question-Management-Sheet
```

Why:

- To confirm Nginx compresses text-based static assets when the browser supports gzip.

Output summary:

- Returned `Content-Encoding: gzip`.
- Returned `Vary: Accept-Encoding`.

Error:

- None.

Fix:

- Not needed.

### Check Container Memory

Command:

```bash
docker stats --no-stream createsheets-frontend createsheets-backend
```

Directory:

```text
/Users/krishnaawasthi/lega/Interactive-Question-Management-Sheet
```

Why:

- To compare frontend Nginx runtime memory with backend Java runtime memory.

Output summary:

- Frontend Nginx container used about `8.805MiB`.
- Backend Java container used about `256.5MiB`.

Error:

- None.

Fix:

- Not needed.

## 6. RAM Efficiency Notes

- Final frontend container uses `nginx:1.27-alpine`.
- No frontend dev server runs in production.
- No `npm run dev` runs in the final image.
- No hot reload runs in the final image.
- No Node.js runtime is in the final frontend image.
- Node.js exists only in the Docker build stage.
- Nginx only serves static files and proxies selected backend routes.
- In the EC2 full-Docker setup, host Nginx handles HTTPS while the frontend container still runs only Nginx.
- `docker stats --no-stream createsheets-frontend createsheets-backend` showed the frontend Nginx container using about `8.805MiB`, much smaller than the Java backend container.

## 7. Testing and Verification

- Frontend image builds successfully: yes.
- Nginx container starts successfully: yes.
- Nginx config syntax test: passed with `docker exec createsheets-frontend nginx -t`.
- Frontend opens in browser: yes, final frontend URL is `http://localhost:3000`.
- Page refresh works on frontend routes: yes, `curl -I http://localhost:3000/dashboard` returned `200 OK`.
- Static files load correctly: yes, `/assets/index-C9mUPAcu.js` returned `200 OK`.
- Static asset caching works: yes, asset response includes `Cache-Control: public, max-age=31536000, immutable`.
- Gzip works: yes, asset response includes `Content-Encoding: gzip` when requested with `Accept-Encoding: gzip`.
- Backend API calls work through Nginx: yes, `http://localhost:3000/api/health` returned backend health JSON with `"status":"ok"`.
- Final frontend URL: `http://localhost:3000`.
- Direct backend URL for local Docker: `http://localhost:18080/api/health`.

## 8. Errors Faced and Fixes

No major Nginx-related error occurred.

Non-Nginx Docker issues during full-stack startup are documented in `dockerize.md`, including the backend runtime image platform issue and the local host port `8080` conflict.

## 9. CI/CD Production Nginx Follow-Up

Date: June 1, 2026.

### Files Modified

#### `deploy/nginx-createsheets.conf`

What changed:

- Added gzip compression to the production `www.createsheets.com` frontend server block.
- Added baseline security headers for frontend responses:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- Added no-cache handling for `/index.html`.
- Added no-cache handling for `/sw.js`.
- Added immutable one-year caching for Vite assets under `/assets/`.
- Disabled access logs for `/assets/` and `/sw.js`.

Why it changed:

- The GitHub Actions CI/CD flow deploys fresh Vite `dist/` files into `/var/www/createsheets-frontend/dist`.
- Vite hashed assets can be cached aggressively because changed content gets a changed filename.
- `index.html` must stay fresh so browsers load the newest generated JS/CSS filenames after deployment.
- Gzip reduces frontend asset transfer size.
- Security headers add baseline browser hardening without changing app routing.

### Commands Run

| Command | Directory | Why | Output summary | Error | Fix |
| --- | --- | --- | --- | --- | --- |
| `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/ci.yml"); puts "yaml ok"'` | Repo root | Validate the CI/CD workflow syntax | Printed `yaml ok` | None | None |
| `bash -n deploy/deploy-frontend.sh` | Repo root | Validate the manual deploy script syntax | Passed with no output | None | None |
| `docker compose config` | Repo root | Confirm Docker Compose config still parses after frontend-serving changes | Compose config rendered successfully | None | None |
| `git diff --check` | Repo root | Check for whitespace or patch formatting issues | Passed with no output | None | None |

### Testing and Verification

- Production Nginx syntax was not tested on the live server from this local environment.
- The new GitHub Actions deploy step will run `sudo nginx -t && sudo nginx -s reload` on the production server after syncing `dist/`.
- Local Docker Compose config parsing passed.

### Errors Faced and Fixes

No major Nginx-related error occurred in this CI/CD implementation pass.
