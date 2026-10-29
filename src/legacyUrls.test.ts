import { describe, expect, it } from 'vitest';
import { legacyHashToPath } from './legacyUrls';

describe('legacyHashToPath', () => {
  it.each([
    ['https://example.com/index.html#!/phones', '/phones'],
    ['https://example.com/index.html#!/phones/nexus-s', '/phones/nexus-s'],
    ['https://example.com/#!/phones/nexus-s', '/phones/nexus-s'],
    ['https://example.com/#/phones/nexus-s', '/phones/nexus-s'],
    ['https://example.com/#!/phones?q=nexus', '/phones?q=nexus'],
  ])('rewrites %s to %s', (from, to) => {
    expect(legacyHashToPath(from)).toBe(to);
  });

  it.each(['https://example.com/phones', 'https://example.com/phones#specs', 'https://example.com/#'])(
    'leaves %s alone',
    (url) => {
      expect(legacyHashToPath(url)).toBeNull();
    },
  );
});
