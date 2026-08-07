import { describe, expect, test } from '@jest/globals';

import { redactIdentifiers } from '@/logger/redactIdentifiers';

const ADDRESS = `0x${'a'.repeat(40)}`;
const TX_HASH = `0x${'b'.repeat(64)}`;

describe('redactIdentifiers', () => {
  test('types the placeholder so the message stays readable', () => {
    expect(redactIdentifiers(`Failed to fetch balances for ${ADDRESS}`)).toBe('Failed to fetch balances for [address]');
    expect(redactIdentifiers(`Transaction ${TX_HASH} not found`)).toBe('Transaction [hash] not found');
  });

  test('collapses to one message regardless of which identifier appeared', () => {
    const first = redactIdentifiers(`Failed to fetch balances for 0x${'1'.repeat(40)}`);
    const second = redactIdentifiers(`Failed to fetch balances for 0x${'2'.repeat(40)}`);

    expect(first).toBe(second);
  });

  test('catches a random-looking run, which is what a URL in a message looks like', () => {
    const SOME_TOKEN = 'aB3dE5gH7jK9mN1pQ3sT5vW7yZ9bD2fH4jL6nP8rT0vX2zA4cE6gI8kM0oQ2sU4w';
    const redacted = redactIdentifiers(`HTTP request failed. URL: https://api.example.com/v1/sessions/${SOME_TOKEN}. Status: 500`);

    expect(redacted).not.toContain(SOME_TOKEN);
    expect(redacted).toContain('[redacted]');
    expect(redacted).toContain('Status: 500');
  });

  test('collapses the json-rpc request id, which increments per call', () => {
    const body = (id: number) => `missing revert data (requestBody={"method":"eth_call","id":${id},"jsonrpc":"2.0"}, code=CALL_EXCEPTION)`;

    expect(redactIdentifiers(body(42))).toBe(redactIdentifiers(body(43)));
    expect(redactIdentifiers(body(42))).toContain('"id":[id]');
  });

  test('collapses the request id in its production form, which is escaped json', () => {
    const body = (id: number) => String.raw`(error={\"requestBody\":\"{\"id\":${id},\"jsonrpc\":\"2.0\"}\"}, code=CALL_EXCEPTION)`;

    expect(redactIdentifiers(body(42))).toBe(redactIdentifiers(body(51)));
    expect(redactIdentifiers(body(42))).toContain(String.raw`\"id\":[id]`);
  });

  test('distinguishes a hash from an address rather than collapsing both', () => {
    expect(redactIdentifiers(`${TX_HASH} from ${ADDRESS}`)).toBe('[hash] from [address]');
  });

  test('catches an identifier embedded in a composite key, where `\\b` would not', () => {
    expect(redactIdentifiers(`[ImageLoader] failed for optimism_${ADDRESS}_0`)).toBe('[ImageLoader] failed for optimism_[address]_0');
  });

  test('reaches into a base64url token, whose separators break it into short runs', () => {
    const redacted = redactIdentifiers('topic=jRZ5_E9kny-CmE_uVFXqko3Qwpk_Elzel74umip6cQd');

    expect(redacted).not.toContain('uVFXqko3Qwpk');
    expect(redacted).not.toContain('Elzel74umip6cQd');
  });

  test('keeps a function selector, which says which call failed and is not user data', () => {
    expect(redactIdentifiers('execution reverted for selector 0x57b17a52')).toBe('execution reverted for selector 0x57b17a52');
  });

  test('leaves ordinary prose, short values and punctuated text alone', () => {
    expect(redactIdentifiers('Failed to fetch NFT collections data')).toBe('Failed to fetch NFT collections data');
    expect(redactIdentifiers('unknown chainID: undefined')).toBe('unknown chainID: undefined');
    expect(redactIdentifiers('GET graphql.example.com 500')).toBe('GET graphql.example.com 500');
  });
});
