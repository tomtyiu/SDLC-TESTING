import { z } from 'zod';

/**
 * All inputs from the browser are validated through these schemas before
 * we ever forward them to Open-Meteo or render them. Keep the limits tight β€”
 * Open-Meteo will accept much more, but we don't need to.
 */

export const geocodeQuery = z.object({
  q: z.string().trim().min(1).max(100),
});

export const weatherQuery = z.object({
  lat: z.coerce.number().finite().gte(-90).lte(90),
  lon: z.coerce.number().finite().gte(-180).lte(180),
  name: z.string().trim().min(1).max(120).optional(),
});

export type GeocodeQuery = z.infer<typeof geocodeQuery>;
export type WeatherQuery = z.infer<typeof weatherQuery>;

/**
 * Open-Meteo response shapes. We only validate the fields we actually use
 * so a benign upstream addition does not break us.
 */

export const openMeteoGeocodeItem = z.object({
  id: z.number(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  country: z.string().optional(),
  country_code: z.string().optional(),
  admin1: z.string().optional(),
  timezone: z.string().optional(),
});

export const openMeteoGeocodeResponse = z.object({
  results: z.array(openMeteoGeocodeItem).optional(),
});

export const openMeteoForecastResponse = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
  current: z.object({
    time: z.string(),
    temperature_2m: z.number(),
    apparent_temperature: z.number(),
    relative_humidity_2m: z.number(),
    wind_speed_10m: z.number(),
    weather_code: z.number(),
    is_day: z.number(),
  }),
  daily: z.object({
    time: z.array(z.string()),
    weather_code: z.array(z.number()),
    temperature_2m_max: z.array(z.number()),
    temperature_2m_min: z.array(z.number()),
    precipitation_probability_max: z.array(z.number()).optional(),
  }),
});
