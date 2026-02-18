#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FUNCTIONS_DIR="$ROOT_DIR/supabase/functions"

echo "Bundling Supabase Edge functions in: $FUNCTIONS_DIR"
cd "$FUNCTIONS_DIR"

for d in */ ; do
  if [ -f "$d/index.ts" ] || [ -f "$d/index.js" ]; then
    name="${d%/}"
    echo "- Bundling: $name"
    docker run --rm -v "$FUNCTIONS_DIR":/src supabase/edge-runtime:v1.67.4 \
      bundle --entrypoint /src/$name/index.ts --output /src/$name.eszip
  else
    echo "- Skipping $d (no index.ts/js)"
  fi
done

echo "All functions bundled. .eszip files are in $FUNCTIONS_DIR"
