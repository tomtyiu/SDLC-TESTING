import 'server-only';
import {
  openMeteoForecastResponse,
  openMeteoGeocodeResponse,
} from './schemas';

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const DEFAULT_TIMEOUT_MS = 5_000;

export class UpstreamError extends Error {
  constructor(
    message: string,
    public readonly code: 'timeout' | 'unavailable' | 'bad_response',
    public readonly upstreamStatus?: number,
  ) {
    super(message);
    this.name = 'UpstreamError';
  }
}

async function fetchJson(
  url: string,
  { timeoutMs = DEFAULT_TIMEOUT_MS }: { timeoutMs?: number } = {},
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
    if (!res.ok) {
      throw new UpstreamError(
        `Upstream returned ${res.status}`,
        'unavailable',
        res.status,
      );
    }
    return (await res.json()) as unknown;
  } catch (err) {
    if (err instanceof UpstreamError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new UpstreamError('Upstream timed out', 'timeout');
    }
    throw new UpstreamError('Upstream fetch failed', 'unavailable');
  } finally {
    clearTimeout(timer);
  }
}

export interface GeocodeResult {
  id: number;
  name: string;
  country?: string;
  countryCode?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export async function geocode(
  q: string,
  opts?: { timeoutMs?: number },
): Promise<GeocodeResult[]> {
  const url = new URL(GEOCODE_URL);
  url.searchParams.set('name', q);
  url.searchParams.set('count', '5');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');
  const raw = await fetchJson(url.toString(), opts);
  const parsed = openMeteoGeocodeResponse.safeParse(raw);
  if (!parsed.success) {
    throw new UpstreamError('Bad geocode response', 'bad_response');
  }
  return (parsed.data.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    country: r.country,
    countryCode: r.country_code,
    admin1: r.admin1,
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone,
  }));
}

export interface ForecastDay {
  date: string;
  weatherCode: number;
  tempMaxC: number;
  tempMinC: number;
  precipitationProbabilityMax: number | null;
}

export interface ForecastResponse {
  location: { latitude: number; longitude: number; timezone: string };
  current: {
    time: string;
    temperatureC: number;
    apparentTemperatureC: number;
    humidity: number;
    windKmh: number;
    weatherCode: number;
    isDay: boolean;
  };
  daily: ForecastDay[];
}

export async function forecast(
  lat: number,
  lon: number,
  opts?: { timeoutMs?: number },
): Promise<ForecastResponse> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set(
    'current',
    [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'wind_speed_10m',
      'weather_code',
      'is_day',
    ].join(','),
  );
  url.searchParams.set(
    'daily',
    [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
    ].join(','),
  );
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '7');

  const raw = await fetchJson(url.toString(), opts);
  const parsed = openMeteoForecastResponse.safeParse(raw);
  if (!parsed.success) {
    throw new UpstreamError('Bad forecast response', 'bad_response');
  }
  const d = parsed.data;
  const days: ForecastDay[] = d.daily.time.map((date, i) => ({
    date,
    weatherCode: d.daily.weather_code[i] ?? 0,
    tempMaxC: d.daily.temperature_2m_max[i] ?? 0,
    tempMinC: d.daily.temperature_2m_min[i] ?? 0,
    precipitationProbabilityMax:
      d.daily.precipitation_probability_max?.[i] ?? null,
  }));
  return {
    location: {
      latitude: d.latitude,
      longitude: d.longitude,
      timezone: d.timezone,
    },
    current: {
      time: d.current.time,
      temperatureC: d.current.temperature_2m,
      apparentTemperatureC: d.current.apparent_temperature,
      humidity: d.current.relative_humidity_2m,
      windKmh: d.current.wind_speed_10m,
      weatherCode: d.current.weather_code,
      isDay: d.current.is_day === 1,
    },
    daily: days,
  };
}
