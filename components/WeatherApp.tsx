'use client';

import { useCallback, useState } from 'react';
import SearchBox, { type SearchResult } from './SearchBox';
import WeatherDisplay from './WeatherDisplay';

export default function WeatherApp() {
  const [selected, setSelected] = useState<SearchResult | null>(null);

  const handleSelect = useCallback((result: SearchResult) => {
    setSelected(result);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <SearchBox onSelect={handleSelect} />
      {selected ? (
        <WeatherDisplay key={selected.id} location={selected} />
      ) : (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Search for a city above to see current conditions and a 7-day forecast.
        </p>
      )}
    </div>
  );
}
