import { SOLANA_LOCAL_CHAIN_ID, SOLANA_MAINNET_CHAIN_ID, SOLANA_NATIVE_ASSET_ID } from '@/features/solana/constants';

import {
  CAIP_BALANCES_PATH,
  fetchCaipBalances,
  toBalanceAccountIds,
  toCaipBalancesResult,
  toLocalChainId,
  type CaipBalancesResponse,
} from './caipBalancesClient';

const EVM_ADDRESS = '0x1234567890123456789012345678901234567890';
const SOLANA_ADDRESS = '7nYabs9dUhvxYwdTnrWVBL9MYviKSfrEbdWCUbcarwQj';
const USDC_SOLANA_ASSET = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const DAI_ASSET = 'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f';

/**
 * A response in the wire shape the v2 contract documents: CAIP asset ids, per-asset
 * account attribution, and one account reported as unknown rather than empty.
 */
const RESPONSE: CaipBalancesResponse = {
  balances: [
    {
      accountId: `${SOLANA_MAINNET_CHAIN_ID}:${SOLANA_ADDRESS}`,
      asset: {
        assetId: SOLANA_NATIVE_ASSET_ID,
        chainId: SOLANA_MAINNET_CHAIN_ID,
        colors: { primary: '#14F195' },
        decimals: 9,
        iconUrl: 'https://rainbow.me/sol.png',
        name: 'Solana',
        network: 'solana',
        price: { changedAt: '2026-08-03T10:00:00Z', relativeChange24h: 1.5, value: 180.25 },
        symbol: 'SOL',
        type: 'native',
        verified: true,
      },
      isSmallBalance: false,
      quantity: '2500000000',
      updatedAt: '2026-08-03T10:05:00Z',
      value: '450.62',
    },
    {
      accountId: `${SOLANA_MAINNET_CHAIN_ID}:${SOLANA_ADDRESS}`,
      asset: {
        assetId: USDC_SOLANA_ASSET,
        chainId: SOLANA_MAINNET_CHAIN_ID,
        decimals: 6,
        name: 'USD Coin',
        network: 'solana',
        symbol: 'USDC',
        type: 'spl-token',
      },
      quantity: '1000000',
      value: '1.00',
    },
    {
      accountId: `eip155:1:${EVM_ADDRESS}`,
      asset: {
        assetId: DAI_ASSET,
        bridging: { bridgeable: true, networks: { 'eip155:8453': { bridgeable: true }, [SOLANA_MAINNET_CHAIN_ID]: {} } },
        chainId: 'eip155:1',
        decimals: 18,
        name: 'Dai Stablecoin',
        network: 'mainnet',
        networks: {
          'eip155:1': { assetId: DAI_ASSET, decimals: 18 },
          'eip155:8453': { assetId: 'eip155:8453/erc20:0x50c5725949a6f0c72e6c4a641f24049a917db0cb', decimals: 18 },
        },
        symbol: 'DAI',
        type: 'erc20',
        verified: true,
      },
      quantity: '5000000000000000000',
      value: '5.00',
    },
  ],
  failedQueries: [{ accountId: `eip155:8453:${EVM_ADDRESS}`, code: 'UPSTREAM_UNAVAILABLE', message: 'provider timeout' }],
};

describe('toLocalChainId', () => {
  it('maps eip155 chains by their CAIP-2 reference and Solana by the app-local id', () => {
    expect(toLocalChainId('eip155:1')).toBe(1);
    expect(toLocalChainId('eip155:8453')).toBe(8453);
    expect(toLocalChainId(SOLANA_MAINNET_CHAIN_ID)).toBe(SOLANA_LOCAL_CHAIN_ID);
  });

  it('has no number for an unsupported namespace', () => {
    expect(toLocalChainId('cosmos:cosmoshub-3')).toBeNull();
    expect(toLocalChainId('solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1')).toBeNull();
  });
});

