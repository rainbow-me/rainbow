import { ETH_ADDRESS, WETH_ADDRESS } from '@/references/constants';
import type { FormattedExternalAsset } from '@/resources/assets/externalAssetsQuery';
import { ChainId } from '@/state/backendNetworks/types';

import { getTokenChartAddress, getTokenDisplayAsset, getTokenFetchAddress, getTokenIconUrl } from './tokenAssetDisplay';

describe('tokenAssetDisplay', () => {
  it('falls back to the native ETH icon and WETH chart address for mainnet ETH', () => {
    const asset = createAsset({
      address: ETH_ADDRESS,
      chainId: ChainId.mainnet,
      iconUrl: undefined,
      icon_url: undefined,
      isNativeAsset: true,
      symbol: 'ETH',
    });

    expect(getTokenIconUrl(asset)).toBe('https://rainbowme-res.cloudinary.com/image/upload/v1668565116/assets/ethereum/eth.png');
    expect(getTokenChartAddress(asset)).toBe(WETH_ADDRESS);
    expect(getTokenDisplayAsset(asset)).toEqual({
      ...asset,
      iconUrl: 'https://rainbowme-res.cloudinary.com/image/upload/v1668565116/assets/ethereum/eth.png',
      icon_url: 'https://rainbowme-res.cloudinary.com/image/upload/v1668565116/assets/ethereum/eth.png',
    });
    expect(getTokenFetchAddress({ address: ETH_ADDRESS, chainId: ChainId.mainnet })).toBe(ETH_ADDRESS);
  });

  it('normalizes mainnet ETH aliases before fetching and rendering', () => {
    const asset = createAsset({
      address: 'ethereum',
      chainId: ChainId.mainnet,
      iconUrl: undefined,
      icon_url: undefined,
      isNativeAsset: false,
      name: 'Ethereum',
      symbol: 'ETH',
    });

    expect(getTokenFetchAddress({ address: 'ethereum', chainId: ChainId.mainnet })).toBe(ETH_ADDRESS);
    expect(getTokenIconUrl(asset)).toBe('https://rainbowme-res.cloudinary.com/image/upload/v1668565116/assets/ethereum/eth.png');
    expect(getTokenChartAddress(asset)).toBe(WETH_ADDRESS);
    expect(getTokenDisplayAsset(asset).address).toBe(ETH_ADDRESS);
  });

  it('preserves explicit icon and chart addresses for ERC-20 tokens', () => {
    const asset = createAsset({
      address: '0xabc',
      chainId: ChainId.mainnet,
      iconUrl: 'https://example.com/token.png',
      icon_url: undefined,
      isNativeAsset: false,
      symbol: 'TKN',
    });

    expect(getTokenIconUrl(asset)).toBe('https://example.com/token.png');
    expect(getTokenChartAddress(asset)).toBe('0xabc');
  });
});

function createAsset(overrides: Partial<FormattedExternalAsset>): FormattedExternalAsset {
  return {
    address: '0xabc',
    chainId: ChainId.mainnet,
    colors: { primary: '#808088' },
    decimals: 18,
    iconUrl: undefined,
    icon_url: undefined,
    isNativeAsset: false,
    name: 'Token',
    native: { change: '', price: { amount: '1', display: '$1.00' } },
    networks: {},
    price: { relativeChange24h: 0, value: 1 },
    symbol: 'TKN',
    transferable: true,
    ...overrides,
  };
}
