import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

afterEach(() => vi.restoreAllMocks());

describe('GET /api/geocode', () => {
  it('returns normalized list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            results: [
              {
                id: 1,
                name: 'Paris',
                latitude: 48.85,
                longitude: 2.35,
                country: 'France',
                country_code: 'FR',
                admin1: 'Γ‹le-de-France',
                timezone: 'Europe/Paris',
              },
            ],
          }),
          { status: 200 },
        ),
      ),
    );
    const res = await GET(
      new Request('http://localhost/api/geocode?q=Paris'),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { results: Array<{ name: string }> };
    expect(body.results[0].name).toBe('Paris');
  });

  it('returns 400 on empty q', async () => {
    const res = await GET(new Request('http://localhost/api/geocode?q='));
    expect(res.status).toBe(400);
  });

  it('returns 400 on missing q', async () => {
    const res = await GET(new Request('http://localhost/api/geocode'));
    expect(res.status).toBe(400);
  });
});
