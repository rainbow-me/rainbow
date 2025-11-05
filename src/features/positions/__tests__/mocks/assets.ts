import type { Asset } from '../../types/generated/common/asset';
import type { PositionAsset } from '../../types';

export function createMockPositionAsset(symbol: string, price: number, overrides?: Partial<PositionAsset>): PositionAsset {
  const chainId = overrides?.chainId ?? 1;
  const address = overrides?.address ?? symbol.toLowerCase();
  return {
    address,
    chainId,
    uniqueId: `${address}_${chainId}`,
    name: overrides?.name ?? symbol,
    symbol,
    decimals: overrides?.decimals ?? 18,
    type: overrides?.type ?? 'erc20',
    icon_url: overrides?.icon_url ?? `https://example.com/$${symbol}.png`,
    network: overrides?.network ?? 'ethereum',
    mainnetAddress: overrides?.mainnetAddress ?? address,
    verified: overrides?.verified ?? true,
    transferable: overrides?.transferable ?? true,
    creationDate: overrides?.creationDate ?? '2024-01-01T00:00:00Z',
    colors: overrides?.colors ?? {
      primary: '#000000',
      fallback: '#ffffff',
      shadow: '#000000',
    },
    price: overrides?.price ?? {
      value: price,
      changed_at: undefined,
      relative_change_24h: 0,
    },
    networks: overrides?.networks ?? {},
    bridging: overrides?.bridging ?? undefined,
  };
}

export function createMockAsset(symbol: string, price: number, overrides?: Partial<Asset>): Asset {
  return {
    address: symbol.toLowerCase(),
    chainId: 1,
    name: symbol,
    symbol,
    decimals: 18,
    type: 'erc20',
    iconUrl: `https://example.com/${symbol}.png`,
    network: 'ethereum',
    mainnetAddress: symbol.toLowerCase(),
    verified: true,
    transferable: true,
    creationDate: '2024-01-01T00:00:00Z',
    colors: {
      primary: '#000000',
      fallback: '#ffffff',
    },
    price: {
      value: price,
      changedAt: undefined,
      relativeChange24h: 0,
    },
    networks: {},
    bridging: undefined,
    ...overrides,
  };
}
