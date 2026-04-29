import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { forecast, geocode, UpstreamError } from './openMeteo';

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
    time: [
      '2026-04-29',
      '2026-04-30',
      '2026-05-01',
      '2026-05-02',
      '2026-05-03',
      '2026-05-04',
      '2026-05-05',
    ],
    weather_code: [3, 61, 1, 2, 0, 80, 95],
    temperature_2m_max: [16, 14, 18, 19, 21, 17, 15],
    temperature_2m_min: [9, 8, 11, 12, 13, 10, 9],
    precipitation_probability_max: [10, 80, 5, 15, 0, 60, 90],
  },
};

const GEOCODE_FIXTURE = {
  results: [
    {
      id: 2643743,
      name: 'London',
      latitude: 51.5085,
      longitude: -0.12574,
      country: 'United Kingdom',
      country_code: 'GB',
      admin1: 'England',
      timezone: 'Europe/London',
    },
  ],
};

describe('geocode', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes Open-Meteo fields', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify(GEOCODE_FIXTURE), { status: 200 }),
      ),
    );
    const out = await geocode('London');
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      id: 2643743,
      name: 'London',
      country: 'United Kingdom',
      countryCode: 'GB',
      admin1: 'England',
    });
  });

  it('returns [] when no results', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({}), { status: 200 })),
    );
    expect(await geocode('zzqxq')).toEqual([]);
  });

  it('throws UpstreamError on 5xx', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('boom', { status: 503 })),
    );
    await expect(geocode('London')).rejects.toBeInstanceOf(UpstreamError);
  });

  it('throws UpstreamError(timeout) on AbortError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        const err = new Error('aborted');
        err.name = 'AbortError';
        throw err;
      }),
    );
    await expect(geocode('London', { timeoutMs: 1 })).rejects.toMatchObject({
      code: 'timeout',
    });
  });
});

describe('forecast', () => {
  afterEach(() => vi.restoreAllMocks());

  it('parses current + 7 daily entries', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify(FORECAST_FIXTURE), { status: 200 }),
      ),
    );
    const out = await forecast(51.5, -0.12);
    expect(out.daily).toHaveLength(7);
    expect(out.current.temperatureC).toBe(14.2);
    expect(out.current.humidity).toBe(65);
    expect(out.current.isDay).toBe(true);
    expect(out.daily[0].precipitationProbabilityMax).toBe(10);
  });

  it('throws on malformed payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ nope: true }), { status: 200 })),
    );
    await expect(forecast(0, 0)).rejects.toBeInstanceOf(UpstreamError);
  });
});
