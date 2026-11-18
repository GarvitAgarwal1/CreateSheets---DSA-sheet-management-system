# CreateSheets Dockerization Log

This document records the Dockerization work for the CreateSheets project. It intentionally avoids real secrets, passwords, API keys, JWT secrets, or private values. Use `.env.example` as a placeholder template only.

## Project Structure Analysis

- Repository root: `/Users/krishnaawasthi/lega/Interactive-Question-Management-Sheet`
- Frontend location: repository root
  - Evidence: `package.json`, `package-lock.json`, `vite.config.js`, `index.html`, `src/`, and `public/`
  - Framework/tooling: React with Vite
  - Package manager: npm, because `package-lock.json` exists
  - Build command: `npm run build`
  - Development port: Vite dev server uses port `5173`
  - Docker runtime port: Nginx serves the production build on container port `80`, mapped to local port `3000`
- Backend location: `backend/`
  - Evidence: `backend/pom.xml`, `backend/src/main/java`, `backend/src/main/resources/application.properties`
  - Framework/tooling: Java Spring Boot
  - Build tool: Maven
  - Java release: 17 from `backend/pom.xml`
  - Backend port: `8080` from `server.port=8080`
  - Health endpoint: `/api/health`
- Data/services:
  - MongoDB is required through `MONGODB_URI`
  - Redis is configured through `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD`
  - No Kafka runtime configuration was found in the inspected backend resources/source files, so Kafka was not added to Compose.

## Production EC2 Architecture Added

Production deployment now uses a separate Compose file:

```text
docker-compose.prod.yml
```

Why it exists:

- Local `docker-compose.yml` keeps the developer stack with MongoDB, Redis, backend, and frontend.
- Production EC2 should not run MongoDB locally because the production database is MongoDB Atlas through `MONGODB_URI`.
- Production Redis is still inside Docker, internal-only, and used for safe public/read cache data.
- Frontend and backend host ports are bound to `127.0.0.1`, so only host Nginx can reach them.

Production services:

- `createsheets-frontend`
  - Built from the root `Dockerfile`.
  - Final image runs `nginx:1.27-alpine`.
  - Binds `127.0.0.1:3000:80`.
- `createsheets-backend`
  - Built from `backend/Dockerfile`.
  - Runs the Spring Boot JAR on Java 17.
  - Binds `127.0.0.1:18080:8080`.
  - Uses MongoDB Atlas through `MONGODB_URI`.
  - Uses Redis through internal Docker DNS name `redis`.
- `createsheets-redis`
  - Uses `redis:7-alpine`.
  - Has persistent `redis-data` volume.
  - Has no public host port.

Host Nginx config for this architecture:

```text
deploy/nginx-createsheets-docker.conf
```

Host Nginx terminates HTTPS/Let's Encrypt and proxies:

- `https://www.createsheets.com` to `127.0.0.1:3000`
- `https://www.createsheets.com/api/` to `127.0.0.1:18080`
- `https://api.createsheets.com` to `127.0.0.1:18080`
- `https://www.createsheets.com/sitemap-public-sheets.xml` to the backend container

## Environment Variables

Important backend variables:

- `MONGODB_URI`
- `MONGO_STARTUP_PING_ENABLED`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `APP_AUTH_SECRET`
- `APP_AUTH_GOOGLE_CLIENT_ID`
- `APP_AUTH_GOOGLE_CLIENT_IDS`
- `APP_AUTH_OTP_BYPASS_KEY`
- `APP_CORS_ALLOWED_ORIGINS`
- `APP_CORS_ALLOWED_ORIGIN_PATTERNS`
- `ADMIN_USERNAME`
- `APP_MAIL_ENABLED`
- `APP_MAIL_HOST`
- `APP_MAIL_PORT`
- `APP_MAIL_USERNAME`
- `APP_MAIL_PASSWORD`
- `APP_MAIL_FROM`
- `APP_MAIL_FROM_NAME`
- `APP_MAIL_AUTH`
- `APP_MAIL_STARTTLS`
- `APP_PAYMENT_RAZORPAY_ENABLED`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `APP_CACHE_PUBLIC_TTL_SECONDS`

Important frontend build variables:

