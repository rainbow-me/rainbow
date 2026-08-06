import { PRE_MERGED_BALANCES, SOLANA_BALANCES } from '@/features/config/constants/experimental';
import { FAKE_SOLANA_ACCOUNT_ADDRESS } from '@/features/solana/data/fakeCaipBalancesTransport';

import { fetchCaipUserAssets, isPreMergedBalancesEnabled, toChainIdsWithErrors } from './fetchCaipUserAssets';

/**
 * The pre-merged asset fetch: one request carrying every account the wallet holds,
 * which is the boundary placement the recommendation takes.
 *
 * What these tests pin is the request shape and the failure channel, because those are
 * the two things the placement changes. No client-facing route serves the contract, so
 * the transport is stubbed here rather than faked in the app: nothing in the artifact
 * stands in for the EVM half.
 */

const SOLANA_CAIP2 = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
const EVM_ADDRESS = '0x1234567890123456789012345678901234567890';

let mockEnabledFlags: Record<string, boolean> = {};
let mockSupportedChainIds: number[] = [1, 10];

jest.mock('@/features/config/stores/experimentalConfigStore', () => ({
  getExperimentalFlag: (key: string) => mockEnabledFlags[key] ?? false,
}));

jest.mock('@/features/network/stores/backendNetworksStore', () => ({
  useBackendNetworksStore: { getState: () => ({ getSupportedChainIds: () => mockSupportedChainIds }) },
}));

const mockFetchCaipBalances = jest.fn();
jest.mock('@/features/network/api/caipBalancesClient', () => {
  const actual = jest.requireActual<typeof import('@/features/network/api/caipBalancesClient')>(
    '@/features/network/api/caipBalancesClient'
  );
  return { ...actual, fetchCaipBalances: (...args: unknown[]) => mockFetchCaipBalances(...args) };
});

const emptyResult = { dropped: [], failedAccounts: [], userAssets: [] };

beforeEach(() => {
  mockEnabledFlags = { [PRE_MERGED_BALANCES]: true };
  mockSupportedChainIds = [1, 10];
  mockFetchCaipBalances.mockReset();
  mockFetchCaipBalances.mockResolvedValue(emptyResult);
});

describe('isPreMergedBalancesEnabled', () => {
  it('is off unless its own flag is on, and does not read the Solana flag', () => {
    mockEnabledFlags = { [SOLANA_BALANCES]: true };
    expect(isPreMergedBalancesEnabled()).toBe(false);

    mockEnabledFlags = { [PRE_MERGED_BALANCES]: true };
    expect(isPreMergedBalancesEnabled()).toBe(true);
  });
});

describe('fetchCaipUserAssets', () => {
  it('sends one CAIP-10 account per chain the wallet has an account on, in one request', async () => {
    mockSupportedChainIds = [1, 10, 8453];

    await fetchCaipUserAssets({ abortController: null, address: EVM_ADDRESS, currency: 'USD' });

    expect(mockFetchCaipBalances).toHaveBeenCalledTimes(1);
    expect(mockFetchCaipBalances.mock.calls[0][0]).toEqual({
      accounts: [`eip155:1:${EVM_ADDRESS}`, `eip155:10:${EVM_ADDRESS}`, `eip155:8453:${EVM_ADDRESS}`],
      currency: 'USD',
    });
  });

  it('carries both chain families in that same request when the Solana flag is on', async () => {
    mockEnabledFlags = { [PRE_MERGED_BALANCES]: true, [SOLANA_BALANCES]: true };

    await fetchCaipUserAssets({ abortController: null, address: EVM_ADDRESS, currency: 'EUR' });

    expect(mockFetchCaipBalances.mock.calls[0][0]).toEqual({
      accounts: [`eip155:1:${EVM_ADDRESS}`, `eip155:10:${EVM_ADDRESS}`, `${SOLANA_CAIP2}:${FAKE_SOLANA_ACCOUNT_ADDRESS}`],
      currency: 'EUR',
    });
  });

  it('asks for no Solana account with the Solana flag off, and still asks for the EVM ones', async () => {
    await fetchCaipUserAssets({ abortController: null, address: EVM_ADDRESS, currency: 'USD' });

    const { accounts } = mockFetchCaipBalances.mock.calls[0][0];
    expect(accounts).toHaveLength(2);
    expect(accounts.every((account: string) => account.startsWith('eip155:'))).toBe(true);
  });

  it('returns the rows the response carried', async () => {
    const userAssets = [{ asset: { address: 'eth', chainId: 1 }, quantity: '1' }];
    mockFetchCaipBalances.mockResolvedValue({ ...emptyResult, userAssets });

    await expect(fetchCaipUserAssets({ abortController: null, address: EVM_ADDRESS, currency: 'USD' })).resolves.toEqual({
      chainIdsWithErrors: null,
      userAssets,
    });
  });

  it('reports the chains behind a per-account failure rather than dropping the failure channel', async () => {
    mockFetchCaipBalances.mockResolvedValue({
      ...emptyResult,
      failedAccounts: [
        { accountId: `eip155:10:${EVM_ADDRESS}`, code: 'UPSTREAM_UNAVAILABLE' },
        { accountId: `${SOLANA_CAIP2}:${FAKE_SOLANA_ACCOUNT_ADDRESS}`, code: 'TIMEOUT' },
      ],
    });

    const result = await fetchCaipUserAssets({ abortController: null, address: EVM_ADDRESS, currency: 'USD' });

    expect(result?.chainIdsWithErrors).toEqual([10, 1399811149]);
  });

  it('returns null rather than an empty list when no account is well formed', async () => {
    await expect(fetchCaipUserAssets({ abortController: null, address: 'not-an-address', currency: 'USD' })).resolves.toBeNull();
    expect(mockFetchCaipBalances).not.toHaveBeenCalled();
  });

  it('returns null on a transport failure, which is what keeps the previous asset map', async () => {
    mockFetchCaipBalances.mockRejectedValue(new Error('no route serves this contract'));

    await expect(fetchCaipUserAssets({ abortController: null, address: EVM_ADDRESS, currency: 'USD' })).resolves.toBeNull();
  });
});

describe('toChainIdsWithErrors', () => {
  it('is null when nothing failed, so a success is not reported as an empty error list', () => {
    expect(toChainIdsWithErrors([])).toBeNull();
  });

  it('deduplicates chains and leaves out namespaces the app has no number for', () => {
    expect(
      toChainIdsWithErrors([
        { accountId: `eip155:1:${EVM_ADDRESS}` },
        { accountId: `eip155:1:0x0000000000000000000000000000000000000001` },
        { accountId: `cosmos:cosmoshub-4:cosmos1abc` },
      ])
    ).toEqual([1]);
  });

  it('is null when every failure was on a chain the app has no number for', () => {
    expect(toChainIdsWithErrors([{ accountId: 'cosmos:cosmoshub-4:cosmos1abc' }])).toBeNull();
  });
});
