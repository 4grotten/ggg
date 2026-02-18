This folder contains helper scripts to prepare and deploy the project.

- `bundle-all.sh` — bundles all supabase functions into `.eszip` files using the `supabase/edge-runtime` image.
- `generate-env.sh` — creates a `.env` from `.env.example` and fills in generated secrets.
- `deploy.sh` — simple SSH-based deploy helper which pulls repo and runs `docker compose up -d --build` on the remote host.

Usage examples:

1. Generate a local `.env`:

```bash
./scripts/generate-env.sh
```

2. Bundle functions:

```bash
./scripts/bundle-all.sh
```

3. Deploy to remote server (ensure DEPLOY_* env vars are set):

```bash
DEPLOY_USER=ubuntu DEPLOY_HOST=1.2.3.4 DEPLOY_PATH=/srv/easycard ./scripts/deploy.sh
```