describe('toCaipBalancesResult', () => {
  it('maps a two-family response into the app asset shape, keeping both families in one list', () => {
    const { userAssets } = toCaipBalancesResult(RESPONSE);

    expect(userAssets.map(({ asset }) => [asset.symbol, asset.chainId, asset.address])).toEqual([
      ['SOL', SOLANA_LOCAL_CHAIN_ID, 'So11111111111111111111111111111111111111111'],
      ['USDC', SOLANA_LOCAL_CHAIN_ID, 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'],
      ['DAI', 1, '0x6b175474e89094c44da98b954eedeac495271d0f'],
    ]);
  });

  it('preserves Solana base58 case through the asset address', () => {
    const { userAssets } = toCaipBalancesResult(RESPONSE);
    expect(userAssets[1].asset.address).toBe('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
  });

  it('carries balance, price and metadata from the one message', () => {
    const [sol] = toCaipBalancesResult(RESPONSE).userAssets;

    expect(sol).toMatchObject({
      quantity: '2500000000',
      smallBalance: false,
      updatedAt: '2026-08-03T10:05:00Z',
      value: '450.62',
    });
    expect(sol.asset).toMatchObject({
      decimals: 9,
      iconUrl: 'https://rainbow.me/sol.png',
      name: 'Solana',
      price: { changedAt: Date.parse('2026-08-03T10:00:00Z'), relativeChange24h: 1.5, value: 180.25 },
      verified: true,
    });
  });

  it('defaults the fields proto3 omits when they hold their zero value', () => {
    const [, usdc] = toCaipBalancesResult(RESPONSE).userAssets;

    expect(usdc.asset).toMatchObject({
      bridging: { bridgeable: false, networks: {} },
      colors: { primary: '' },
      price: { changedAt: 0, relativeChange24h: 0, value: 0 },
      transferable: false,
      verified: false,
    });
    expect(usdc.smallBalance).toBe(false);
  });

  it('rekeys the per-network maps from CAIP-2 onto local chain ids', () => {
    const dai = toCaipBalancesResult(RESPONSE).userAssets[2];

    expect(dai.asset.networks).toEqual({
      1: { address: '0x6b175474e89094c44da98b954eedeac495271d0f', decimals: 18 },
      8453: { address: '0x50c5725949a6f0c72e6c4a641f24049a917db0cb', decimals: 18 },
    });
    expect(dai.asset.bridging.networks).toEqual({
      8453: { bridgeable: true },
      [SOLANA_LOCAL_CHAIN_ID]: { bridgeable: false },
    });
  });

  it('reports failed accounts per (chain, address) pair rather than failing the batch', () => {
    const { failedAccounts, userAssets } = toCaipBalancesResult(RESPONSE);

    expect(failedAccounts).toEqual([
      { accountId: `eip155:8453:${EVM_ADDRESS}`, code: 'UPSTREAM_UNAVAILABLE', message: 'provider timeout' },
    ]);
    expect(userAssets).toHaveLength(3);
  });

  it('drops rows it cannot represent, and says why, instead of rendering them wrong', () => {
    const { dropped, userAssets } = toCaipBalancesResult({
      balances: [
        { asset: { chainId: 'eip155:1', symbol: 'NOID' }, quantity: '1' },
        { asset: { assetId: 'eip155:1/erc20', symbol: 'BROKEN' }, quantity: '1' },
        { asset: { assetId: 'cosmos:cosmoshub-3/slip44:118', symbol: 'ATOM' }, quantity: '1' },
        { asset: { assetId: `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/token:${USDC_SOLANA_ASSET.split(':').pop()}` }, quantity: '1' },
        { asset: { assetId: 'eip155:1/erc20:7nYabs9dUhvxYwdTnrWVBL9MYviKSfrEbdWCUbcarwQj', symbol: 'WRONGFAMILY' }, quantity: '1' },
      ],
    });

    expect(userAssets).toHaveLength(0);
    expect(dropped).toEqual([
      { assetId: undefined, reason: 'missing-asset-id' },
      { assetId: 'eip155:1/erc20', reason: 'malformed-asset-id' },
      { assetId: 'cosmos:cosmoshub-3/slip44:118', reason: 'malformed-asset-id' },
      {
        assetId: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        reason: 'unsupported-chain',
      },
      { assetId: 'eip155:1/erc20:7nYabs9dUhvxYwdTnrWVBL9MYviKSfrEbdWCUbcarwQj', reason: 'malformed-address' },
    ]);
  });

  it('returns empty results for an empty response', () => {
    expect(toCaipBalancesResult({})).toEqual({ dropped: [], failedAccounts: [], userAssets: [] });
  });
});

describe('toBalanceAccountIds', () => {
  it('carries a two-family wallet as one account list', () => {
    expect(toBalanceAccountIds({ evmAddress: EVM_ADDRESS, evmChainIds: [1, 8453], solanaAddress: SOLANA_ADDRESS })).toEqual([
      `eip155:1:${EVM_ADDRESS}`,
      `eip155:8453:${EVM_ADDRESS}`,
      `${SOLANA_MAINNET_CHAIN_ID}:${SOLANA_ADDRESS}`,
    ]);
  });

  it('omits a family whose address is absent', () => {
    expect(toBalanceAccountIds({ evmAddress: EVM_ADDRESS, evmChainIds: [1] })).toEqual([`eip155:1:${EVM_ADDRESS}`]);
    expect(toBalanceAccountIds({ evmChainIds: [], solanaAddress: SOLANA_ADDRESS })).toEqual([
      `${SOLANA_MAINNET_CHAIN_ID}:${SOLANA_ADDRESS}`,
    ]);
  });

  it('omits an address that is not well formed for its family instead of sending it', () => {
    expect(toBalanceAccountIds({ evmAddress: SOLANA_ADDRESS, evmChainIds: [1], solanaAddress: EVM_ADDRESS })).toEqual([]);
  });
});

describe('fetchCaipBalances', () => {
  it('posts the CAIP request to the chain-agnostic path and returns the translated result', async () => {
    const post = jest.fn().mockResolvedValue({ data: RESPONSE, status: 200 });
    const accounts = toBalanceAccountIds({ evmAddress: EVM_ADDRESS, evmChainIds: [1], solanaAddress: SOLANA_ADDRESS });

    const result = await fetchCaipBalances({ accounts, currency: 'USD' }, { client: { post } });

    expect(post).toHaveBeenCalledWith(CAIP_BALANCES_PATH, { accounts, currency: 'USD' }, { abortController: undefined });
    expect(result.userAssets).toHaveLength(3);
    expect(result.failedAccounts).toHaveLength(1);
  });
});
