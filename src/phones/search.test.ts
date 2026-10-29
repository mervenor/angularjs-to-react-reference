import { describe, expect, it } from 'vitest';
import phones from '../../public/phones/phones.json';
import { SEARCH_CASES, SORT_KEYS, caseKey } from '../../tests/fixtures/search-cases';
import recorded from '../../tests/fixtures/search-behaviour.json';
import type { PhoneSummary } from './types';
import { filterPhones, isSortKey, sortPhones } from './search';

const data: PhoneSummary[] = phones;

describe('filterPhones + sortPhones', () => {
  it.each(SEARCH_CASES.flatMap((query) => SORT_KEYS.map((sortKey) => [query, sortKey] as const)))(
    'matches AngularJS for %j sorted by %s',
    (query, sortKey) => {
      const ids = sortPhones(filterPhones(data, query), sortKey).map((phone) => phone.id);
      expect(ids).toEqual((recorded as Record<string, string[]>)[caseKey(query, sortKey)]);
    },
  );

  it('compares by character code after lowercasing, not by locale', () => {
    const items = [{ name: 'b', age: 0 }, { name: 'é', age: 1 }, { name: 'z', age: 2 }];
    // localeCompare would put "é" between "b" and "z".
    expect(sortPhones(items, 'name').map((item) => item.name)).toEqual(['b', 'z', 'é']);
  });

  it('keeps the input order for ties', () => {
    const items = [{ name: 'A', age: 1, n: 1 }, { name: 'a', age: 1, n: 2 }];
    expect(sortPhones(items, 'name').map((item) => item.n)).toEqual([1, 2]);
  });

  it('recognises valid sort keys only', () => {
    expect(isSortKey('age')).toBe(true);
    expect(isSortKey('price')).toBe(false);
  });
});
