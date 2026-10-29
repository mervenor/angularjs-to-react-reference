import { expect, it } from 'vitest';
import { checkmark } from './checkmark';

it('matches the AngularJS checkmark filter', () => {
  expect(checkmark(true)).toBe('✓');
  expect(checkmark(false)).toBe('✘');
  expect(checkmark(undefined)).toBe('✘');
  expect(checkmark('yes')).toBe('✓');
});
