import { uniqBy } from 'lodash';
import { Address } from 'viem';
import { isNativeAsset } from '@/handlers/assets';
import { ChainId } from '@/state/backendNetworks/types';
import { SearchAsset } from '@/__swaps__/types/search';

export function parseTokenSearchResults(assets: SearchAsset[], chainId?: ChainId): SearchAsset[] {
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
      const mainnetInfo = asset.networks[ChainId.mainnet];
      const address = asset.address;
      const chainId = asset.chainId;
      const uniqueId = `${address}_${chainId}`;

      results.push({
        ...asset,
        isNativeAsset: isNativeAsset(address, chainId),
        mainnetAddress: mainnetInfo ? mainnetInfo.address : chainId === ChainId.mainnet ? address : ('' as Address),
        uniqueId,
      });
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
    const firstNetworkInfo = assetNetworks[firstNetworkChainId];
    const chainId = mainnetInfo ? ChainId.mainnet : firstNetworkChainId;
    const address = mainnetInfo ? mainnetInfo.address : firstNetworkInfo?.address || asset.address;
    const decimals = mainnetInfo ? mainnetInfo.decimals : firstNetworkInfo?.decimals || asset.decimals;
    const uniqueId = `${address}_${chainId}`;

    return {
      ...asset,
      address,
      chainId,
      decimals,
      isNativeAsset: isNativeAsset(address, chainId),
      mainnetAddress: mainnetInfo ? mainnetInfo.address : chainId === ChainId.mainnet ? address : ('' as Address),
      uniqueId,
    };
  });
  const uniqRes = uniqBy(results, 'address');
  return uniqRes;
}
