import { expect, it } from 'vitest';

import { getHighContrastColor } from './getHighContrastColor';

it('returns undefined for invalid colors', () => {
  expect(getHighContrastColor('series-yellow')).toBeUndefined();
  expect(getHighContrastColor('series-yellow', true)).toBeUndefined();
  expect(getHighContrastColor('')).toBeUndefined();
});
