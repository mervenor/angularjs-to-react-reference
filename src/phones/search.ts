/*
 * A faithful port of what the original template did:
 *
 *   phone in $ctrl.phones | filter:$ctrl.query | orderBy:$ctrl.orderProp
 *
 * It reproduces AngularJS 1.8's behaviour for a string query, quirks
 * included, and is checked against the real AngularJS output recorded in
 * tests/fixtures/search-behaviour.json. Do not "simplify" it to a name
 * search without a product decision: users can see the difference.
 */

/** True if any field of `value`, at any depth, contains `query` (case-insensitive). */
function matches(value: unknown, query: string): boolean {
  // AngularJS: a leading "!" negates the rest of the query.
  if (query.startsWith('!')) return !matches(value, query.slice(1));
  if (Array.isArray(value)) return value.some((item) => matches(item, query));
  if (value !== null && typeof value === 'object') {
    // Every field counts, visible or not. Keys starting with "$" are skipped.
    return Object.entries(value).some(([key, field]) => !key.startsWith('$') && matches(field, query));
  }
  if (value === undefined || value === null || typeof value === 'function') return false;
  return String(value).toLowerCase().includes(query.toLowerCase());
}

export function filterPhones<T extends object>(items: readonly T[], query: string): T[] {
  return items.filter((item) => matches(item, query));
}

export const SORT_OPTIONS = [
  { key: 'name', label: 'Alphabetical' },
  { key: 'age', label: 'Newest' },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]['key'];

export const isSortKey = (value: string): value is SortKey => SORT_OPTIONS.some((option) => option.key === value);

/** AngularJS orderBy: strings compared lowercased by character code (not locale), ties keep input order. */
function compare(a: string | number, b: string | number): number {
  const left = typeof a === 'string' ? a.toLowerCase() : a;
  const right = typeof b === 'string' ? b.toLowerCase() : b;
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

export function sortPhones<T extends Record<SortKey, string | number>>(items: readonly T[], key: SortKey): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => compare(a.item[key], b.item[key]) || a.index - b.index)
    .map(({ item }) => item);
}
