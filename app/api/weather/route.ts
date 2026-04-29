import { NextResponse } from 'next/server';
import { forecast, UpstreamError } from '@/lib/openMeteo';
import { weatherQuery } from '@/lib/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const start = Date.now();
  const url = new URL(request.url);
  const latRaw = url.searchParams.get('lat');
  const lonRaw = url.searchParams.get('lon');
  if (latRaw === null || lonRaw === null) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  const parsed = weatherQuery.safeParse({
    lat: latRaw,
    lon: lonRaw,
    name: url.searchParams.get('name') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  try {
    const data = await forecast(parsed.data.lat, parsed.data.lon);
    const res = NextResponse.json({
      location: { ...data.location, name: parsed.data.name ?? null },
      current: data.current,
      daily: data.daily,
    });
    res.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=900',
    );
    log({
      route: '/api/weather',
      status: 200,
      durationMs: Date.now() - start,
      lat: parsed.data.lat,
      lon: parsed.data.lon,
    });
    return res;
  } catch (err) {
    if (err instanceof UpstreamError) {
      const status = err.code === 'timeout' ? 504 : 502;
      log({
        route: '/api/weather',
        status,
        durationMs: Date.now() - start,
        error: err.code,
        upstreamStatus: err.upstreamStatus,
      });
      return NextResponse.json(
        {
          error:
            err.code === 'timeout' ? 'weather_timeout' : 'weather_unavailable',
        },
        { status },
      );
    }
    log({
      route: '/api/weather',
      status: 500,
      durationMs: Date.now() - start,
      error: 'internal',
    });
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

function log(payload: Record<string, unknown>) {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ level: 'info', ...payload }));
}
