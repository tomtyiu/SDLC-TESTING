'use client';

import { useEffect, useRef, useState } from 'react';

export interface SearchResult {
  id: number;
  name: string;
  country?: string;
  countryCode?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

interface Props {
  onSelect: (result: SearchResult) => void;
}

const DEBOUNCE_MS = 250;

export default function SearchBox({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    const handle = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/geocode?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal },
        );
        if (!res.ok) {
          throw new Error('search_failed');
        }
        const data = (await res.json()) as { results: SearchResult[] };
        setResults(data.results ?? []);
        setOpen(true);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError("Couldn't search. Check your connection and try again.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className="relative">
      <label htmlFor="city-search" className="sr-only">
        Search for a city
      </label>
      <input
        id="city-search"
        type="search"
        autoComplete="off"
        spellCheck={false}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search for a city, e.g. London"
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:focus:ring-slate-800"
      />
      {loading ? (
        <p
          role="status"
          className="mt-2 text-xs text-slate-500 dark:text-slate-400"
        >
          Searchingβ€¦
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      ) : null}
      {open && results.length === 0 && !loading && query.trim().length >= 2 ? (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          No matches β€” try a different spelling.
        </p>
      ) : null}
      {open && results.length > 0 ? (
        <ul
          role="listbox"
          className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                role="option"
                aria-selected="false"
                className="flex w-full flex-col items-start px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(r);
                  setQuery(r.name);
                  setOpen(false);
                }}
              >
                <span className="text-sm font-medium">{r.name}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {[r.admin1, r.country].filter(Boolean).join(', ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
