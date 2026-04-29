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

type Unit = 'C' | 'F';

const UNIT_STORAGE_KEY = 'weather:unit';

function isUnit(v: unknown): v is Unit {
  return v === 'C' || v === 'F';
}

function toFahrenheit(c: number): number {
  return c * 9 / 5 + 32;
}

function formatTemp(c: number, unit: Unit): string {
  const value = unit === 'F' ? toFahrenheit(c) : c;
  return `${Math.round(value)}°${unit}`;
}

interface Props {
  location: SearchResult;
}

export default function WeatherDisplay({ location }: Props) {
  const [data, setData] = useState<WeatherPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unit, setUnit] = useState<Unit>('C');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(UNIT_STORAGE_KEY);
    if (isUnit(stored)) setUnit(stored);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(UNIT_STORAGE_KEY, unit);
  }, [unit]);

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
        Loading forecast for {location.name}…
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
              {describeWmo(data.current.weatherCode)} ·{' '}
              {new Date(data.current.time).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <UnitToggle unit={unit} onChange={setUnit} />
            <div className="text-4xl" aria-hidden="true">
              {emojiForWmo(data.current.weatherCode, data.current.isDay ? 1 : 0)}
            </div>
          </div>
        </header>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat label="Temperature" value={formatTemp(data.current.temperatureC, unit)} />
          <Stat
            label="Feels like"
            value={formatTemp(data.current.apparentTemperatureC, unit)}
          />
          <Stat label="Humidity" value={`${data.current.humidity}%`} />
          <Stat label="Wind" value={`${Math.round(data.current.windKmh)} km/h`} />
        </dl>
      </article>

      <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-base font-semibold">Next 7 days</h3>
        <ul className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
          {data.daily.map((d) => {
            const min = unit === 'F' ? toFahrenheit(d.tempMinC) : d.tempMinC;
            const max = unit === 'F' ? toFahrenheit(d.tempMaxC) : d.tempMaxC;
            return (
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
                  {Math.round(min)}° / {Math.round(max)}°
                </span>
              </li>
            );
          })}
        </ul>
      </article>
    </section>
  );
}

function UnitToggle({
  unit,
  onChange,
}: {
  unit: Unit;
  onChange: (u: Unit) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Temperature unit"
      className="inline-flex overflow-hidden rounded-md border border-slate-300 text-xs font-medium dark:border-slate-700"
    >
      {(['C', 'F'] as const).map((u) => {
        const active = unit === u;
        return (
          <button
            key={u}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(u)}
            className={
              active
                ? 'bg-slate-900 px-2 py-1 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-white px-2 py-1 text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
            }
          >
            °{u}
          </button>
        );
      })}
    </div>
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
