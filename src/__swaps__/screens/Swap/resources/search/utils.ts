import { uniqBy } from 'lodash';
import { ChainId } from '@/state/backendNetworks/types';
import { SearchAsset } from '@/__swaps__/types/search';
import { Address } from 'viem';
import { isNativeAsset } from '@/handlers/assets';

export function parseTokenSearch(assets: SearchAsset[], chainId?: ChainId): SearchAsset[] {
  const results: SearchAsset[] = [];

  if (chainId !== undefined) {
    for (const asset of assets) {
      const assetNetworks = asset.networks;
      const mainnetInfo = assetNetworks[ChainId.mainnet];
      const networkInfo = assetNetworks[chainId];
      const address = networkInfo ? networkInfo.address : asset.address;
      const uniqueId = `${address}_${chainId}`;

      results.push({
        ...asset,
        address,
        chainId,
        decimals: networkInfo ? networkInfo.decimals : asset.decimals,
        isNativeAsset: isNativeAsset(address, chainId),
        mainnetAddress: mainnetInfo ? mainnetInfo.address : chainId === ChainId.mainnet ? address : ('' as Address),
        uniqueId,
      });
    }
  } else {
    for (const asset of assets) {
      const assetNetworks = asset.networks;
      const mainnetInfo = assetNetworks[ChainId.mainnet];
      for (const chainIdString in assetNetworks) {
        const networkChainId = parseInt(chainIdString);
        const networkInfo = assetNetworks[networkChainId];
        const address = networkInfo ? networkInfo.address : asset.address;
        const uniqueId = `${address}_${networkChainId}`;

        results.push({
          ...asset,
          address,
          chainId: networkChainId,
          decimals: networkInfo ? networkInfo.decimals : asset.decimals,
          isNativeAsset: isNativeAsset(address, networkChainId),
          mainnetAddress: mainnetInfo ? mainnetInfo.address : networkChainId === ChainId.mainnet ? address : ('' as Address),
          uniqueId,
        });
      }
    }
  }

  return results;
}

export function parseTokenSearchAcrossNetworks(assets: SearchAsset[]): SearchAsset[] {
  const results = assets.map(asset => {
    const assetNetworks = asset.networks;
    const networkKeys = Object.keys(assetNetworks);
    const firstNetworkChainId = Number(networkKeys[0] || asset.chainId);

    const mainnetInfo = assetNetworks[ChainId.mainnet];
    const chainId = mainnetInfo ? ChainId.mainnet : firstNetworkChainId;
    const address = mainnetInfo ? mainnetInfo.address : assetNetworks[firstNetworkChainId]?.address || asset.address;
    const uniqueId = `${address}_${chainId}`;

    return {
      ...asset,
      chainId,
      address,
      isNativeAsset: isNativeAsset(address, chainId),
      mainnetAddress: mainnetInfo ? mainnetInfo.address : chainId === ChainId.mainnet ? address : ('' as Address),
      uniqueId,
    };
  });
  const uniqRes = uniqBy(results, 'address');
  return uniqRes;
}
