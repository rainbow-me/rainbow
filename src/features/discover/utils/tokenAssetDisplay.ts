import { ETH_ADDRESS, WETH_ADDRESS } from '@/references/constants';
import { ETH_ICON_URL, getMainnetEthFetchAddress, isMainnetEthAddress } from '@/resources/assets/ethereumAsset';
import type { FormattedExternalAsset } from '@/resources/assets/externalAssetsQuery';
import { ChainId } from '@/state/backendNetworks/types';

export function getTokenFetchAddress({ address, chainId }: { address: string; chainId: ChainId }): string {
  return getMainnetEthFetchAddress({ address, chainId });
}

export function getTokenDisplayAsset(asset: FormattedExternalAsset): FormattedExternalAsset {
  if (!isMainnetEth(asset)) return asset;

  const iconUrl = getTokenIconUrl(asset);
  return {
    ...asset,
    address: ETH_ADDRESS,
    iconUrl,
    icon_url: iconUrl,
    isNativeAsset: true,
  };
}

export function getTokenChartAddress(asset: FormattedExternalAsset): string {
  return isMainnetEth(asset) ? WETH_ADDRESS : asset.address;
}

export function getTokenIconUrl(asset: FormattedExternalAsset): string | undefined {
  return asset.iconUrl || asset.icon_url || (isMainnetEth(asset) ? ETH_ICON_URL : undefined);
}

function isMainnetEth(asset: Pick<FormattedExternalAsset, 'address' | 'chainId' | 'isNativeAsset' | 'name' | 'symbol'>): boolean {
  return (
    asset.chainId === ChainId.mainnet &&
    (isMainnetEthAddress(asset.address, asset.chainId) ||
      (asset.isNativeAsset && asset.symbol === 'ETH') ||
      (asset.symbol === 'ETH' && asset.name === 'Ethereum'))
  );
}
