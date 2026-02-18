#!/usr/bin/env bash
set -euo pipefail

# Build frontend image and optionally push to registry.
# Usage: scripts/build-and-push.sh [--tag TAG] [--registry registry.example.com]

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TAG="${1:-latest}"
REGISTRY="${2:-}"

IMAGE_NAME="easycard_app"
if [ -n "$REGISTRY" ]; then
  FULL_NAME="$REGISTRY/$IMAGE_NAME:$TAG"
else
  FULL_NAME="$IMAGE_NAME:$TAG"
fi

echo "Building frontend image: $FULL_NAME"
docker build -t "$FULL_NAME" "$ROOT_DIR"

if [ -n "$REGISTRY" ]; then
  echo "Pushing $FULL_NAME to registry"
  docker push "$FULL_NAME"
fi

echo "Done"
