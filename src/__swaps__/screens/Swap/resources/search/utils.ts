import { ChainId } from '@/chains/types';
import { SearchAsset } from '@/__swaps__/types/search';
import {
  ARBITRUM_ETH_ADDRESS,
  AVAX_AVALANCHE_ADDRESS,
  BASE_ETH_ADDRESS,
  BLAST_ETH_ADDRESS,
  BNB_BSC_ADDRESS,
  DEGEN_CHAIN_DEGEN_ADDRESS,
  ETH_ADDRESS,
  MATIC_POLYGON_ADDRESS,
  OPTIMISM_ETH_ADDRESS,
  ZORA_ETH_ADDRESS,
} from '@/references';
import { Address } from 'viem';

const NATIVE_ASSET_UNIQUE_IDS = new Set([
  `${ETH_ADDRESS}_${ChainId.mainnet}`,
  `${OPTIMISM_ETH_ADDRESS}_${ChainId.optimism}`,
  `${ARBITRUM_ETH_ADDRESS}_${ChainId.arbitrum}`,
  `${BNB_BSC_ADDRESS}_${ChainId.bsc}`,
  `${MATIC_POLYGON_ADDRESS}_${ChainId.polygon}`,
  `${BASE_ETH_ADDRESS}_${ChainId.base}`,
  `${ZORA_ETH_ADDRESS}_${ChainId.zora}`,
  `${AVAX_AVALANCHE_ADDRESS}_${ChainId.avalanche}`,
  `${BLAST_ETH_ADDRESS}_${ChainId.blast}`,
  `${DEGEN_CHAIN_DEGEN_ADDRESS}_${ChainId.degen}`,
]);

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
        isNativeAsset: NATIVE_ASSET_UNIQUE_IDS.has(uniqueId),
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
          isNativeAsset: NATIVE_ASSET_UNIQUE_IDS.has(uniqueId),
          mainnetAddress: mainnetInfo ? mainnetInfo.address : networkChainId === ChainId.mainnet ? address : ('' as Address),
          uniqueId,
        });
      }
    }
  }

  return results;
}
