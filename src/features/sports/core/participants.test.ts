import { expect, test } from 'vitest';

import { getParticipantDisplayName } from './participants';

test.each([
  { name: 'Minnesota Vikings', shortName: 'Vikings', expected: { displayName: 'Vikings', prefix: 'Minnesota' } },
  { name: 'Miami Heat', shortName: 'eat', expected: { displayName: 'Miami Heat' } },
  { name: 'Sebastian Baez', shortName: 'S. Baez', expected: { displayName: 'Sebastian Baez' } },
  { name: ' Hurricanes', shortName: 'Hurricanes', expected: { displayName: 'Hurricanes' } },
  { name: 'Türkiye ', shortName: '', expected: { displayName: 'Türkiye ' } },
])('shows "$expected.displayName" for $name / $shortName', ({ name, shortName, expected }) => {
  expect(getParticipantDisplayName({ name, shortName })).toEqual(expected);
});