- `VITE_API_BASE_URL`
- `VITE_APP_API_BASE_URL`
- `VITE_APP_AUTH_GOOGLE_CLIENT_ID`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_RAZORPAY_KEY_ID`
- `VITE_APP_NAME`
- `VITE_ADMIN_USERNAME`
- `VITE_SITE_URL`

For the Docker setup, `VITE_API_BASE_URL` is intentionally allowed to stay empty. The frontend then uses same-origin `/api`, and the frontend Nginx container proxies `/api/` to the backend container.

## Files Created or Modified

### `Dockerfile`

Created the frontend Dockerfile at the repository root.

Why it is needed:

- The frontend source lives at the root.
- Vite builds static files into `dist/`.
- A production container should serve static assets through Nginx, not the Vite dev server.

What it does:

- Uses `node:22-alpine` to install dependencies with `npm ci`.
- Builds the Vite app with `npm run build`.
- Copies the built `dist/` output into `nginx:1.27-alpine`.
- Serves the frontend on container port `80`.
- Adds a simple `/healthz` healthcheck through the Nginx config.

Important parts:

- `COPY package*.json ./`
- `RUN npm ci`
- `RUN npm run build`
- `COPY deploy/frontend-nginx.conf /etc/nginx/conf.d/default.conf`
- `COPY --from=build /app/dist /usr/share/nginx/html`

### `backend/Dockerfile`

Created the backend Dockerfile.

Why it is needed:

- The backend has its own build system and runtime requirements.
- Spring Boot should be packaged into a JAR before running.

What it does:

- Uses `maven:3.9-eclipse-temurin-17` to compile the backend.
- Runs `mvn -B -DskipTests package`.
- Copies the generated Spring Boot JAR into a lightweight `eclipse-temurin:17-jre-alpine` runtime image.
- Runs the app with `java -jar /app/app.jar`.
- Exposes container port `8080`.
- Adds a `/api/health` healthcheck.

Important parts:

- `RUN mvn -B -DskipTests package`
- `COPY --from=build /tmp/app.jar /app/app.jar`
- `ENTRYPOINT ["java", "-jar", "/app/app.jar"]`

### `docker-compose.yml`

Created the root Docker Compose file.

Why it is needed:

- It builds and runs the frontend, backend, MongoDB, and Redis together.
- It creates a shared Docker network automatically.
- It gives the services stable DNS names, such as `backend`, `mongo`, and `redis`.

What it does:

- Builds `createsheets-backend` from `backend/Dockerfile`.
- Builds `createsheets-frontend` from the root `Dockerfile`.
- Starts `mongo:7` with a persistent volume.
- Starts `redis:7-alpine` with a persistent volume.
- Maps frontend local port `3000` to container port `80`.
- Maps backend local port `18080` to container port `8080` by default.
- Maps MongoDB local port `27017` to container port `27017`.
- Maps Redis local port `6379` to container port `6379`.
- Uses healthchecks for backend, MongoDB, and Redis.

Important parts:

- Frontend talks to backend through Nginx proxying `/api/` to `http://backend:8080`.
- Backend talks to MongoDB through `mongodb://mongo:27017/iqms`.
- Backend talks to Redis through host `redis` and port `6379`.

### `docker-compose.prod.yml`

Created the production Docker Compose file for EC2.

Why it is needed:

- Keeps local development behavior intact.
- Removes local MongoDB from production.
- Runs Redis as an internal-only Docker service.
- Binds frontend/backend ports only to `127.0.0.1` for host Nginx reverse proxying.

What it does:

- Starts `createsheets-redis` with append-only persistence and a healthcheck.
- Builds `createsheets-backend` from `backend/Dockerfile`.
- Passes production runtime variables from the server `.env`.
- Exposes backend only on `127.0.0.1:18080`.
- Builds `createsheets-frontend` from the root Dockerfile.
- Exposes frontend only on `127.0.0.1:3000`.

### `deploy/nginx-createsheets-docker.conf`

Created the production host Nginx template for Docker deployment.

Why it is needed:

- The final EC2 architecture uses host Nginx for HTTPS and Certbot.
- The app itself runs inside Docker containers.
- Public ports `3000`, `18080`, Redis, and MongoDB should not be internet-exposed.

What it does:

- Redirects HTTP to HTTPS.
- Redirects `createsheets.com` to `www.createsheets.com`.
- Proxies frontend traffic to `127.0.0.1:3000`.
- Proxies `/api/` and `api.createsheets.com` to `127.0.0.1:18080`.
- Preserves crawler file and sitemap content types.
- Adds `X-Robots-Tag` for API/private routes.
- Handles CORS preflight for production origins.
- Keeps gzip compression enabled.

### `.dockerignore`

Created root Docker ignore file for the frontend build context.

Why it is needed:

- Keeps frontend image builds smaller and faster.
- Prevents local-only files, build output, logs, and environment files from entering Docker build context.

Important exclusions:

- `node_modules`
- `dist`
- `.env`
- `*.env`
- `backend`
- local media/docs artifacts
- `.git`

### `backend/.dockerignore`

Created backend Docker ignore file.

Why it is needed:

- Prevents Maven `target/`, backend env files, logs, and local metadata from entering the backend build context.

Important exclusions:

- `target`
- `.env`
- `*.env`
- `.git`
- editor and OS metadata

### `deploy/frontend-nginx.conf`

Created an Nginx config for the frontend container.

Why it is needed:

- Vite builds a single page app, so direct browser refreshes on routes like `/dashboard` or `/sheets/...` need to fall back to `index.html`.
- The frontend container should proxy API requests to the backend container.
- Static SEO files need correct content types.

What it does:

