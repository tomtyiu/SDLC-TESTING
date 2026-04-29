# Search city with 7 day forecast
## SDLC-test using AI SDLC application

> As a user I want to view real time weather data for my city so that I can plan my day.

A small full-stack Next.js app that lets you search for any city in the world and see current conditions plus a 7-day forecast. Backed by [Open-Meteo](https://open-meteo.com/) — no API key, no signup.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript 5**
- **Tailwind CSS 3** for styling
- **Zod** for runtime input validation
- **Vitest** + **Testing Library** for tests
- Server route handlers proxy Open-Meteo so no upstream credentials live in the browser

## Getting started

```sh
npm install
npm run dev
# open http://localhost:3000
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server with HMR. |
| `npm run build` | Production build. |
| `npm start` | Run the production build. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm run lint` | `next lint`. |
| `npm test` | Run all Vitest suites once. |
| `npm run test:watch` | Watch mode. |

## Architecture

```
[Browser]  ──HTTPS──▶  [Next.js routes]  ──HTTPS──▶  [Open-Meteo]
            │ /api/geocode → city search
            └─ /api/weather → current + 7-day forecast
```

See [`delivery/design.md`](./delivery/design.md) for components, data flow, trust boundaries, and rollback strategy.

## Documentation

Full delivery artifacts live under [`delivery/`](./delivery/):

- [`requirements.md`](./delivery/requirements.md) — what the feature must do, with acceptance criteria.
- [`design.md`](./delivery/design.md) — architecture and security thinking.
- [`test-plan.md`](./delivery/test-plan.md) — validation matrix.
- [`release-checklist.md`](./delivery/release-checklist.md) — pre-merge and post-deploy gates.
- [`production-runbook.md`](./delivery/production-runbook.md) — deploy, verify, observe, roll back.

## Attribution

Weather data by [Open-Meteo](https://open-meteo.com/). Used under their free-tier terms.
