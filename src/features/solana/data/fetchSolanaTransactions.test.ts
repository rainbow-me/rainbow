import { SOLANA_LOCAL_CHAIN_ID } from '../constants';
import { createFakeCaipTransactionsTransport } from './fakeCaipTransactionsTransport';
import { fetchSolanaTransactions } from './fetchSolanaTransactions';

/**
 * The Solana half of the activity fetch, and the three properties the EVM half
 * depends on: it is silent with the flag off, it never fails in a way that reaches
 * the caller, and it asks for its own chain rather than consulting a chain-list
 * selector that structurally excludes Solana.
 */

jest.mock('@/utils/ethereumUtils', () => ({ getUniqueId: (address: string, chainId: number) => `${address}_${chainId}` }));

let mockSolanaBalancesEnabled = true;

jest.mock('@/features/config/stores/experimentalConfigStore', () => ({
  getExperimentalFlag: () => mockSolanaBalancesEnabled,
}));

jest.mock('./fakeCaipTransactionsTransport', () => {
  const actual = jest.requireActual<typeof import('./fakeCaipTransactionsTransport')>('./fakeCaipTransactionsTransport');
  return { ...actual, createFakeCaipTransactionsTransport: jest.fn(() => actual.createFakeCaipTransactionsTransport()) };
});

beforeEach(() => {
  mockSolanaBalancesEnabled = true;
  jest
    .mocked(createFakeCaipTransactionsTransport)
    .mockImplementation(() =>
      jest
        .requireActual<typeof import('./fakeCaipTransactionsTransport')>('./fakeCaipTransactionsTransport')
        .createFakeCaipTransactionsTransport()
    );
});

describe('fetchSolanaTransactions', () => {
  it('returns nothing at all with the flag off, without building a request', async () => {
    mockSolanaBalancesEnabled = false;

    expect(await fetchSolanaTransactions({ currency: 'USD', limit: 30 })).toEqual([]);
    expect(createFakeCaipTransactionsTransport).not.toHaveBeenCalled();
  });

  it('returns transactions keyed to the app-local Solana chain number with the flag on', async () => {
    const transactions = await fetchSolanaTransactions({ currency: 'USD', limit: 30 });

    expect(transactions).toHaveLength(2);
    for (const transaction of transactions) {
      expect(transaction.chainId).toBe(SOLANA_LOCAL_CHAIN_ID);
      // Every transaction must carry a timestamp: `buildTransactionsSections` drops a
      // confirmed transaction without one from the list silently.
      expect(transaction.minedAt).toEqual(expect.any(Number));
    }
  });

  it('never lets a transport failure reach the caller, because a Solana failure must not cost the EVM rows', async () => {
    jest.mocked(createFakeCaipTransactionsTransport).mockImplementation(() => ({
      post: () => Promise.reject(new Error('transport exploded')),
    }));

    await expect(fetchSolanaTransactions({ currency: 'USD', limit: 30 })).resolves.toEqual([]);
  });

  it('never lets a malformed response reach the caller', async () => {
    jest.mocked(createFakeCaipTransactionsTransport).mockImplementation(() => ({
      post: <TData = unknown>() => Promise.resolve({ data: undefined as TData, headers: new Headers(), status: 200 }),
    }));

    await expect(fetchSolanaTransactions({ currency: 'USD', limit: 30 })).resolves.toEqual([]);
  });
});