- Serves the built frontend from `/usr/share/nginx/html`.
- Serves `/robots.txt`, `/llms.txt`, and `/llms-full.txt` as `text/plain`.
- Serves `/sitemap.xml` and `/sitemap-static.xml` as `application/xml`.
- Proxies `/sitemap-public-sheets.xml` to the backend.
- Proxies `/api/` to the backend.
- Adds `X-Robots-Tag: noindex, nofollow, nosnippet` for API/private app routes.
- Enables gzip for text-based frontend assets.
- Caches hashed static assets for one year with immutable cache headers.
- Keeps `index.html` and `sw.js` no-cache so deployments update cleanly.
- Disables noisy access logs for health checks and static assets.
- Falls back all other SPA routes to `index.html`.

### `nginx.md`

Created a separate frontend Nginx implementation log.

Why it is needed:

- The project now has a dedicated document for frontend static serving, Nginx rules, gzip, caching, access logs, RAM efficiency, commands, verification, and Nginx-specific errors.

What it does:

- Tracks only the frontend Nginx implementation.
- Keeps Nginx/frontend-serving details separate from the full-project Dockerization log in this file.

### `.env.example`

Updated the root environment template.

Why it is needed:

- Docker Compose reads `.env` automatically if present.
- The project needs one clear placeholder file for both frontend build variables and backend runtime variables.

What changed:

- Added Docker Compose/backend placeholders.
- Added `VITE_APP_API_BASE_URL` and `VITE_SITE_URL`.
- Kept all values as placeholders or safe local defaults.

### `frontend/.env.example`

Updated the older frontend environment template.

Why it is needed:

- The `frontend/` directory is not the actual frontend source, but the existing template had frontend env examples.
- Replaced concrete public test/client values with placeholders to keep examples clean.

What changed:

- Replaced client/payment values with `replace-with-*` placeholders.
- Added `VITE_APP_API_BASE_URL`, `VITE_ADMIN_USERNAME`, and `VITE_SITE_URL`.

## Docker Explanation

### Why Backend Has Its Own Dockerfile

The backend is a Java Spring Boot application. It needs Maven to compile the code and package a runnable JAR. The final production image should not include Maven or the full build toolchain, so the Dockerfile uses a multi-stage build:

1. Build stage: Maven compiles and packages the app.
2. Runtime stage: a smaller Java runtime image runs only the packaged JAR.

### Why Frontend Has Its Own Dockerfile

The frontend is a Vite React app. Vite is only needed to build static production assets. The final runtime should serve those static files through Nginx:

1. Build stage: Node installs dependencies and runs `npm run build`.
2. Runtime stage: Nginx serves the built `dist/` files.

### Why Docker Compose Is Used

The full app needs multiple services:

- Frontend
- Backend
- MongoDB
- Redis

Running them manually would require several commands and careful networking. Docker Compose starts them together, shares environment variables, maps local ports, creates volumes, and gives each service a stable network name.

### How Docker Compose Creates a Network

The Compose file defines a `createsheets` bridge network. Docker automatically creates that network when `docker compose up` runs. Services attached to that network can reach each other by service name.

Examples:

- Frontend Nginx proxies API requests to `http://backend:8080`.
- Backend connects to MongoDB at `mongodb://mongo:27017/iqms`.
- Backend connects to Redis at `redis:6379`.

### How Frontend and Backend Communicate Inside Docker

Browser requests go to:

- `http://localhost:3000`

Inside the frontend container, Nginx handles:

- Static frontend routes directly
- `/api/` by proxying to `http://backend:8080`
- `/sitemap-public-sheets.xml` by proxying to `http://backend:8080/sitemap-public-sheets.xml`

This means the browser can use same-origin `/api/...` requests while the containers communicate over the Docker network.

### Local Ports vs Container Ports

Container ports are internal to Docker. Local ports are exposed on your machine.

- Frontend container port `80` maps to local port `3000`.
- Backend container port `8080` maps to local port `18080` by default.
- MongoDB container port `27017` maps to local port `27017`.
- Redis container port `6379` maps to local port `6379`.

So you open `http://localhost:3000` in the browser, even though the frontend container listens on port `80`.

## Commands Run

Commands were run from `/Users/krishnaawasthi/lega/Interactive-Question-Management-Sheet` unless another directory is specified.

### 1. Inspect Docker/build-related files

Command:

```bash
pwd && rg --files -g 'Dockerfile*' -g 'docker-compose*.yml' -g 'docker-compose*.yaml' -g '.dockerignore' -g 'nginx*.conf' -g 'vite.config.*' -g 'next.config.*' -g 'angular.json' -g 'package.json' -g 'package-lock.json' -g 'pom.xml' -g 'build.gradle*' -g 'settings.gradle*'
```

Why:

- To detect existing Docker files, frontend tooling, backend tooling, and deployment config.

Output summary:

- Found `vite.config.js`, `package.json`, `package-lock.json`, `backend/pom.xml`, and `deploy/nginx-createsheets.conf`.
- No existing Dockerfile, Compose file, or `.dockerignore` was found.

