import { expect, test } from 'vitest';

import { getParticipantDisplayName } from './participants';

test.each([
  { name: 'Minnesota Vikings', shortName: 'Vikings', expected: { displayName: 'Vikings', prefix: 'Minnesota' } },
  { name: 'Mammoth', shortName: 'Utah', expected: { displayName: 'Mammoth' } },
  { name: 'Sebastian Baez', shortName: 'S. Baez', expected: { displayName: 'Sebastian Baez' } },
  { name: 'Spirit Academy', shortName: 'SpiritAc', expected: { displayName: 'Spirit Academy' } },
  { name: 'Miami Heat', shortName: 'eat', expected: { displayName: 'Miami Heat' } },
  { name: 'Hurricanes', shortName: 'Hurricanes', expected: { displayName: 'Hurricanes' } },
  { name: ' Hurricanes', shortName: 'Hurricanes', expected: { displayName: 'Hurricanes' } },
  { name: 'Türkiye', shortName: undefined, expected: { displayName: 'Türkiye' } },
  { name: 'Türkiye', shortName: '', expected: { displayName: 'Türkiye' } },
])('shows "$expected.displayName" for $name / $shortName', ({ name, shortName, expected }) => {
  expect(getParticipantDisplayName({ name, shortName })).toEqual(expected);
});
