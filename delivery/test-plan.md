# Test plan

## Validation layers

| Layer | Tool | What it covers |
| --- | --- | --- |
| Static | `tsc --noEmit`, `next lint` | Type errors, lint rules. |
| Unit | Vitest | `lib/openMeteo`, `lib/schemas`, `lib/wmo`. |
| Integration | Vitest + mocked fetch | Route handlers `/api/geocode`, `/api/weather`. |
| Component | Vitest + Testing Library | `SearchBox` happy path + error path. |
| Build | `next build` | Production bundle compiles cleanly. |
| Smoke | Manual `curl` against `next dev` | End-to-end search β†’ weather flow. |

## Requirement coverage

| Requirement | Test |
| --- | --- |
| F1 search returns matches | `app/api/geocode/route.test.ts: returns normalized list` |
| F2 selecting shows weather | `app/api/weather/route.test.ts: returns current + daily` + `SearchBox.test.tsx: select fires onSelect` |
| F3 current conditions fields | `lib/openMeteo.test.ts: parses current block` |
| F4 7-day forecast | `lib/openMeteo.test.ts: parses 7 daily entries` |
| F5 error UX | `SearchBox.test.tsx: shows retry on fetch failure` |
| F6 no client API key | grep check (`lib/openMeteo.ts` is server-only) |
| S1, S2 input validation | `lib/schemas.test.ts: rejects out-of-range lat/lon` |
| S3 upstream error mapping | `app/api/weather/route.test.ts: upstream 500 β†’ 502` |
| S7 timeout | `lib/openMeteo.test.ts: aborts after configured timeout` |

## Run

```sh
npm install
npm run typecheck
npm run lint
npm test
npm run build
```