Errors:

- None.

Fix:

- Not needed.

### 2. Inspect frontend package metadata

Command:

```bash
cat package.json
```

Why:

- To detect framework, scripts, dependencies, and package manager.

Output summary:

- Frontend is a Vite React app.
- Scripts include `dev`, `build`, and `test`.
- `package-lock.json` exists, so Docker should use `npm ci`.

Errors:

- None.

Fix:

- Not needed.

### 3. Inspect backend Maven config

Command:

```bash
sed -n '1,240p' backend/pom.xml
```

Why:

- To detect Spring Boot version, Java version, Maven packaging, and artifact details.

Output summary:

- Backend uses Spring Boot `3.4.4`.
- Java release is `17`.
- Maven packaging is `jar`.
- Artifact is `iqms-backend`.

Errors:

- None.

Fix:

- Not needed.

### 4. Inspect Vite and frontend environment resolution

Command:

```bash
sed -n '1,220p' vite.config.* 2>/dev/null || true && sed -n '1,220p' src/config/envConfig.js
```

Why:

- To understand Vite config and how the frontend discovers the API base URL.

Output summary:

- Vite uses `envPrefix: ['VITE_']`.
- Dev server port is `5173`.
- Dev proxy sends `/api` to `localhost:8080`.
- The app can use a configured API URL or fall back to `/api` for same-origin deployments.

Errors:

- None.

Fix:

- Not needed.

### 5. Inspect backend application properties and env examples

Command:

```bash
sed -n '1,220p' backend/src/main/resources/application.properties && sed -n '1,180p' .env.example && sed -n '1,220p' backend/.env.example
```

Why:

- To detect backend port, MongoDB, Redis, auth, CORS, mail, and payment environment variables.

Output summary:

- Backend uses port `8080`.
- MongoDB comes from `MONGODB_URI`.
- Redis comes from `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD`.
- `APP_AUTH_SECRET` is required in the production/default profile.
- CORS settings are configurable.

Errors:

- None.

Fix:

- Not needed.

### 6. Inspect backend health controller

Command:

```bash
sed -n '1,160p' backend/src/main/java/com/iqms/backend/controller/HealthController.java
```

Why:

- To find a reliable backend Docker healthcheck endpoint.

Output summary:

- `/api/health` returns an OK status response.

Errors:

- None.

Fix:

- Not needed.

### 7. Inspect sitemap/noindex backend pieces

Command:

```bash
sed -n '1,160p' backend/src/main/java/com/iqms/backend/controller/SitemapController.java && sed -n '1,160p' backend/src/main/java/com/iqms/backend/security/WebMvcConfig.java
```

Why:

- To understand existing backend public XML routes and noindex behavior before adding frontend Nginx proxy rules.

Output summary:

- Backend serves `/sitemap-public-sheets.xml`.
- Backend registers noindex handling for protected/API routes.

Errors:

- None.

Fix:

- Not needed.

### 8. Inspect frontend API client behavior

Command:

```bash
sed -n '1,220p' src/api/apiClient.js && sed -n '1,120p' src/api/sheetApi.js
```

Why:

- To confirm frontend API requests can work with same-origin `/api` behind Nginx.

Output summary:

- API client uses the environment-derived API base URL.
- Relative API routes are compatible with the Nginx proxy.

Errors:

- None.

Fix:

- Not needed.

### 9. Check Docker availability

Command:

```bash
docker --version && docker compose version
```

Why:

- To verify whether Docker builds and Compose startup could be tested locally.

Output summary:

- Docker was not available.

Error:

```text
zsh:1: command not found: docker
```

Cause:

- Docker CLI is not installed or not available in the current PATH.

Fix:

- Install/start Docker Desktop or make the Docker CLI available, then run the Compose commands in this document.

### 10. Inspect root/backend directories

Command:

```bash
ls -la backend | sed -n '1,120p' && ls -la | sed -n '1,140p'
```

Why:

- To inspect existing generated folders, env files, and source layout.

Output summary:

- Backend has `pom.xml`, `src/`, and `target/`.
- Root has `dist/`, `node_modules/`, `src/`, `public/`, package files, and a small `frontend/` directory.

Errors:

- None.

Fix:

- Not needed.

### 11. Read the Dockerization request attachment

Command:

```bash
sed -n '1,260p' /Users/krishnaawasthi/.codex/attachments/97ecee22-39e6-422c-be12-ebbaac6ed371/pasted-text.txt
```

Why:

- To read the uploaded instructions completely before editing.

Output summary:

- The request asked for backend/frontend Dockerfiles, Docker Compose, `.dockerignore` files, `.env.example` placeholders, and this `dockerize.md` command/file/error log.

Errors:

- None.

Fix:

- Not needed.

### 12. Inspect `frontend/` directory

Command:

```bash
ls -la frontend
```

Why:

- The request said the frontend might be in a frontend folder, so this checked that assumption.

Output summary:

