#!/usr/bin/env bash
set -euo pipefail

DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
DEPLOY_DIR="${DEPLOY_DIR:-/var/www/createsheets-frontend}"
DIST_DIR="${DIST_DIR:-$(pwd)/dist}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

if [ -z "$DEPLOY_HOST" ]; then
  echo "ERROR: DEPLOY_HOST is required."
  echo "Example: DEPLOY_HOST=example.com DEPLOY_USER=deploy ./deploy/deploy-frontend.sh"
  exit 1
fi

if [ ! -f "$DIST_DIR/index.html" ]; then
  echo "ERROR: $DIST_DIR/index.html was not found."
  echo "Run npm run build from the frontend project root, then try again."
  exit 1
fi

echo "Starting frontend deployment at $TIMESTAMP"
echo "Source: $DIST_DIR"
echo "Target: $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_DIR/dist"

echo "Preparing backup on server..."
ssh "$DEPLOY_USER@$DEPLOY_HOST" "
  set -e
  mkdir -p '$DEPLOY_DIR'
  if [ -d '$DEPLOY_DIR/dist' ]; then
    cp -a '$DEPLOY_DIR/dist' '$DEPLOY_DIR/dist.backup.$TIMESTAMP'
    echo 'Backup saved to $DEPLOY_DIR/dist.backup.$TIMESTAMP'
  else
    echo 'No existing dist directory found. Skipping backup.'
  fi
"

echo "Syncing frontend build..."
rsync \
  --archive \
  --delete \
  --checksum \
  --compress \
  --verbose \
  "$DIST_DIR/" \
  "$DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_DIR/dist/"

echo "Validating and reloading Nginx..."
ssh "$DEPLOY_USER@$DEPLOY_HOST" "sudo nginx -t && sudo nginx -s reload"

echo "Frontend deployment completed at $(date)"
echo "Live URL: https://www.createsheets.com"
