/*
 * Search inputs we characterise. Each one is run with both sort orders and the
 * visible phone ids are recorded in search-behaviour.json.
 * Chosen to cover: names, case, hidden fields (carrier, id, image URL, age),
 * the "!" negation quirk, whitespace and non-ASCII characters.
 */
export const SEARCH_CASES = [
  '',
  'nexus',
  'NEXUS',
  'motorola',
  'tablet',
  'xoom wi',
  'verizon',
  'at&t',
  'jpg',
  'img/phones',
  'droid-pro',
  '1',
  '0',
  '!motorola',
  '!',
  '!!motorola',
  ' ',
  '™',
  'galaxy s™',
  'no such phone',
] as const;

export const SORT_KEYS = ['age', 'name'] as const;

export type SortKey = (typeof SORT_KEYS)[number];

export const caseKey = (query: string, sortKey: SortKey) => `${JSON.stringify(query)} sorted by ${sortKey}`;
