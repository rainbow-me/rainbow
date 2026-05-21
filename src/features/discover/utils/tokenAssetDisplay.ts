import { ETH_ADDRESS, WETH_ADDRESS } from '@/references/constants';
import type { FormattedExternalAsset } from '@/resources/assets/externalAssetsQuery';
import { ChainId } from '@/state/backendNetworks/types';

const ETH_ICON_URL = 'https://rainbowme-res.cloudinary.com/image/upload/v1668565116/assets/ethereum/eth.png';

export function getTokenChartAddress(asset: FormattedExternalAsset): string {
  return isMainnetEth(asset) ? WETH_ADDRESS : asset.address;
}

export function getTokenIconUrl(asset: FormattedExternalAsset): string | undefined {
  return asset.iconUrl || asset.icon_url || (isMainnetEth(asset) ? ETH_ICON_URL : undefined);
}

function isMainnetEth(asset: Pick<FormattedExternalAsset, 'address' | 'chainId' | 'isNativeAsset' | 'symbol'>): boolean {
  return (
    asset.chainId === ChainId.mainnet && (asset.address.toLowerCase() === ETH_ADDRESS || (asset.isNativeAsset && asset.symbol === 'ETH'))
  );
}
