#!/usr/bin/env bash
set -euo pipefail

# Bundles every function directory in supabase/functions into a .eszip using
# the supabase edge runtime bundle tool (edge-runtime must be available).
# Usage: ./scripts/bundle-all.sh

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FN_DIR="$ROOT_DIR/supabase/functions"

if [ ! -d "$FN_DIR" ]; then
  echo "supabase/functions directory not found" >&2
  exit 1
fi

echo "Bundling functions in $FN_DIR"

for d in "$FN_DIR"/*/ ; do
  [ -d "$d" ] || continue
  name=$(basename "$d")
  out="$FN_DIR/$name.eszip"
  echo "- Bundling $name -> $out"
  docker run --rm -v "$FN_DIR":/work -w /work supabase/edge-runtime:latest bundle "$name" -o "$out"
done

echo "All functions bundled"
