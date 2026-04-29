// Test-time replacement for the `server-only` marker package.
// In production Next.js bundles this package would throw if pulled into a
// client bundle; in vitest we just no-op so route handler tests can import
// server modules.
export {};
