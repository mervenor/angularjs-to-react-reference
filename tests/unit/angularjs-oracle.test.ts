import angular from 'angular';
import 'angular-resource';
import { beforeAll, describe, expect, it } from 'vitest';
import phones from '../../public/phones/phones.json';
import { SEARCH_CASES, SORT_KEYS, caseKey } from '../fixtures/search-cases';

/*
 * The AngularJS "oracle". We run the real AngularJS 1.8 filters over the
 * real data and write down exactly what they return. The recorded file
 * (tests/fixtures/search-behaviour.json) is what the React port must match
 * later, and it outlives AngularJS itself.
 */

let $filter: angular.IFilterService;

beforeAll(async () => {
  // The legacy files are plain scripts that expect a global `angular`.
  (globalThis as unknown as { angular: angular.IAngularStatic }).angular = angular;
  await import('../../src/legacy/core/phone/phone.module.js');
  await import('../../src/legacy/core/phone/phone.service.js');
  await import('../../src/legacy/core/core.module.js');
  await import('../../src/legacy/core/checkmark/checkmark.filter.js');
  $filter = angular.injector(['ng', 'core']).get('$filter');
});

describe('AngularJS search and sort (phone list template: filter + orderBy)', () => {
  it('matches the recorded search behaviour for every case', async () => {
    const table: Record<string, string[]> = {};
    for (const query of SEARCH_CASES) {
      for (const sortKey of SORT_KEYS) {
        const filtered = $filter('filter')(phones, query);
        const sorted = $filter('orderBy')(filtered, sortKey) as typeof phones;
        table[caseKey(query, sortKey)] = sorted.map((phone) => phone.id);
      }
    }
    await expect(JSON.stringify(table, null, 2) + '\n').toMatchFileSnapshot('../fixtures/search-behaviour.json');
  });
});

describe('AngularJS checkmark filter', () => {
  it('turns truthy values into a tick and falsy values into a cross', () => {
    const checkmark = $filter('checkmark') as (input: unknown) => string;
    expect(checkmark(true)).toBe('✓');
    expect(checkmark(false)).toBe('✘');
    expect(checkmark(undefined)).toBe('✘');
    expect(checkmark('yes')).toBe('✓');
  });
});
