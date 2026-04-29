import { describe, expect, it } from 'vitest';
import { geocodeQuery, weatherQuery } from './schemas';

describe('geocodeQuery', () => {
  it('accepts a normal city name', () => {
    expect(geocodeQuery.parse({ q: 'London' }).q).toBe('London');
  });

  it('trims whitespace', () => {
    expect(geocodeQuery.parse({ q: '  Paris  ' }).q).toBe('Paris');
  });

  it('rejects empty queries', () => {
    expect(geocodeQuery.safeParse({ q: '' }).success).toBe(false);
    expect(geocodeQuery.safeParse({ q: '   ' }).success).toBe(false);
  });

  it('rejects queries longer than 100 chars', () => {
    expect(geocodeQuery.safeParse({ q: 'x'.repeat(101) }).success).toBe(false);
  });
});

describe('weatherQuery', () => {
  it('coerces numeric strings', () => {
    const parsed = weatherQuery.parse({ lat: '51.5', lon: '-0.12' });
    expect(parsed.lat).toBe(51.5);
    expect(parsed.lon).toBe(-0.12);
  });

  it('rejects out-of-range latitude', () => {
    expect(weatherQuery.safeParse({ lat: '91', lon: '0' }).success).toBe(false);
    expect(weatherQuery.safeParse({ lat: '-91', lon: '0' }).success).toBe(false);
  });

  it('rejects out-of-range longitude', () => {
    expect(weatherQuery.safeParse({ lat: '0', lon: '181' }).success).toBe(false);
    expect(weatherQuery.safeParse({ lat: '0', lon: '-181' }).success).toBe(false);
  });

  it('rejects non-numeric input', () => {
    expect(weatherQuery.safeParse({ lat: 'abc', lon: '0' }).success).toBe(false);
  });

  it('accepts optional name and trims it', () => {
    const parsed = weatherQuery.parse({ lat: '0', lon: '0', name: '  Lagos ' });
    expect(parsed.name).toBe('Lagos');
  });
});
