# Production runbook

## Service summary
Single Next.js application. Stateless. Calls Open-Meteo (https://open-meteo.com) via two server route handlers. No database, no secrets.

## Deploy

### Vercel (recommended)
1. Import the repo into Vercel.
2. Framework preset: Next.js (auto-detected).
3. No env vars required.
4. Deploy. Vercel runs `next build` then serves.

### Self-host
```sh
git clone https://github.com/AIEpisteme/SDLC-test.git
cd SDLC-test
npm ci
npm run build
PORT=3000 npm start
```
Reverse-proxy with TLS in front (nginx, Caddy, or platform-managed).

## Health checks
- `GET /` β†’ 200 HTML.
- `GET /api/geocode?q=London` β†’ 200 JSON, array length >= 1.
- `GET /api/weather?lat=51.5074&lon=-0.1278&name=London` β†’ 200 JSON with `current` and 7 `daily` entries.

## Common incidents

### Weather page shows "Couldn't reach weather service"
1. `curl https://api.open-meteo.com/v1/forecast?latitude=0&longitude=0&current=temperature_2m` from the host. If this fails, Open-Meteo is the issue β€” degraded UX is expected; no action on our side.
2. If only our service is failing, check egress (DNS, firewall) and the 5 s fetch timeout in `lib/openMeteo.ts`.

### Geocode returns 400 unexpectedly
1. Check the client request: `q` length must be 1..100 characters. Anything else is correctly rejected.
2. If a legitimate long city name is being rejected, raise the limit in `lib/schemas.ts`.

### High latency on `/api/weather`
1. Cache headers should give edge HIT in production. Verify `Cache-Control` on the response.
2. If upstream is slow, the 5 s timeout will surface a 504; consider raising to 8 s in `lib/openMeteo.ts` only if Open-Meteo is genuinely the bottleneck.

## Rollback
`git revert <merge-sha>` on `main`, push, redeploy. No data to migrate.

## Contact
This is a demo / SDLC test app. No on-call. File issues at https://github.com/AIEpisteme/SDLC-test/issues.
