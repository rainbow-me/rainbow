import { expect, test } from 'vitest';

import { isUnstoppableAddressFormat } from './domainFormat';

test('rejects a missing address', () => {
  expect(isUnstoppableAddressFormat(undefined)).toBe(false);
});
