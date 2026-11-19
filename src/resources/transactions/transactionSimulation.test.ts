import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rainbowFetch } from '@/framework/data/http/rainbowFetch';
import { GraphQLResponseError } from '@/graphql/utils/getFetchRequester';

import { simulateMessage, simulateTransaction } from './transactionSimulation';

vi.mock('@/framework/data/http/rainbowFetch', () => ({ rainbowFetch: vi.fn() }));

const blockaidError = 'failed to scan transactions: blockaid returned status code 403';
const result = { simulation: { in: [], out: [], approvals: [] } };

function respondWith(body: { data: unknown; errors?: { message: string }[] }) {
  vi.mocked(rainbowFetch).mockResolvedValue({ data: body } as Awaited<ReturnType<typeof rainbowFetch>>);
}

const callers = [
  {
    name: 'simulateTransaction',
    field: 'simulateTransactions',
    wrap: (value: unknown) => (value == null ? value : [value]),
    call: () => simulateTransaction({ chainId: 1, transactions: [{ from: '0xa', to: '0xb', data: '0x', value: '0x0' }] }),
  },
  {
    name: 'simulateMessage',
    field: 'simulateMessage',
    wrap: (value: unknown) => value,
    call: () => simulateMessage({ address: '0xa', chainId: 1, message: { method: 'eth_signTypedData_v4', params: ['{}'] }, domain: '' }),
  },
];

describe.each(callers)('$name', ({ field, wrap, call }) => {
  beforeEach(() => {
    vi.mocked(rainbowFetch).mockReset();
  });

  it('rejects with the backend error when the simulation failed', async () => {
    respondWith({ data: { [field]: null }, errors: [{ message: blockaidError }] });

    await expect(call()).rejects.toThrow(blockaidError);
    await expect(call()).rejects.toBeInstanceOf(GraphQLResponseError);
  });

  it('returns the result when the response also carries errors', async () => {
    respondWith({ data: { [field]: wrap(result) }, errors: [{ message: 'a nested field failed' }] });

    await expect(call()).resolves.toEqual(result);
  });
});
