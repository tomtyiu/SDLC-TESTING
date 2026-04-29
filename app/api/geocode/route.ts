import { NextResponse } from 'next/server';
import { geocode, UpstreamError } from '@/lib/openMeteo';
import { geocodeQuery } from '@/lib/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const start = Date.now();
  const url = new URL(request.url);
  const parsed = geocodeQuery.safeParse({ q: url.searchParams.get('q') ?? '' });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_request' },
      { status: 400 },
    );
  }

  try {
    const results = await geocode(parsed.data.q);
    const res = NextResponse.json({ results });
    res.headers.set(
      'Cache-Control',
      'public, s-maxage=600, stale-while-revalidate=3600',
    );
    log({
      route: '/api/geocode',
      status: 200,
      durationMs: Date.now() - start,
      q: parsed.data.q.slice(0, 32),
    });
    return res;
  } catch (err) {
    return handleUpstreamError(err, start);
  }
}

function handleUpstreamError(err: unknown, start: number) {
  if (err instanceof UpstreamError) {
    const status = err.code === 'timeout' ? 504 : 502;
    log({
      route: '/api/geocode',
      status,
      durationMs: Date.now() - start,
      error: err.code,
      upstreamStatus: err.upstreamStatus,
    });
    return NextResponse.json(
      { error: err.code === 'timeout' ? 'weather_timeout' : 'weather_unavailable' },
      { status },
    );
  }
  log({
    route: '/api/geocode',
    status: 500,
    durationMs: Date.now() - start,
    error: 'internal',
  });
  return NextResponse.json({ error: 'internal' }, { status: 500 });
}

function log(payload: Record<string, unknown>) {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ level: 'info', ...payload }));
}
