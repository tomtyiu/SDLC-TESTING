# Requirements

## User story
> As a user I want to view real time weather data for my city so that I can plan my day.

## Functional requirements

| ID | Requirement | Acceptance criterion |
| --- | --- | --- |
| F1 | User can search for a city by name. | Typing 2+ characters in the search box returns up to 5 matching locations within 1 s on a warm cache. |
| F2 | User can select a city to view its weather. | Selecting a result displays current conditions and a 7-day forecast for that location. |
| F3 | Current conditions show temperature, apparent temperature, humidity, wind, and a human-readable condition. | The card renders all five fields with correct units (°C, %, km/h). |
| F4 | Forecast shows daily high/low and condition for the next 7 days. | The list renders 7 day rows including today, ordered ascending by date. |
| F5 | Errors are surfaced to the user without crashing the page. | Network errors and empty geocode results show a friendly message and let the user retry. |
| F6 | The page has no client-side API key. | `grep -r OPENMETEO_API_KEY` returns nothing in client bundles; Open-Meteo requires no key. |

## Non-functional requirements

| ID | Requirement |
| --- | --- |
| N1 | App is server-rendered Next.js (App Router) + TypeScript, Node 22+. |
| N2 | All upstream calls happen from server route handlers, never from the browser. |
| N3 | API responses set `Cache-Control: public, s-maxage=600, stale-while-revalidate=3600` for geocode and `s-maxage=300` for weather. |
| N4 | Lighthouse: page is interactive in under 2 s on a fast 3G profile against a local build. |
| N5 | The page works without JavaScript for the initial render of the search box (progressive enhancement). |

## Security requirements

| ID | Requirement |
| --- | --- |
| S1 | Untrusted input (city query, lat/lon) is validated with zod on the server before being forwarded upstream. |
| S2 | Latitude is constrained to [-90, 90]; longitude to [-180, 180]; query length to 1..100. |
| S3 | Upstream errors are mapped to generic 502 responses; raw upstream payloads are never relayed verbatim on error. |
| S4 | No secrets are required; if any are added later they live in env vars and never in client code. |
| S5 | Responses set `X-Content-Type-Options: nosniff` and JSON content type; HTML output uses default Next.js escaping. |
| S6 | No user input is interpolated into HTML, shell commands, file paths, or DB queries. |
| S7 | Outbound fetches set a 5 s timeout to bound resource usage and prevent slow-loris-style upstream stalls. |

## Out of scope (deferred)

- Authenticated users / saved cities.
- Push notifications, severe-weather alerts.
- Historical weather, radar tiles.
- Multi-language, locale-specific units (assume metric for v1; add toggle later).
- Rate limiting per IP (relying on upstream and platform protections for v1).
