import { SOLANA_LOCAL_CHAIN_ID } from '../constants';
import { createFakeCaipBalancesTransport, FAKE_MARKER, FAKE_SOLANA_ACCOUNT_ADDRESS } from './fakeCaipBalancesTransport';
import { fetchSolanaUserAssets } from './fetchSolanaUserAssets';

/**
 * The Solana half of the asset fetch, and the two properties the EVM half depends
 * on: it is silent with the flag off, and it never fails in a way that reaches the
 * caller, because the caller's store setter replaces the whole asset map.
 */

let mockSolanaBalancesEnabled = true;

jest.mock('@/features/config/stores/experimentalConfigStore', () => ({
  getExperimentalFlag: () => mockSolanaBalancesEnabled,
}));

const mockPost = jest.fn();
jest.mock('./fakeCaipBalancesTransport', () => {
  const actual = jest.requireActual<typeof import('./fakeCaipBalancesTransport')>('./fakeCaipBalancesTransport');
  return { ...actual, createFakeCaipBalancesTransport: jest.fn(() => actual.createFakeCaipBalancesTransport()) };
});

beforeEach(() => {
  mockSolanaBalancesEnabled = true;
  mockPost.mockReset();
  jest
    .mocked(createFakeCaipBalancesTransport)
    .mockImplementation(() =>
      jest.requireActual<typeof import('./fakeCaipBalancesTransport')>('./fakeCaipBalancesTransport').createFakeCaipBalancesTransport()
    );
});

describe('fetchSolanaUserAssets', () => {
  it('returns nothing at all with the flag off, without building a request', async () => {
    mockSolanaBalancesEnabled = false;

    expect(await fetchSolanaUserAssets({ abortController: null, currency: 'USD' })).toEqual([]);
    expect(createFakeCaipBalancesTransport).not.toHaveBeenCalled();
  });

  it('returns rows carrying the app-local Solana chain id and the base58 mint, not a hex address', async () => {
    const userAssets = await fetchSolanaUserAssets({ abortController: null, currency: 'USD' });

    expect(userAssets).toHaveLength(2);
    for (const { asset } of userAssets) {
      expect(asset.chainId).toBe(SOLANA_LOCAL_CHAIN_ID);
      expect(asset.address).not.toMatch(/^0x/);
      expect(asset.name).toContain(FAKE_MARKER);
    }

    const [sol, usdc] = userAssets;
    expect(sol.asset).toMatchObject({ address: 'So11111111111111111111111111111111111111111', decimals: 9, symbol: 'SOL' });
    expect(sol.quantity).toBe('2500000000');
    expect(usdc.asset).toMatchObject({ decimals: 6, symbol: 'USDC', type: 'spl-token' });
  });

  it('asks about the account it says it asks about', async () => {
    jest.mocked(createFakeCaipBalancesTransport).mockReturnValue({ post: mockPost });
    mockPost.mockResolvedValue({ data: {}, headers: new Headers(), status: 200 });

    await fetchSolanaUserAssets({ abortController: null, currency: 'EUR' });

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost.mock.calls[0][1]).toEqual({
      accounts: [`solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:${FAKE_SOLANA_ACCOUNT_ADDRESS}`],
      currency: 'EUR',
    });
  });

  it('swallows a transport failure rather than letting it empty the EVM rows', async () => {
    jest.mocked(createFakeCaipBalancesTransport).mockReturnValue({ post: mockPost });
    mockPost.mockRejectedValue(new Error('no route serves this contract'));

    await expect(fetchSolanaUserAssets({ abortController: null, currency: 'USD' })).resolves.toEqual([]);
  });

  it('returns no rows rather than guessed ones when the response is empty', async () => {
    jest.mocked(createFakeCaipBalancesTransport).mockReturnValue({ post: mockPost });
    mockPost.mockResolvedValue({ data: { balances: [] }, headers: new Headers(), status: 200 });

    expect(await fetchSolanaUserAssets({ abortController: null, currency: 'USD' })).toEqual([]);
  });
});
