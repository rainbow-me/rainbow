import { expect, test } from '@jest/globals';

import { isUnstoppableAddressFormat } from './domainFormat';

test('rejects a missing address', () => {
  expect(isUnstoppableAddressFormat(undefined)).toBe(false);
});
