# Backend Troubleshooting and Fixes Report

## Problem Observed
The frontend application was unable to reach the authentication server at `http://localhost:8080/api/auth/google`.
- The browser console showed network errors.
- Testing with `curl` revealed a `403 Forbidden` on the `OPTIONS` preflight request, indicating a CORS (Cross-Origin Resource Sharing) misconfiguration. The message was `Invalid CORS request`.

## Investigation and Actions Taken

### 1. CORS Configuration (The Real Fix)
The backend was defining a `CorsConfigurationSource` bean in `CorsConfig.java`. However, since the project does not use `spring-boot-starter-security` (only `spring-security-crypto`), Spring MVC does not automatically use that bean for CORS resolution by default.

**Action Taken:**
I modified `CorsConfig.java` to return a `CorsFilter` bean instead of `CorsConfigurationSource`. Spring Boot automatically registers `CorsFilter` beans with the servlet container, enabling CORS support even without Spring Security.
```java
@Bean
public org.springframework.web.filter.CorsFilter corsFilter() {
    // ... config setup ...
    return new org.springframework.web.filter.CorsFilter(source);
}
```
I also verified that passing `-Dapp.cors.allowed-origins=http://localhost:5172,http://localhost:5173,http://localhost:8080` correctly configures the allowed origins. Tests now return `200 OK` for preflight requests from `http://localhost:5172`.

### 2. Backend Crash on Restart (Compilation Error)
When attempting to restart the backend to apply changes, the application failed to start with a `java.lang.NoClassDefFoundError: Sheet` in `CreatorDiscoveryService.java`.

**Investigation:**
The file `Sheet.java` was located in `src/main/java/com/iqms/backend/sheet/Sheet.java` but declared the package `package com.iqms.backend.model;`. This mismatch confused the compiler.

**Action Taken:**
Moved `Sheet.java` from `src/main/java/com/iqms/backend/sheet/Sheet.java` to `src/main/java/com/iqms/backend/model/Sheet.java` to align with its package declaration. The project now builds and runs successfully.

## Current Status
- **Backend**: Running on port 8080.
- **CORS Issue**: Resolved. Preflight requests from `http://localhost:5172` are now allowed.

## Latest Local Smoke Test — 2026-05-18

The backend was also tested on alternate port `8091` while the frontend ran on `5174`.

Command shape used:

```bash
cd backend
JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home \
APP_AUTH_SECRET="dev-only-change-me-for-ui-test" \
MONGO_STARTUP_PING_ENABLED=false \
APP_CORS_ALLOWED_ORIGINS="http://localhost:5174,http://127.0.0.1:5174" \
mvn spring-boot:run -Dspring-boot.run.profiles=dev -Dspring-boot.run.arguments="--server.port=8091"
```

CORS verification:

```bash
curl -i -X OPTIONS http://127.0.0.1:8091/api/auth/login \
  -H 'Origin: http://127.0.0.1:5174' \
  -H 'Access-Control-Request-Method: POST'
```

Result: `HTTP/1.1 200` with `Access-Control-Allow-Origin: http://127.0.0.1:5174`.

### Stale Compiled Classes Note

During alternate-port backend startup, Spring detected duplicate bean names from stale compiled classes under `backend/target/classes/com/iqms/backend/sheet/` after source packages had moved to `com.iqms.backend.controller`, `service`, and `repository`.

Resolution used for the smoke test:

```bash
rm -rf backend/target/classes/com/iqms/backend/sheet
```

This removed only generated build output. If this happens again, prefer a clean build (`mvn clean ...`) or removing stale generated classes instead of changing source packages to match old artifacts.

---
Report generated on 2026-05-18.
