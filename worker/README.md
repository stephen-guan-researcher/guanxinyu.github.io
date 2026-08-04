# Xinyu Agent Worker

This Cloudflare Worker exposes `POST /api/chat` for the homepage's Xinyu Agent answer service. It uses Workers AI and a Rate Limiting binding; if the endpoint is unavailable, the static site reports that the live model is unavailable instead of presenting a scripted answer. Requests must use an exact `application/json` media type and are capped at 16 KiB before JSON parsing; the `question` field is separately limited to 1–300 trimmed characters.

## Deploy

1. Authenticate with the account that owns the Worker:

   ```bash
   cd worker
   npx wrangler deploy
   ```

2. Copy the deployed `https://...workers.dev/api/chat` URL into the homepage's `<meta name="xinyu-agent-api" content="...">` tag.

3. Verify the deployed endpoint from an approved homepage origin.

Never commit Wrangler credentials, Cloudflare API tokens, or any model credential. The Worker receives its AI and rate-limit bindings from `wrangler.jsonc`.
