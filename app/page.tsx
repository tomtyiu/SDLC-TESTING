import WeatherApp from '@/components/WeatherApp';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-4 py-10">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Weather</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Search for a city and plan your day.
        </p>
      </header>
      <WeatherApp />
      <footer className="mt-auto pt-8 text-xs text-slate-500">
        Data by{' '}
        <a
          className="underline hover:text-slate-700 dark:hover:text-slate-300"
          href="https://open-meteo.com/"
          rel="noreferrer noopener"
          target="_blank"
        >
          Open-Meteo
        </a>
        .
      </footer>
    </main>
  );
}
