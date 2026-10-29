/** Port of the AngularJS `checkmark` filter: a tick for truthy values, a cross otherwise. */
export const checkmark = (value: unknown): string => (value ? '✓' : '✘');