- `frontend/` only contained `.env.example`.
- The actual frontend source is at the repository root.

Errors:

- None.

Fix:

- Root `Dockerfile` was created for the real frontend location.

### 13. Check worktree before edits

Command:

```bash
git status --short
```

Why:

- To avoid overwriting unrelated user/worktree changes.

Output summary:

- `src/components/TopicList.jsx` was already modified from a prior requested UI change.
- `docs/HR.m4a`, `docs/Tech.m4a`, and `record.md` were untracked and unrelated.

Errors:

- None.

Fix:

- Dockerization edits did not revert or delete those files.

### 14. Confirm files under `frontend/`

Command:

```bash
rg --files frontend
```

Why:

- To confirm there were no actual frontend source files under `frontend/`.

Output summary:

- No tracked source files were found there.

Errors:

- The command exited with no matches.

Fix:

- Treated root as the frontend source directory.

### 15. Read environment/deployment files

Commands:

```bash
sed -n '1,220p' .env.example
sed -n '1,220p' frontend/.env.example
sed -n '1,260p' backend/.env.example
sed -n '1,260p' deploy/nginx-createsheets.conf
sed -n '1,200p' .gitignore
```

Why:

- To understand existing environment templates, production Nginx behavior, and ignored files.

Output summary:

- Root `.env.example` had frontend placeholders.
- `frontend/.env.example` had concrete public client/test values, so it was cleaned up to placeholders.
- Backend `.env.example` had backend placeholders.
- Production Nginx already includes SEO/static file and API proxy behavior.
- `.gitignore` already excludes local env files and build output.

Errors:

- None.

Fix:

- Added Docker Compose placeholders to root `.env.example`.
- Replaced concrete example values in `frontend/.env.example` with placeholders.

### 16. Search backend environment usage

Commands:

```bash
rg -n "REDIS|redis|spring\\.data\\.redis|spring\\.redis|MONGODB_URI|APP_AUTH_SECRET|CORS|APP_CORS|server.port" backend/src/main/resources backend/src/main/java
rg -n "mongo|mongodb|redis|kafka|spring.kafka|KAFKA" backend/src/main/resources backend/src/main/java
```

Why:

- To identify runtime dependencies and avoid adding unnecessary services.

Output summary:

- MongoDB and Redis are configured and used.
- No Kafka configuration was found.
- Backend port is `8080`.

Errors:

- None.

Fix:

- Added MongoDB and Redis to `docker-compose.yml`.
- Did not add Kafka.

### 17. Search frontend environment usage

Command:

```bash
rg -n "VITE_|import.meta.env|API_BASE_URL|Razorpay|GOOGLE" src package.json vite.config.js
```

Why:

- To identify build-time frontend variables needed in the frontend Dockerfile and Compose build args.

Output summary:

- Frontend reads Vite variables for API base URL, Google client ID, Razorpay key ID, app name, admin username, and site URL.

Errors:

- None.

Fix:

- Added corresponding build args to the frontend Dockerfile and Compose file.

### 18. Inspect frontend config/public files

Commands:

```bash
rg --files -g 'index.html' -g 'vite.config.js' -g 'postcss.config.*' -g 'tailwind.config.*' -g 'eslint.config.*' -g 'public/**' -g 'src/**' | sed -n '1,80p'
ls -la index.html vite.config.js postcss.config.js tailwind.config.js public
find public -maxdepth 2 -type f -print
```

Why:

- To make sure the frontend Dockerfile copies the correct files.

Output summary:

- Required config files exist at root.
- `public/` contains `robots.txt`, `llms.txt`, `llms-full.txt`, `sitemap.xml`, `sitemap-static.xml`, `sw.js`, and sample assets.

Errors:

- None.

Fix:

- Dockerfile copies root config files, `public/`, and `src/`.

### 19. Create Docker files

Command/tool:

```text
apply_patch
```

Why:

- To add and modify files safely without overwriting unrelated work.

Output summary:

- Added `Dockerfile`.
- Added `backend/Dockerfile`.
- Added `.dockerignore`.
- Added `backend/.dockerignore`.
- Added `deploy/frontend-nginx.conf`.
- Added `docker-compose.yml`.
- Updated `.env.example`.
- Updated `frontend/.env.example`.

Errors:

- None.

Fix:

- Not needed.

### 20. Read back Docker files and validate Compose YAML

Commands:

```bash
sed -n '1,240p' docker-compose.yml
sed -n '1,220p' Dockerfile
sed -n '1,220p' backend/Dockerfile
sed -n '1,260p' deploy/frontend-nginx.conf
ruby -e 'require "yaml"; YAML.load_file("docker-compose.yml"); puts "docker-compose.yml YAML OK"'
```

Why:

- To verify the generated files are readable and the Compose file is valid YAML.

Output summary:

- Dockerfiles and Nginx config were readable.
- YAML parser reported `docker-compose.yml YAML OK`.

Errors:

- None.

Fix:

- Not needed.

### 20a. Check blank frontend env fallback behavior

