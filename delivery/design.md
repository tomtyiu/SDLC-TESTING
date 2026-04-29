# Design

## Architecture

```
[Browser]  ──HTTPS──▢  [Next.js server (route handlers)]  ──HTTPS──▢  [Open-Meteo]
                            β”‚                                      (geocoding + forecast)
                            └── server-rendered React (App Router)
```

Single Next.js application. Route handlers under `app/api/*` are the only callers of Open-Meteo. The browser only ever talks to our own origin.

## Components

| Component | Responsibility |
| --- | --- |
| `app/page.tsx` | Server component shell + client island for the search experience. |
| `components/SearchBox.tsx` | Client component. Debounced autocomplete, calls `/api/geocode`. |
| `components/WeatherDisplay.tsx` | Client component. Renders current + forecast from `/api/weather`. |
| `app/api/geocode/route.ts` | Validates `q`, proxies to Open-Meteo geocoding-api, normalizes response. |
| `app/api/weather/route.ts` | Validates `lat`/`lon`/`name`, proxies to Open-Meteo forecast endpoint, normalizes response. |
| `lib/openMeteo.ts` | Pure server functions: `geocode`, `forecast`. Bounded fetch with timeout. |
| `lib/schemas.ts` | zod schemas for query validation, response shape parsing. |
| `lib/wmo.ts` | WMO weather code β†’ human-readable string + icon hint. |

## Data flow

1. User types β†’ `SearchBox` debounces 250 ms β†’ `GET /api/geocode?q=<query>`.
2. Server validates query, calls `https://geocoding-api.open-meteo.com/v1/search?name=<q>&count=5&language=en&format=json`.
3. Server returns `[{ id, name, country, lat, lon, admin1 }]`.
4. User clicks a result β†’ `WeatherDisplay` calls `GET /api/weather?lat=..&lon=..&name=..`.
5. Server validates coords, calls `https://api.open-meteo.com/v1/forecast?latitude=..&longitude=..&current=...&daily=...&timezone=auto`.
6. Server returns `{ location, current, daily[] }`.
7. Browser renders.

## Trust boundaries

- **Browser β†’ our server**: untrusted. Validate every query parameter, length-limit strings, range-check numbers.
- **Our server β†’ Open-Meteo**: assumed honest but unreliable. Bound the fetch with timeout, treat 5xx as 502 from us, never echo upstream JSON to the user on error.
- **Our server β†’ browser**: only return the normalized shape we control; we never pass through unmodelled fields.

## Failure modes

| Failure | Behavior |
| --- | --- |
| Open-Meteo timeout | Server returns 504 with `{ error: "weather_timeout" }`. UI shows "Couldn't reach weather service. Try again." |
| Open-Meteo 5xx | Server returns 502 with `{ error: "weather_unavailable" }`. UI shows same retry message. |
| Geocode no results | Server returns 200 with `[]`. UI shows "No matches β€” try a different spelling." |
| Invalid query (zod fails) | Server returns 400 with `{ error: "invalid_request" }`. UI hides the dropdown. |
| Client offline | `fetch` throws β†’ UI shows offline banner. |

## Observability

- Each route handler logs `{ route, status, durationMs, upstreamStatus }` (no PII; query is logged truncated to 32 chars).
- Errors logged at `error` level with stable error codes (`weather_timeout`, `weather_unavailable`, `invalid_request`).
- For local dev these go to stdout. Vercel surfaces them in the platform log; if self-hosting, pipe to your logger of choice.

## Rollout / rollback

- This is the initial feature β€” no flag required since the previous behavior was a static README.
- Rollback is `git revert` of the merge commit. There is no schema, no persistent state, no migration.
- If Open-Meteo becomes unavailable in production, the page degrades gracefully (error card) rather than crashing.

## Why these choices

- **Open-Meteo over OpenWeatherMap**: no API key, no secret to provision, faster path to production.
- **App Router + route handlers**: keeps everything in one deployable, hides the upstream from the client.
- **zod**: small, well-known, gives us TypeScript inference and runtime validation in one place.
- **No DB**: for v1, weather is read-only and cacheable at the CDN. Adding state can come with auth later.
