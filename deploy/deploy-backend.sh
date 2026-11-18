#!/usr/bin/env bash
set -euo pipefail

JAR_PATH="${JAR_PATH:-backend/target/iqms-backend-0.0.1-SNAPSHOT.jar}"
DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
REMOTE_DIR="${REMOTE_DIR:-/opt/iqms-backend}"
SERVICE_NAME="${SERVICE_NAME:-iqms-backend}"
HEALTH_URL="${HEALTH_URL:-http://localhost:8080/api/health}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-18}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

if [ -z "$DEPLOY_HOST" ]; then
  echo "ERROR: DEPLOY_HOST is required."
  echo "Example: DEPLOY_HOST=example.com DEPLOY_USER=deploy ./deploy/deploy-backend.sh"
  exit 1
fi

if [ ! -f "$JAR_PATH" ]; then
  echo "ERROR: backend JAR not found at $JAR_PATH"
  echo "Build it first: mvn -f backend/pom.xml clean package -DskipTests"
  exit 1
fi

echo "Starting backend deployment at $TIMESTAMP"
echo "JAR: $(du -sh "$JAR_PATH" | cut -f1) $JAR_PATH"
echo "Target: $DEPLOY_USER@$DEPLOY_HOST:$REMOTE_DIR/iqms-backend.jar"
echo "Service: $SERVICE_NAME"

echo "Verifying remote backend directory..."
ssh "$DEPLOY_USER@$DEPLOY_HOST" \
  "test -d '$REMOTE_DIR' || { echo 'Missing $REMOTE_DIR. Create it during server setup.'; exit 1; }"

echo "Backing up current backend JAR..."
ssh "$DEPLOY_USER@$DEPLOY_HOST" "
  set -e
  if [ -f '$REMOTE_DIR/iqms-backend.jar' ]; then
    cp -a '$REMOTE_DIR/iqms-backend.jar' '$REMOTE_DIR/iqms-backend.jar.backup.$TIMESTAMP'
    echo 'Backup saved to $REMOTE_DIR/iqms-backend.jar.backup.$TIMESTAMP'
  else
    echo 'No existing backend JAR to back up.'
  fi
"

echo "Uploading backend JAR..."
rsync \
  --archive \
  --checksum \
  --compress \
  --verbose \
  "$JAR_PATH" \
  "$DEPLOY_USER@$DEPLOY_HOST:$REMOTE_DIR/iqms-backend.jar"

echo "Restarting $SERVICE_NAME..."
ssh "$DEPLOY_USER@$DEPLOY_HOST" "sudo systemctl restart '$SERVICE_NAME'"

echo "Waiting for backend health..."
for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
  if ssh "$DEPLOY_USER@$DEPLOY_HOST" "curl -fsS '$HEALTH_URL' >/dev/null"; then
    echo "Backend is healthy."
    echo "Backend deployment completed at $(date)"
    echo "Live health URL: https://www.createsheets.com/api/health"
    exit 0
  fi

  if [ "$attempt" -eq "$MAX_ATTEMPTS" ]; then
    echo "ERROR: backend did not become healthy within $((MAX_ATTEMPTS * 5)) seconds."
    ssh "$DEPLOY_USER@$DEPLOY_HOST" "sudo systemctl status '$SERVICE_NAME' --no-pager -l || true"
    ssh "$DEPLOY_USER@$DEPLOY_HOST" "sudo journalctl -u '$SERVICE_NAME' -n 80 --no-pager || true"
    exit 1
  fi

  echo "Attempt $attempt/$MAX_ATTEMPTS: backend not ready. Retrying in 5 seconds."
  sleep 5
done
