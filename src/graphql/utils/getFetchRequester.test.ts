import { parse } from 'graphql';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rainbowFetch } from '@/framework/data/http/rainbowFetch';

import { getFetchRequester } from './getFetchRequester';

vi.mock('@/framework/data/http/rainbowFetch', () => ({ rainbowFetch: vi.fn() }));

const document = parse('query simulateTransactions { simulateTransactions { gas { estimate } } }');
const requester = getFetchRequester({ __name: 'metadataPOST', schema: { url: 'https://example.com/graph' } });
const errors = [{ message: 'Bulk transactions are currently not supported for this chain: 1' }, { message: 'second' }];

function respondWith(body: { data: unknown; errors?: { message: string }[] }) {
  vi.mocked(rainbowFetch).mockResolvedValue({ data: body } as Awaited<ReturnType<typeof rainbowFetch>>);
}

describe('getFetchRequester', () => {
  beforeEach(() => {
    vi.mocked(rainbowFetch).mockReset();
  });

  it('returns data alongside GraphQL errors by default', async () => {
    respondWith({ data: { simulateTransactions: null }, errors });

    await expect(requester(document)).resolves.toEqual({ simulateTransactions: null });
  });

  it('throws the GraphQL error messages when throwOnErrorsWithoutData is set and no root field has data', async () => {
    respondWith({ data: { simulateTransactions: null }, errors });

    await expect(requester(document, undefined, { throwOnErrorsWithoutData: true })).rejects.toThrow(
      'Bulk transactions are currently not supported for this chain: 1; second'
    );
    expect(vi.mocked(rainbowFetch).mock.lastCall?.[1]).not.toHaveProperty('throwOnErrorsWithoutData');
  });

  it('keeps partial data alongside GraphQL errors when throwOnErrorsWithoutData is set', async () => {
    const partial = { simulateTransactions: [{ gas: { estimate: '0x5208' } }, null] };
    respondWith({ data: partial, errors });

    await expect(requester(document, undefined, { throwOnErrorsWithoutData: true })).resolves.toEqual(partial);
  });
});
