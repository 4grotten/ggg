#!/usr/bin/env bash
set -euo pipefail

# Deploy script that can run on CI or locally to deploy to a remote server via SSH.
# Requires DEPLOY_USER, DEPLOY_HOST, DEPLOY_PATH env variables or pass as args.
# Usage: DEPLOY_USER=user DEPLOY_HOST=host DEPLOY_PATH=/srv/easycard ./scripts/deploy.sh

DEPLOY_USER="${DEPLOY_USER:-}"
DEPLOY_HOST="${DEPLOY_HOST:-}"
DEPLOY_PATH="${DEPLOY_PATH:-}"

if [ -z "$DEPLOY_USER" ] || [ -z "$DEPLOY_HOST" ] || [ -z "$DEPLOY_PATH" ]; then
  echo "Set DEPLOY_USER, DEPLOY_HOST and DEPLOY_PATH before running."
  echo "Example: DEPLOY_USER=ubuntu DEPLOY_HOST=1.2.3.4 DEPLOY_PATH=/srv/easycard $0"
  exit 1
fi

echo "Deploying to $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH"

ssh "$DEPLOY_USER@$DEPLOY_HOST" bash -s <<'EOF'
set -euo pipefail
cd "$DEPLOY_PATH"
git pull || true
# Ensure .env exists on server (should be created manually or via CI)
if [ ! -f .env ]; then
  echo ".env not found at $DEPLOY_PATH/.env — create it with secrets before deploy" >&2
  exit 1
fi
docker compose -f docker/docker-compose.yml pull || true
docker compose -f docker/docker-compose.yml up -d --build
EOF

echo "Remote deploy finished"
