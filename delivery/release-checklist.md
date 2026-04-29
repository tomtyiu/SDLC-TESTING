# Release checklist

## Pre-merge gates
- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes.
- [ ] `npm test` passes (all suites).
- [ ] `npm run build` succeeds with no warnings about missing peer deps or unsupported APIs.
- [ ] Manual smoke: search "London", select first result, current + 7-day forecast renders.
- [ ] Manual smoke: search a nonsense string ("zzqxq"), see empty-results message, no crash.
- [ ] No secret values committed. `.env*` files are git-ignored (none required for Open-Meteo).
- [ ] PR description includes summary, validation evidence, rollback plan.

## Deploy
- [ ] Merge PR to `main`.
- [ ] If hosted on Vercel: a fresh deploy is triggered automatically.
- [ ] If hosted elsewhere: `npm ci && npm run build && npm start` on Node 22+.
- [ ] Confirm deployed URL responds 200 on `/`.

## Post-deploy verification
- [ ] `/api/geocode?q=London` returns >= 1 result.
- [ ] `/api/weather?lat=51.5074&lon=-0.1278&name=London` returns shape `{ location, current, daily[] }` with 7 daily entries.
- [ ] Browser smoke: search + select renders with no console errors.
- [ ] No 5xx in platform logs in the 5 minutes after deploy.

## Rollback
- `git revert <merge-sha>` and re-deploy. There is no data migration to undo.
