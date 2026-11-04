import { describe, expect, it } from 'vitest';

import { ChainId } from '@/features/network/types/backendNetworks';

import {
  toChainSearchResults,
  toCrosschainSearchResults,
  toSearchAsset,
  toSearchAssetDeployments,
  type NativeAssetByChain,
  type TokenSearchInstance,
  type TokenSearchItem,
  type TokenSearchResult,
  type TokenSearchToken,
} from './tokenSearch';

const ZERO = '0x0000000000000000000000000000000000000000';
const POL = '0x0000000000000000000000000000000000001010';
const ARC = 5042 as ChainId;

const NATIVE_ASSET_BY_CHAIN: NativeAssetByChain = {
  [ChainId.mainnet]: { address: 'eth' },
  [ChainId.base]: { address: ZERO },
  [ChainId.bsc]: { address: ZERO },
  [ChainId.polygon]: { address: POL },
  [ARC]: { address: ZERO },
};

const USDC_MAINNET = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const USDC_BASE = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
const USDC_BSC = '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d';
const WETH_BASE = '0x4200000000000000000000000000000000000006';

function erc20(chainId: number, address: string, decimals = 6): TokenSearchInstance {
  return { assetId: `eip155:${chainId}/erc20:${address}`, decimals };
}

function native(chainId: number, address: string, decimals = 18): TokenSearchInstance {
  return { assetId: `eip155:${chainId}/native:${address}`, decimals };
}

function item(token: Partial<TokenSearchToken> & Pick<TokenSearchToken, 'instances'>): TokenSearchItem {
  return {
    id: 'token:any',
    token: { name: 'USD Coin', symbol: 'USDC', verification: 'VERIFICATION_STATUS_VERIFIED', risk: { level: 'RISK_LEVEL_NONE' }, ...token },
  };
}

// Base first and mainnet second, as when Base is the preferred chain
const USDC = item({ instances: [erc20(ChainId.base, USDC_BASE), erc20(ChainId.mainnet, USDC_MAINNET), erc20(ChainId.bsc, USDC_BSC, 18)] });

