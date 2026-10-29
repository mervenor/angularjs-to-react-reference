import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockFetchFromPublic } from '../../tests/helpers/mockFetch';
import { PhoneApiError, assetUrl, fetchPhone, fetchPhones } from './api';

afterEach(() => vi.unstubAllGlobals());

describe('phone data layer', () => {
  it('requests root-relative URLs, so it works from any page path', async () => {
    const fetchMock = mockFetchFromPublic();
    await fetchPhones();
    await fetchPhone('nexus-s');
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['/data/phones/phones.json', '/data/phones/nexus-s.json']);
  });

  it('turns HTTP errors into a typed error with the status', async () => {
    mockFetchFromPublic();
    await expect(fetchPhone('no-such-phone')).rejects.toEqual(expect.objectContaining({ status: 404 }));
    await expect(fetchPhone('no-such-phone')).rejects.toBeInstanceOf(PhoneApiError);
  });

  it('resolves image paths from the site root and leaves absolute URLs alone', () => {
    expect(assetUrl('img/phones/nexus-s.0.jpg')).toBe('/img/phones/nexus-s.0.jpg');
    expect(assetUrl('/img/a.jpg')).toBe('/img/a.jpg');
    expect(assetUrl('https://cdn.example.com/a.jpg')).toBe('https://cdn.example.com/a.jpg');
  });
});