Command:

```bash
sed -n '1,70p' src/config/envConfig.js
```

Why:

- To confirm that blank Vite env values are ignored and the app can fall back to its built-in defaults.

Output summary:

- `readEnvValue` skips empty values and placeholder-looking values.
- This made it safe for the frontend Dockerfile to default `VITE_APP_NAME` to blank and let Compose or the application default provide the visible app name.

Errors:

- None.

Fix:

- Updated the frontend Dockerfile so `ARG VITE_APP_NAME=` has a blank default.
- Quoted Compose values that contain spaces, such as `Create Sheets`.

### 20b. Re-read refined Docker files and validate Compose YAML again

Commands:

```bash
ruby -e 'require "yaml"; YAML.load_file("docker-compose.yml"); puts "docker-compose.yml YAML OK"'
git diff --check
sed -n '1,80p' Dockerfile
sed -n '1,130p' docker-compose.yml
```

Why:

- To verify the refinement still left valid YAML and clean patch formatting.

Output summary:

- `docker-compose.yml YAML OK`.
- `git diff --check` reported no whitespace errors.
- The frontend Dockerfile and Compose file were readable with the expected quoted values.

Errors:

- None.

Fix:

- Not needed.

### 21. Check whitespace errors

Command:

```bash
git diff --check
```

Why:

- To catch trailing whitespace or patch formatting issues.

Output summary:

- No whitespace errors.

Errors:

- None.

Fix:

- Not needed.

### 22. Re-check Docker availability

Command:

```bash
docker --version
```

Why:

- To confirm whether Docker commands could be run after the files were added.

Output summary:

- Docker was still unavailable.

Error:

```text
zsh:1: command not found: docker
```

Cause:

- Docker CLI is not installed or not available in the current PATH.

Fix:

- Install/start Docker Desktop or make Docker available, then run `docker compose up --build`.

### 23. Run frontend tests

Command:

```bash
npm run test -- --run
```

Why:

- To make sure frontend changes/templates did not break the test suite.

Output summary:

- 16 test files passed.
- 67 tests passed.
- Vitest printed repeated `--localstorage-file` warnings, but tests passed.

Errors:

- None.

Fix:

- Not needed.

### 24. Run frontend production build

Command:

```bash
npm run build
```

Why:

- To verify the Vite production build still succeeds.

Output summary:

- Build succeeded.
- Vite transformed 1895 modules.
- Output included `dist/index.html`, CSS, and JS bundle.
- Existing warnings appeared for ignored `"use client"` directives in dependencies and a chunk larger than 500 kB.

Errors:

- None.

Fix:

- Not needed. The chunk-size message is a performance warning, not a build failure.

### 25. Run backend tests

Command:

```bash
JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home mvn test
```

Directory:

```text
/Users/krishnaawasthi/lega/Interactive-Question-Management-Sheet/backend
```

Why:

- To verify backend compilation and tests after adding the backend Docker setup.

Output summary:

- Maven build succeeded.
- 32 backend tests passed.
- 0 failures, 0 errors, 0 skipped.
- Java/Mockito dynamic agent warnings appeared, but tests passed.

Errors:

- None.

Fix:

- Not needed.

### 26. Retry Docker Compose after Docker became available

Commands:

```bash
docker --version && docker compose version
docker compose up --build -d
lsof -nP -iTCP:8080 -sTCP:LISTEN || true
docker compose ps
```

Why:

- Docker became available after the first pass, so the full Docker build and container startup were retried.
- The port check was run after Compose reported that host port `8080` was already in use.

Output summary:

- Docker version `29.5.2` and Docker Compose version `v5.1.3` were available.
- Redis and MongoDB images were pulled successfully.
- Frontend image built successfully.
- Backend image initially failed on the runtime image tag, then built successfully after the fix below.
- MongoDB and Redis containers started and became healthy.

First error:

```text
eclipse-temurin:17-jre-alpine: failed to resolve source metadata
no match for platform in manifest: not found
```

Cause:

- `eclipse-temurin:17-jre-alpine` was not available for the current Docker platform.

Fix:

- Changed `backend/Dockerfile` runtime image to `eclipse-temurin:17-jre-jammy`.
- Replaced Alpine `apk` setup with `apt-get`, `groupadd`, and `useradd`.

Second error:

```text
listen tcp 0.0.0.0:8080: bind: address already in use
```

Cause:

- A local Java process was already listening on port `8080`.

Fix:

- Changed Compose to map backend host port `${BACKEND_HOST_PORT:-18080}` to container port `8080`.
- Added `BACKEND_HOST_PORT=18080` to `.env.example`.
- The backend still listens on `8080` inside Docker, so frontend container proxying to `http://backend:8080` is unchanged.

Command used after fixing:

```bash
docker compose up --build -d
```

Final retry output summary:

- Backend and frontend images reused cached layers and built successfully.
- MongoDB and Redis were already running and healthy.
- Backend was recreated and became healthy on host port `18080`.
- Frontend was recreated and started on host port `3000`.