describe('toSearchAsset', () => {
  it.each([
    {
      name: 'opens the requested chain even when it is not the first instance, with its own address and decimals',
      input: USDC,
      chainId: ChainId.bsc,
      expected: { address: USDC_BSC, chainId: ChainId.bsc, decimals: 18, uniqueId: `${USDC_BSC}_${ChainId.bsc}` },
    },
    {
      name: 'opens the first instance when the requested chain is absent',
      input: USDC,
      chainId: ChainId.polygon,
      expected: { address: USDC_BASE, chainId: ChainId.base, decimals: 6, uniqueId: `${USDC_BASE}_${ChainId.base}` },
    },
    {
      name: 'opens the first instance with no requested chain',
      input: USDC,
      chainId: undefined,
      expected: { address: USDC_BASE, chainId: ChainId.base, decimals: 6 },
    },
  ])('$name', ({ input, chainId, expected }) => {
    expect(toSearchAsset(input, NATIVE_ASSET_BY_CHAIN, chainId)).toMatchObject(expected);
  });

  it('maps every instance to networks and the mainnet one to mainnetAddress', () => {
    expect(toSearchAsset(USDC, NATIVE_ASSET_BY_CHAIN)).toMatchObject({
      mainnetAddress: USDC_MAINNET,
      networks: {
        [ChainId.base]: { address: USDC_BASE, decimals: 6 },
        [ChainId.mainnet]: { address: USDC_MAINNET, decimals: 6 },
        [ChainId.bsc]: { address: USDC_BSC, decimals: 18 },
      },
    });
    expect(toSearchAsset(item({ instances: [erc20(ChainId.base, USDC_BASE)] }), NATIVE_ASSET_BY_CHAIN)?.mainnetAddress).toBe('');
  });

  it.each([
    { name: 'ETH on mainnet', instance: native(ChainId.mainnet, 'eth'), address: 'eth', chainId: ChainId.mainnet, decimals: 18 },
    { name: 'ETH on Base', instance: native(ChainId.base, ZERO), address: ZERO, chainId: ChainId.base, decimals: 18 },
    { name: 'POL on Polygon', instance: native(ChainId.polygon, POL), address: POL, chainId: ChainId.polygon, decimals: 18 },
    { name: 'USDC as the gas coin on Arc', instance: native(ARC, ZERO, 18), address: ZERO, chainId: ARC, decimals: 18 },
  ])('maps the native coin $name to the app native address', ({ instance, address, chainId, decimals }) => {
    expect(toSearchAsset(item({ instances: [instance] }), NATIVE_ASSET_BY_CHAIN)).toMatchObject({
      address,
      chainId,
      decimals,
      isNativeAsset: true,
      uniqueId: `${address}_${chainId}`,
    });
  });

  it('keeps a contract as a lowercase, non-native ERC-20', () => {
    const checksummed = item({ instances: [erc20(ChainId.base, `0x${USDC_BASE.slice(2).toUpperCase()}`)] });
    expect(toSearchAsset(checksummed, NATIVE_ASSET_BY_CHAIN)).toMatchObject({
      address: USDC_BASE,
      isNativeAsset: false,
      networks: { [ChainId.base]: { address: USDC_BASE } },
      uniqueId: `${USDC_BASE}_${ChainId.base}`,
    });
  });

  it.each([
    { name: 'a Solana mint', assetId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
    { name: 'a chain the app does not support', assetId: `eip155:999999/erc20:${USDC_BASE}` },
    { name: 'a non-numeric chain', assetId: `eip155:abc/erc20:${USDC_BASE}` },
    { name: 'an unknown namespace', assetId: `eip155:8453/ERC20:${USDC_BASE}` },
    { name: 'a short contract address', assetId: 'eip155:8453/erc20:0x833589' },
    { name: 'the zero address as a contract', assetId: `eip155:${ChainId.mainnet}/erc20:${ZERO}` },
    { name: 'the native address as a contract', assetId: `eip155:${ChainId.polygon}/erc20:${POL}` },
    { name: 'a native coin at another address than the app uses', assetId: `eip155:${ChainId.base}/native:eth` },
    { name: 'a native coin at the zero address where the app uses eth', assetId: `eip155:${ChainId.mainnet}/native:${ZERO}` },
    { name: 'out-of-range decimals', assetId: `eip155:8453/erc20:${USDC_BASE}`, decimals: 256 },
    { name: 'negative decimals', assetId: `eip155:8453/erc20:${USDC_BASE}`, decimals: -1 },
    { name: 'fractional decimals', assetId: `eip155:8453/erc20:${USDC_BASE}`, decimals: 1.5 },
  ])('drops an instance with $name, and the token when no instance is left', ({ assetId, decimals = 6 }) => {
    const rejected = { assetId, decimals };
    expect(toSearchAsset(item({ instances: [rejected] }), NATIVE_ASSET_BY_CHAIN)).toBeNull();

    const asset = toSearchAsset(item({ instances: [rejected, erc20(ChainId.mainnet, USDC_MAINNET)] }), NATIVE_ASSET_BY_CHAIN);
    expect(asset).toMatchObject({ chainId: ChainId.mainnet });
    expect(Object.keys(asset?.networks ?? {})).toEqual([String(ChainId.mainnet)]);
  });

  it('accepts 255 decimals', () => {
    expect(toSearchAsset(item({ instances: [erc20(ChainId.base, USDC_BASE, 255)] }), NATIVE_ASSET_BY_CHAIN)?.decimals).toBe(255);
  });

  it('opens and lists the first instance when a chain repeats', () => {
    const asset = toSearchAsset(
      item({ instances: [erc20(ChainId.base, USDC_BASE), erc20(ChainId.base, WETH_BASE, 18)] }),
      NATIVE_ASSET_BY_CHAIN,
      ChainId.base
    );
    expect(asset).toMatchObject({ address: USDC_BASE, decimals: 6, networks: { [ChainId.base]: { address: USDC_BASE, decimals: 6 } } });
  });

  it('reads absent decimals as 0', () => {
    expect(toSearchAsset(item({ instances: [{ assetId: `eip155:8453/erc20:${USDC_BASE}` }] }), NATIVE_ASSET_BY_CHAIN)?.decimals).toBe(0);
  });

  it.each([
    { name: 'a scam', token: { verification: 'VERIFICATION_STATUS_SCAM' as const } },
    {
      name: 'a spoof of a protected symbol',
      token: {
        verification: 'VERIFICATION_STATUS_UNVERIFIED' as const,
        risk: { level: 'RISK_LEVEL_HIGH' as const, reasons: ['protected_symbol'] },
      },
    },
    { name: 'a token with no symbol', token: { name: undefined, symbol: undefined } },
    { name: 'a token with no instances', token: { instances: [] } },
  ])('drops $name', ({ token }) => {
    expect(toSearchAsset(item({ instances: [erc20(ChainId.base, USDC_BASE)], ...token }), NATIVE_ASSET_BY_CHAIN)).toBeNull();
  });

  it.each([
    { name: 'a caution-level token', risk: { level: 'RISK_LEVEL_CAUTION' as const } },
    { name: 'a token with no risk', risk: undefined },
  ])('keeps $name', ({ risk }) => {
    expect(toSearchAsset(item({ risk, instances: [erc20(ChainId.base, USDC_BASE)] }), NATIVE_ASSET_BY_CHAIN)).not.toBeNull();
  });

  it('drops an item that is not a token', () => {
    expect(toSearchAsset({ id: 'perp:hyperliquid:ETH' }, NATIVE_ASSET_BY_CHAIN)).toBeNull();
  });

  it.each([
    { verification: 'VERIFICATION_STATUS_VERIFIED' as const, isVerified: true },
    { verification: 'VERIFICATION_STATUS_UNVERIFIED' as const, isVerified: false },
    { verification: 'VERIFICATION_STATUS_INCONCLUSIVE' as const, isVerified: false },
    { verification: undefined, isVerified: false },
  ])('maps $verification to isVerified $isVerified', ({ verification, isVerified }) => {
    expect(toSearchAsset(item({ verification, instances: [erc20(ChainId.base, USDC_BASE)] }), NATIVE_ASSET_BY_CHAIN)?.isVerified).toBe(
      isVerified
    );
  });
});

describe('toSearchAssetDeployments', () => {
  it('maps each deployment to its own result on its chain, in the order the backend lists them', () => {
    const result: TokenSearchResult = {
      sections: [
        { type: 'SECTION_TYPE_TOP', items: [USDC] },
        { type: 'SECTION_TYPE_TOKENS', items: [item({ symbol: 'WETH', instances: [erc20(ChainId.base, WETH_BASE, 18)] })] },
      ],
    };

    const deployments = toSearchAssetDeployments(result, NATIVE_ASSET_BY_CHAIN);

    expect(deployments.map(asset => [asset.symbol, asset.chainId, asset.address, asset.decimals, asset.uniqueId])).toEqual([
      ['USDC', ChainId.base, USDC_BASE, 6, `${USDC_BASE}_${ChainId.base}`],
      ['USDC', ChainId.mainnet, USDC_MAINNET, 6, `${USDC_MAINNET}_${ChainId.mainnet}`],
      ['USDC', ChainId.bsc, USDC_BSC, 18, `${USDC_BSC}_${ChainId.bsc}`],
      ['WETH', ChainId.base, WETH_BASE, 18, `${WETH_BASE}_${ChainId.base}`],
    ]);
    expect(new Set(deployments.slice(0, 3).map(asset => Object.keys(asset.networks).length))).toEqual(new Set([3]));
  });

  it("lists a chain once and skips deployments the app can't open", () => {
    const token = item({
      instances: [
        erc20(ChainId.base, USDC_BASE),
        erc20(ChainId.base, WETH_BASE, 18),
        { assetId: `eip155:999999/erc20:${USDC_BASE}`, decimals: 6 },
        erc20(ChainId.mainnet, USDC_MAINNET),
      ],
    });

    const deployments = toSearchAssetDeployments({ sections: [{ type: 'SECTION_TYPE_TOP', items: [token] }] }, NATIVE_ASSET_BY_CHAIN);

    expect(deployments.map(asset => [asset.chainId, asset.address])).toEqual([
      [ChainId.base, USDC_BASE],
      [ChainId.mainnet, USDC_MAINNET],
    ]);
  });
});

describe('swap results', () => {
  const verifiedOnBase = item({ symbol: 'USDBC', instances: [erc20(ChainId.base, '0x' + '9'.repeat(40))] });
  const unverifiedOnBase = item({
    symbol: 'USDCX',
    verification: 'VERIFICATION_STATUS_UNVERIFIED',
    instances: [erc20(ChainId.base, '0x' + '1'.repeat(40))],
  });
  const inconclusiveOnBase = item({
    symbol: 'USDC2',
    verification: 'VERIFICATION_STATUS_INCONCLUSIVE',
    instances: [erc20(ChainId.base, '0x' + '2'.repeat(40))],
  });
  const verifiedOnMainnet = item({ symbol: 'USDC', instances: [erc20(ChainId.mainnet, '0x' + '3'.repeat(40))] });
  const verifiedNamedOnMainnet = item({
    symbol: 'USDC.E',
    name: 'USD Coin (Bridged)',
    instances: [erc20(ChainId.mainnet, '0x' + '4'.repeat(40))],
  });
  const verifiedFuzzyOnMainnet = item({
    symbol: 'USDCE',
    name: 'Bridged USDC',
    instances: [erc20(ChainId.mainnet, '0x' + '5'.repeat(40))],
  });
  const unverifiedExactOnMainnet = item({
    symbol: 'USDC',
    verification: 'VERIFICATION_STATUS_UNVERIFIED',
    instances: [erc20(ChainId.mainnet, '0x' + '6'.repeat(40))],
  });
  const scamOnBase = item({ verification: 'VERIFICATION_STATUS_SCAM', instances: [erc20(ChainId.base, '0x' + '7'.repeat(40))] });

  const result: TokenSearchResult = {
    sections: [
      { type: 'SECTION_TYPE_TOP', items: [USDC] },
      {
        type: 'SECTION_TYPE_TOKENS',
        items: [
          verifiedOnBase,
          unverifiedOnBase,
          verifiedOnMainnet,
          scamOnBase,
          inconclusiveOnBase,
          verifiedNamedOnMainnet,
          verifiedFuzzyOnMainnet,
          unverifiedExactOnMainnet,
        ],
      },
      // A section type added after this client shipped
      { type: 'SECTION_TYPE_PERPS' as 'SECTION_TYPE_TOKENS', items: [item({ instances: [erc20(ChainId.base, '0x' + '8'.repeat(40))] })] },
    ],
  };

  it('splits results deployed on the output chain by verification, in display order, opened on that chain', () => {
    const { verified, unverified } = toChainSearchResults(result, ChainId.bsc, NATIVE_ASSET_BY_CHAIN);
    expect(verified.map(asset => [asset.symbol, asset.chainId, asset.address, asset.decimals])).toEqual([
      ['USDC', ChainId.bsc, USDC_BSC, 18],
    ]);
    expect(unverified).toEqual([]);

    const onBase = toChainSearchResults(result, ChainId.base, NATIVE_ASSET_BY_CHAIN);
    expect(onBase.verified.map(asset => asset.symbol)).toEqual(['USDC', 'USDBC']);
    expect(onBase.unverified.map(asset => asset.symbol)).toEqual(['USDCX', 'USDC2']);
  });

  it.each([
    { name: 'symbol', query: ' USDC ', expected: ['USDC'] },
    { name: 'name', query: 'usd coin (bridged)', expected: ['USDC.E'] },
    { name: 'address of any deployment', query: '0x' + '4'.repeat(40), expected: ['USDC.E'] },
  ])('keeps verified results on other chains that exactly match by $name', ({ query, expected }) => {
    expect(toCrosschainSearchResults(result, query, ChainId.base, NATIVE_ASSET_BY_CHAIN).map(asset => asset.symbol)).toEqual(expected);
  });

  it('matches a pasted address against a deployment other than the one the result opens', () => {
    const results = toCrosschainSearchResults(result, USDC_MAINNET, ChainId.polygon, NATIVE_ASSET_BY_CHAIN);
    expect(results.map(asset => [asset.symbol, asset.chainId, asset.address])).toEqual([['USDC', ChainId.base, USDC_BASE]]);
  });

  it('excludes cross-chain results deployed on the output chain', () => {
    expect(toCrosschainSearchResults(result, USDC_BSC, ChainId.bsc, NATIVE_ASSET_BY_CHAIN)).toEqual([]);
    expect(toCrosschainSearchResults(result, 'usdc', ChainId.bsc, NATIVE_ASSET_BY_CHAIN).map(asset => asset.address)).toEqual([
      '0x' + '3'.repeat(40),
    ]);
  });
});
