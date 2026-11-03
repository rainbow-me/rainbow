import { expect, test } from 'vitest';

import { isBankrAddressFormat, isUnstoppableAddressFormat, isValidDomainFormat } from './domainFormat';

test('rejects a missing address', () => {
  expect(isUnstoppableAddressFormat(undefined)).toBe(false);
});

test('recognizes .bankr names', () => {
  expect(isBankrAddressFormat('alice.bankr')).toBe(true);
  expect(isBankrAddressFormat('Alice.BANKR')).toBe(true);
  expect(isBankrAddressFormat('pay.alice.bankr')).toBe(true);
  expect(isValidDomainFormat('alice.bankr')).toBe(true);
});

test('rejects non-.bankr and malformed names', () => {
  expect(isBankrAddressFormat(undefined)).toBe(false);
  expect(isBankrAddressFormat('bankr')).toBe(false);
  expect(isBankrAddressFormat('.bankr')).toBe(false);
  expect(isBankrAddressFormat('alice..bankr')).toBe(false);
  expect(isBankrAddressFormat('alice.eth')).toBe(false);
  expect(isBankrAddressFormat('alice.bankr.eth')).toBe(false);
});