Verification commands:

```bash
docker compose ps
curl -fsS http://localhost:18080/api/health
curl -I http://localhost:3000
curl -fsS http://localhost:3000/api/health
```

Verification output summary:

- `createsheets-backend` is `Up` and `healthy`, mapped as `18080->8080`.
- `createsheets-frontend` is `Up` and `healthy`, mapped as `3000->80`.
- `createsheets-mongo` is `Up` and `healthy`.
- `createsheets-redis` is `Up` and `healthy`.
- Direct backend health returned JSON with `"status":"ok"`.
- Frontend root returned HTTP `200 OK` from Nginx.
- Frontend-proxied `/api/health` returned JSON with `"status":"ok"`.

Browser verification:

- The in-app browser was opened to `http://localhost:3000/`.

### 27. Inspect final worktree

Commands:

```bash
git status --short
git diff --stat
find . -maxdepth 2 -name 'Dockerfile' -o -name '.dockerignore' -o -name 'docker-compose.yml' -o -name 'frontend-nginx.conf'
```

Why:

- To summarize changed and created files at the end.

Output summary:

- Dockerization created root/backend Dockerfiles, root/backend `.dockerignore` files, `docker-compose.yml`, and `deploy/frontend-nginx.conf`.
- Root `.env.example` and `frontend/.env.example` were modified.
- Existing unrelated/uncommitted files remained untouched.

Errors:

- None.

Fix:

- Not needed.

### 28. Add Nginx gzip/cache documentation and verify frontend serving

Commands:

```bash
sed -n '1,240p' deploy/frontend-nginx.conf
sed -n '1,120p' Dockerfile
sed -n '1,160p' docker-compose.yml
git status --short
docker compose up --build -d
docker exec createsheets-frontend nginx -t
docker compose ps
curl -I http://localhost:3000
curl -I http://localhost:3000/dashboard
curl -fsS http://localhost:3000/api/health
node -e "fetch('http://localhost:3000').then(r=>r.text()).then(t=>{const m=t.match(/\/assets\/[^\"']+\\.js/); console.log(m ? m[0] : 'NO_ASSET_FOUND');})"
curl -I http://localhost:3000/assets/index-C9mUPAcu.js
curl -s -D - -o /dev/null -H 'Accept-Encoding: gzip' http://localhost:3000/assets/index-C9mUPAcu.js
docker stats --no-stream createsheets-frontend createsheets-backend
```

Why:

- To add and verify frontend Nginx production-serving behavior: gzip, static asset caching, no-cache app shell rules, quieter access logs, SPA fallback, API proxying, and memory usage.

Output summary:

- Nginx syntax test passed inside the frontend container.
- Frontend container stayed healthy on local port `3000`.
- Root route returned HTTP `200 OK` with `Cache-Control: no-cache`.
- `/dashboard` returned HTTP `200 OK`, confirming SPA refresh fallback.
- `/api/health` through the frontend returned backend health JSON with `"status":"ok"`.
- Built JS asset `/assets/index-C9mUPAcu.js` returned immutable one-year cache headers.
- Gzip verification returned `Content-Encoding: gzip`.
- `docker stats` showed the frontend Nginx container using about `8.805MiB`.

Errors:

- No major Nginx-related error occurred.
- A later browser automation reconnect was unavailable, but HTTP/container verification passed and the frontend URL remains `http://localhost:3000`.

Fix:

- Not needed for Nginx.

## Build and Run Instructions

From the repository root:

```bash
cp .env.example .env
```

Edit `.env` and replace placeholders before real use, especially:

- `APP_AUTH_SECRET`
- OAuth client IDs
- SMTP credentials
- Razorpay values

Build all images:

```bash
docker compose build
```

Start everything:

```bash
docker compose up
```

Build and start in one command:

```bash
docker compose up --build
```

Start in the background:

```bash
docker compose up --build -d
```

List running containers:

```bash
docker ps
```

View backend logs:

```bash
docker logs createsheets-backend
```

View frontend logs:

```bash
docker logs createsheets-frontend
```

View all Compose logs:

```bash
docker compose logs -f
```

Stop containers:

```bash
docker compose down
```

Stop containers and remove MongoDB/Redis volumes:

```bash
docker compose down -v
```

Clean unused Docker data:

```bash
docker system prune
```

## URLs to Open

Frontend:

```text
http://localhost:3000
```

Backend health:

```text
http://localhost:18080/api/health
```

Frontend-proxied backend health:

```text
http://localhost:3000/api/health
```

Static SEO files through frontend container:

```text
http://localhost:3000/robots.txt
http://localhost:3000/llms.txt
http://localhost:3000/llms-full.txt
http://localhost:3000/sitemap.xml
http://localhost:3000/sitemap-static.xml
http://localhost:3000/sitemap-public-sheets.xml
```

## Postman/API Usage

Use either:

```text
http://localhost:18080/api/...
```

or, through the same-origin frontend proxy:

