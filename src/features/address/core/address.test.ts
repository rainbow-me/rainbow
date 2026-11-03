import { expect, it } from 'vitest';

import { getNameService, isValidAddress, isValidAddressOrDomainFormat } from './address';

it.each([
  ['sub.alice.eth', 'ens'],
  ['  SUB.alice.xyz  ', 'ens'],
  ['🦄.eth', 'ens'],
  ['alice.crypto', 'unstoppable'],
  ['alice.888', 'unstoppable'],
  ['alice..xyz', null],
  ['0x123.xyz', null],
  ['not a name.xyz', null],
] as const)('classifies %s consistently for name routing and input admission', (input, service) => {
  expect(getNameService(input)).toBe(service);
  expect(isValidAddressOrDomainFormat(input)).toBe(service !== null);
});

it('keeps literal address shape separate from names and checksum validation', () => {
  const badChecksum = '0x52908400098527886E0F7030069857D2E4169Ee7';
  expect(getNameService(badChecksum)).toBeNull();
  expect(isValidAddressOrDomainFormat(badChecksum)).toBe(true);
  expect(isValidAddress(badChecksum)).toBe(false);
});
