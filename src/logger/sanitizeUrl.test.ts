import { describe, expect, test } from '@jest/globals';

import { sanitizeUrl } from '@/logger/sanitizeUrl';

const WALLET_ADDRESS = `0x${'a'.repeat(40)}`;
const TX_HASH = `0x${'b'.repeat(64)}`;
/** A random-looking segment, carrying no routing information. */
const RANDOM_SEGMENT = 'aB3dE5gH7jK9mN1pQ3sT5vW7yZ9bD2fH4jL6nP8rT0vX2zA4cE6gI8kM0oQ2sU4w';

describe('sanitizeUrl', () => {
  test('keeps the origin and static route words', () => {
    expect(sanitizeUrl('https://api.example.com/v1/rewards/GetBalance')).toBe('https://api.example.com/v1/rewards/GetBalance');
  });

  test('drops the query string, which carries values the path does not', () => {
    expect(sanitizeUrl(`https://api.example.com/?address=${WALLET_ADDRESS}`)).toBe('https://api.example.com');
    expect(sanitizeUrl('https://graphql.example.com/graphql?query=%7Bfoo%7D&operationName=getNftCollections')).toBe(
      'https://graphql.example.com/graphql'
    );
  });

  test('templates the user data that paths legitimately carry', () => {
    expect(sanitizeUrl(`https://api.example.com/v1/wallets/${WALLET_ADDRESS}/positions`)).toBe(
      'https://api.example.com/v1/wallets/:id/positions'
    );
    expect(sanitizeUrl(`https://api.example.com/v1/transactions/${TX_HASH}/status`)).toBe(
      'https://api.example.com/v1/transactions/:id/status'
    );
  });

  test('templates numeric segments, since a chain id and a resource id are the same shape', () => {
    expect(sanitizeUrl('https://rpc.example.com/v1/137/balances')).toBe('https://rpc.example.com/v1/:id/balances');
    expect(sanitizeUrl('https://events.example.com/events/512340')).toBe('https://events.example.com/events/:id');
    expect(sanitizeUrl('https://search.example.com/v3/discovery/1,10,8453')).toBe('https://search.example.com/v3/discovery/:id');
  });

  test('templates a random-looking path segment', () => {
    const sanitized = sanitizeUrl(`https://api.example.com/v1/sessions/${RANDOM_SEGMENT}?verbose=1`);

    expect(sanitized).not.toContain(RANDOM_SEGMENT);
    expect(sanitized).toBe('https://api.example.com/v1/sessions/:id');
  });

  test('drops schemes with no origin, whose whole value is one unreadable payload', () => {
    expect(sanitizeUrl('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjg2Ij48L3N2Zz4=')).toBeUndefined();
    expect(sanitizeUrl('ipfs://QmYx6GsYAKnNzZ9A6NvEKV9nf1VaDzJrqDR23Y8YSkebLU/1.png')).toBeUndefined();
    expect(sanitizeUrl('file:///var/mobile/Containers/Data/Application/tmp/x.png')).toBeUndefined();
    expect(sanitizeUrl('myapp://wc?uri=wc%3Aab12%402%3FsymKey%3Dcd34')).toBeUndefined();
  });

  test('keeps websocket origins, which say which relay failed', () => {
    expect(sanitizeUrl('wss://relay.example.com')).toBe('wss://relay.example.com');
  });

  test('returns undefined for anything it cannot parse, so callers drop the field', () => {
    expect(sanitizeUrl('')).toBeUndefined();
    expect(sanitizeUrl(`api.example.com/v1/sessions/${RANDOM_SEGMENT}`)).toBeUndefined();
  });
});
