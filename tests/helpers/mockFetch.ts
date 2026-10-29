import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { vi } from 'vitest';

/** Serves files from public/ to `fetch`, like the static server does. Unknown files get a 404. */
export function mockFetchFromPublic(overrides: Record<string, number> = {}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const path = String(input).replace(/^\//, '');
    if (path in overrides) return new Response('', { status: overrides[path] });
    try {
      return new Response(readFileSync(join('public', path)), { status: 200 });
    } catch {
      return new Response('Not found', { status: 404 });
    }
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
