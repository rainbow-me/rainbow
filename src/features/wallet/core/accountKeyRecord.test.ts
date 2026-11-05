import { describe, expect, it } from 'vitest';

import { validateAccountKeyRecord, validateWalletAddress } from './accountKeyRecord';

const EVM_ADDRESS = '0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf';
const SOL_ADDRESS = '4zvwRjXUKGfvwnParsHAS3HuSVzV5cA4McphgmoCtajS';
const EVM_KEY = {
  address: EVM_ADDRESS,
  version: 1,
  format: 'secp256k1-private-key-hex',
  privateKey: `0x${'0'.repeat(63)}1`,
};
const SOL_KEY = {
  address: SOL_ADDRESS,
  version: 1,
  format: 'ed25519-seed-base64',
  privateKey: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
};

describe('raw address key record codec', () => {
  it.each([EVM_KEY, SOL_KEY])('validates $format and excludes ownership and extra fields from key storage', record => {
    expect(
      validateAccountKeyRecord({ ...record, walletId: 'wallet', index: 1, origin: { kind: 'imported' }, extraSecret: 'discard' })
    ).toEqual({ status: 'ok', value: record });
  });

  it('normalizes raw EVM casing without needing a network', () => {
    expect(validateWalletAddress(EVM_ADDRESS.toLowerCase())).toEqual({
      status: 'ok',
      value: { address: EVM_ADDRESS, namespace: 'eip155' },
    });
    expect(validateAccountKeyRecord({ ...EVM_KEY, address: EVM_ADDRESS.toLowerCase() })).toEqual({ status: 'ok', value: EVM_KEY });
  });

  it('preserves Solana address case and needs no cluster or wallet identity', () => {
    expect(validateWalletAddress(SOL_ADDRESS)).toEqual({ status: 'ok', value: { address: SOL_ADDRESS, namespace: 'solana' } });
    expect(validateAccountKeyRecord({ ...SOL_KEY, address: SOL_ADDRESS.toLowerCase() }).status).not.toBe('ok');
  });

  it.each([
    `eip155:1:${EVM_ADDRESS}`,
    `eip155:8453:${EVM_ADDRESS}`,
    `eip155:_:${EVM_ADDRESS}`,
    `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:${SOL_ADDRESS}`,
    `solana:_:${SOL_ADDRESS}`,
    '',
    null,
    {},
    '0x1234',
    'a'.repeat(100_000),
  ])('rejects qualified identifiers and invalid raw addresses %#', address => {
    expect(validateWalletAddress(address)).toEqual({ status: 'invalid-record' });
  });

  it.each([
    null,
    {},
    { ...SOL_KEY, version: 2 },
    { ...SOL_KEY, address: undefined },
    { ...SOL_KEY, address: `solana:_:${SOL_ADDRESS}` },
    { ...EVM_KEY, privateKey: `0x${'0'.repeat(64)}` },
    { ...SOL_KEY, privateKey: null },
    { ...SOL_KEY, format: EVM_KEY.format },
    { ...SOL_KEY, privateKey: 'AA=='.repeat(32) },
    { ...SOL_KEY, privateKey: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB=' },
  ])('rejects malformed or incompatible key records %#', value => {
    expect(validateAccountKeyRecord(value)).toEqual({ status: 'invalid-record' });
  });

  it('distinguishes a valid key belonging to another address', () => {
    expect(validateAccountKeyRecord({ ...EVM_KEY, address: '0x0000000000000000000000000000000000000001' })).toEqual({
      status: 'address-mismatch',
    });
  });
});
