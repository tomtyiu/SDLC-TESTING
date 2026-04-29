import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const FORECAST_FIXTURE = {
  latitude: 51.5,
  longitude: -0.12,
  timezone: 'Europe/London',
  current: {
    time: '2026-04-29T10:00',
    temperature_2m: 14.2,
    apparent_temperature: 12.8,
    relative_humidity_2m: 65,
    wind_speed_10m: 12.0,
    weather_code: 3,
    is_day: 1,
  },
  daily: {
    time: ['2026-04-29', '2026-04-30', '2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', '2026-05-05'],
    weather_code: [3, 61, 1, 2, 0, 80, 95],
    temperature_2m_max: [16, 14, 18, 19, 21, 17, 15],
    temperature_2m_min: [9, 8, 11, 12, 13, 10, 9],
    precipitation_probability_max: [10, 80, 5, 15, 0, 60, 90],
  },
};

afterEach(() => vi.restoreAllMocks());

describe('GET /api/weather', () => {
  it('returns shaped data for valid input', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify(FORECAST_FIXTURE), { status: 200 }),
      ),
    );
    const res = await GET(
      new Request('http://localhost/api/weather?lat=51.5&lon=-0.12&name=London'),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      location: { name: string };
      current: { temperatureC: number };
      daily: unknown[];
    };
    expect(body.location.name).toBe('London');
    expect(body.current.temperatureC).toBe(14.2);
    expect(body.daily).toHaveLength(7);
  });

  it('returns 400 on invalid lat', async () => {
    const res = await GET(
      new Request('http://localhost/api/weather?lat=999&lon=0'),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 on missing lat/lon', async () => {
    const res = await GET(new Request('http://localhost/api/weather'));
    expect(res.status).toBe(400);
  });

  it('maps upstream 500 to 502', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('boom', { status: 500 })),
    );
    const res = await GET(
      new Request('http://localhost/api/weather?lat=0&lon=0'),
    );
    expect(res.status).toBe(502);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('weather_unavailable');
  });

  it('maps upstream timeout to 504', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        const err = new Error('aborted');
        err.name = 'AbortError';
        throw err;
      }),
    );
    const res = await GET(
      new Request('http://localhost/api/weather?lat=0&lon=0'),
    );
    expect(res.status).toBe(504);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe('weather_timeout');
  });
});
