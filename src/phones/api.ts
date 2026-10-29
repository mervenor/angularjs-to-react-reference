import type { Phone, PhoneSummary } from './types';

/**
 * Typed replacement for the AngularJS `Phone` $resource: plain `fetch` with
 * cancellation instead of $http and the digest loop.
 *
 * The shape of the JSON is checked by tests/unit/data-contract.test.ts, not
 * at runtime. That is fine for static files we control; for a real API we
 * would validate at this boundary (for example with a schema library).
 */
const BASE_URL = import.meta.env.BASE_URL; // "/" unless the app is deployed under a sub-path

// Root-relative, not relative: with real paths a relative "phones/x.json"
// requested from /phones/nexus-s would resolve to /phones/phones/x.json.
// The data lives under /data so it cannot clash with the /phones page.
const DATA_URL = `${BASE_URL}data/phones`;

/**
 * The data stores image paths relative to the site root ("img/phones/x.jpg").
 * Resolve them at render time, not on load, so search still sees the raw data.
 */
export const assetUrl = (path: string) => (/^([a-z]+:)?\/\//i.test(path) ? path : `${BASE_URL}${path.replace(/^\//, '')}`);

export class PhoneApiError extends Error {
  constructor(
    readonly url: string,
    readonly status: number,
  ) {
    super(`Request for ${url} failed with HTTP ${status}`);
    this.name = 'PhoneApiError';
  }
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new PhoneApiError(url, response.status);
  return (await response.json()) as T;
}

export function fetchPhones(signal?: AbortSignal): Promise<PhoneSummary[]> {
  return getJson<PhoneSummary[]>(`${DATA_URL}/phones.json`, signal);
}

export function fetchPhone(id: string, signal?: AbortSignal): Promise<Phone> {
  return getJson<Phone>(`${DATA_URL}/${encodeURIComponent(id)}.json`, signal);
}
