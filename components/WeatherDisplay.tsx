'use client';

import { useEffect, useState } from 'react';
import { describeWmo, emojiForWmo } from '@/lib/wmo';
import type { SearchResult } from './SearchBox';

interface DailyEntry {
  date: string;
  weatherCode: number;
  tempMaxC: number;
  tempMinC: number;
  precipitationProbabilityMax: number | null;
}

interface WeatherPayload {
  location: { latitude: number; longitude: number; timezone: string; name?: string | null };
  current: {
    time: string;
    temperatureC: number;
    apparentTemperatureC: number;
    humidity: number;
    windKmh: number;
    weatherCode: number;
    isDay: boolean;
  };
  daily: DailyEntry[];
}

interface Props {
  location: SearchResult;
}

export default function WeatherDisplay({ location }: Props) {
  const [data, setData] = useState<WeatherPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);

    const params = new URLSearchParams({
      lat: String(location.latitude),
      lon: String(location.longitude),
      name: location.name,
    });
    fetch(`/api/weather?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`status_${res.status}`);
        return (await res.json()) as WeatherPayload;
      })
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't reach weather service. Try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [location.latitude, location.longitude, location.name]);

  if (loading) {
    return (
      <div
        role="status"
        className="rounded-lg border border-slate-200 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400"
      >
        Loading forecast for {location.name}β€¦
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
      >
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <section className="flex flex-col gap-4">
      <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">
              {location.name}
              {location.country ? (
                <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                  {[location.admin1, location.country].filter(Boolean).join(', ')}
                </span>
              ) : null}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {describeWmo(data.current.weatherCode)} Β·{' '}
              {new Date(data.current.time).toLocaleString()}
            </p>
          </div>
          <div className="text-4xl" aria-hidden="true">
            {emojiForWmo(data.current.weatherCode, data.current.isDay ? 1 : 0)}
          </div>
        </header>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat label="Temperature" value={`${Math.round(data.current.temperatureC)}Β°C`} />
          <Stat
            label="Feels like"
            value={`${Math.round(data.current.apparentTemperatureC)}Β°C`}
          />
          <Stat label="Humidity" value={`${data.current.humidity}%`} />
          <Stat label="Wind" value={`${Math.round(data.current.windKmh)} km/h`} />
        </dl>
      </article>

      <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-base font-semibold">Next 7 days</h3>
        <ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
          {data.daily.map((d) => (
            <li
              key={d.date}
              className="flex items-center justify-between gap-3 py-2 text-sm"
            >
              <span className="w-24 text-slate-600 dark:text-slate-400">
                {formatDay(d.date)}
              </span>
              <span aria-hidden="true">{emojiForWmo(d.weatherCode)}</span>
              <span className="flex-1 text-slate-700 dark:text-slate-300">
                {describeWmo(d.weatherCode)}
              </span>
              {d.precipitationProbabilityMax != null ? (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {d.precipitationProbabilityMax}% rain
                </span>
              ) : null}
              <span className="font-medium">
                {Math.round(d.tempMinC)}Β° / {Math.round(d.tempMaxC)}Β°
              </span>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="text-base font-semibold">{value}</dd>
    </div>
  );
}

function formatDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}