```text
http://localhost:3000/api/...
```

The second option is closest to the browser behavior used by the frontend container.

## Errors Faced and Fixes

### Error: Docker CLI unavailable

Exact error:

```text
zsh:1: command not found: docker
```

Cause:

- Docker is not installed, Docker Desktop is not running, or the Docker CLI is not in PATH in this environment.

Fix:

1. Install Docker Desktop for macOS or start it if already installed.
2. Open a new terminal so PATH is refreshed.
3. From the repository root, run:

```bash
docker --version
docker compose version
docker compose up --build
```

Command used after fixing:

- Not run in this environment because Docker remained unavailable.

### Warnings That Did Not Block Verification

Frontend tests printed Node/Vitest `--localstorage-file` warnings. Tests still passed.

Frontend build printed warnings about ignored dependency-level `"use client"` directives and one chunk larger than 500 kB. Build still passed.

Backend tests printed Mockito/Java dynamic agent warnings. Tests still passed.

## Final Verification

- `docker-compose.yml` YAML parse: passed.
- `git diff --check`: passed.
- Frontend tests: passed, 16 files and 67 tests.
- Frontend production build: passed.
- Backend tests: passed, 32 tests.
- Backend image build: passed after switching the runtime image to `eclipse-temurin:17-jre-jammy`.
- Frontend image build: passed.
- Containers start successfully: passed after moving the backend host port to `18080`.
- Nginx syntax test: passed.
- Nginx gzip: passed for built JS asset.
- Nginx static asset caching: passed with immutable one-year cache headers.
- Nginx SPA route fallback: passed for `/dashboard`.
- Nginx API proxy: passed for `/api/health`.
- Ports mapped correctly in Compose:
  - Frontend `3000:80`
  - Backend `18080:8080` by default
  - MongoDB `27017:27017`
  - Redis `6379:6379`
- Frontend reachable: passed at `http://localhost:3000`.
- Backend reachable: passed at `http://localhost:18080/api/health`.
- Frontend-to-backend proxy reachable: passed at `http://localhost:3000/api/health`.
- Remaining issue: if you need backend on host port `8080`, stop the existing local Java process using that port or set `BACKEND_HOST_PORT=8080` only after freeing it.

## Production Notes

- Do not use the default `APP_AUTH_SECRET` from `docker-compose.yml` in production.
- Do not commit a real `.env` file.
- Use managed MongoDB/Redis or production volumes/backups for real deployment.
- Review whether exposing MongoDB and Redis to localhost is desired for production. It is convenient for local development, but production hosts usually keep these internal.
- The existing production Nginx config at `deploy/nginx-createsheets.conf` was not replaced. The new `deploy/frontend-nginx.conf` is specifically for the frontend Docker container.

## CI/CD and Production Nginx Follow-Up

Date: June 1, 2026.

This follow-up did not change the Dockerfiles or `docker-compose.yml`.

Files added or modified for CI/CD/frontend serving:

- `.github/workflows/ci.yml`
- `deploy/deploy-frontend.sh`
- `deploy/SECRETS.md`
- `deploy/nginx-createsheets.conf`
- `CI_CD_FRONTEND.md`
- `nginx.md`

What changed:

- Added a GitHub Actions `deploy-frontend` job that builds the Vite frontend and syncs `dist/` to `/var/www/createsheets-frontend/dist` over SSH.
- Added a manual frontend deployment script for the same production Nginx path.
- Added GitHub Actions secrets documentation.
- Updated the production Nginx config with gzip, no-cache app-shell handling, immutable `/assets/` caching, and security headers.

Docker impact:

- No frontend Docker runtime behavior changed.
- No backend Docker runtime behavior changed.
- `docker compose config` was run and parsed successfully after the CI/CD/Nginx changes.

## Backend CI/CD Follow-Up

Date: June 1, 2026.

The backend CI/CD implementation uses a systemd-managed JAR deployment for production. This does not replace the Docker setup in this file.

Files added or modified for backend CI/CD:

- `.github/workflows/ci.yml`
- `deploy/deploy-backend.sh`
- `deploy/iqms-backend.service`
- `deploy/BACKEND_SECRETS.md`
- `CODEX_BACKEND_CICD_PROMPT.md`
- `CI_CD_BACKEND.md`

What changed:

- Added a GitHub Actions `deploy-backend` job.
- The job builds `backend/target/iqms-backend-0.0.1-SNAPSHOT.jar`.
- The job deploys the JAR to `/opt/iqms-backend/iqms-backend.jar`.
- The job restarts `iqms-backend` through systemd.
- The job verifies readiness with `http://localhost:8080/api/health`.
- Added a manual backend deploy script for the same systemd/JAR path.
- Added a systemd unit template and backend secrets/server setup documentation.

Docker impact:

- No backend Docker image behavior changed.
- No Compose service behavior changed.
- Docker remains available for local or container-based deployment.
- Production backend CI/CD now targets systemd/JAR by default.
