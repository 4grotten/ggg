#!/usr/bin/env bash
set -euo pipefail

# Generate a .env from .env.example with random secrets where missing.
# Usage: ./scripts/generate-env.sh

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
EXAMPLE="$ROOT_DIR/.env.example"
OUT="$ROOT_DIR/.env"

if [ ! -f "$EXAMPLE" ]; then
  echo ".env.example not found" >&2
  exit 1
fi

cp "$EXAMPLE" "$OUT"

generate() {
  openssl rand -hex 32
}

# Append generated secrets if placeholders exist
if ! grep -q 'JWT_SECRET=' "$OUT"; then
  echo "JWT_SECRET=$(generate)" >> "$OUT"
fi

if ! grep -q 'SERVICE_KEY=' "$OUT"; then
  echo "SERVICE_KEY=changeme-$(generate)" >> "$OUT"
fi

if ! grep -q 'ANON_KEY=' "$OUT"; then
  echo "ANON_KEY=anon-$(generate)" >> "$OUT"
fi

echo "Generated $OUT (review before use)"
#!/usr/bin/env bash
set -euo pipefail

# Usage: scripts/generate-env.sh [--force]
# Copies .env.example -> .env and injects generated secrets if missing.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_EXAMPLE="$ROOT_DIR/.env.example"
ENV_FILE="$ROOT_DIR/.env"

FORCE=0
if [ "${1:-}" = "--force" ]; then
  FORCE=1
fi

if [ -f "$ENV_FILE" ] && [ $FORCE -eq 0 ]; then
  echo ".env already exists — use --force to overwrite"
  exit 0
fi

if [ ! -f "$ENV_EXAMPLE" ]; then
  echo "Missing $ENV_EXAMPLE. Create one first." >&2
  exit 1
fi

cp "$ENV_EXAMPLE" "$ENV_FILE"

# Generate random secrets and append (do not try to replace to keep edits simple)
JWT_SECRET=$(openssl rand -hex 32 || head -c32 /dev/urandom | xxd -p)
POSTGRES_PASSWORD=$(openssl rand -hex 16 || head -c16 /dev/urandom | xxd -p)

cat >> "$ENV_FILE" <<EOF
# --- generated values (edit as needed) ---
JWT_SECRET=$JWT_SECRET
ANON_KEY=anon_key_placeholder
SERVICE_KEY=service_key_placeholder
LOVABLE_API_KEY=lovable_key_placeholder
ELEVENLABS_API_KEY=elevenlabs_key_placeholder
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
REDIS_PASSWORD=redis_secure_password
API_EXTERNAL_URL=http://localhost
SITE_URL=http://localhost
EOF

echo "Generated $ENV_FILE with placeholders. Update real keys before deploying."
