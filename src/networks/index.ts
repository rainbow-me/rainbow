import { ChainId } from '@/__swaps__/types/chains';
import store from '@/redux/store';
import * as ls from '@/storage';
import { getArbitrumNetworkObject } from './arbitrum';
import { getAvalancheNetworkObject } from './avalanche';
import { getBaseNetworkObject } from './base';
import { getBlastNetworkObject } from './blast';
import { getBSCNetworkObject } from './bsc';
import { getDegenNetworkObject } from './degen';
import { getGnosisNetworkObject } from './gnosis';
import { getGoerliNetworkObject } from './goerli';
import { getMainnetNetworkObject } from './mainnet';
import { getOptimismNetworkObject } from './optimism';
import { getPolygonNetworkObject } from './polygon';
import { Network, NetworkProperties } from './types';
import { getZoraNetworkObject } from './zora';

/**
 * Array of all Rainbow Networks
 * the ordering is the default sorting
 */
export const RainbowNetworks = [
  getMainnetNetworkObject(),
  getArbitrumNetworkObject(),
  getBaseNetworkObject(),
  getOptimismNetworkObject(),
  getPolygonNetworkObject(),
  getZoraNetworkObject(),
  getGnosisNetworkObject(),
  getGoerliNetworkObject(),
  getBSCNetworkObject(),
  getAvalancheNetworkObject(),
  getBlastNetworkObject(),
  getDegenNetworkObject(),
];

/**
 * Helper function to get specific Rainbow Network's Object
 */
export function getNetworkObj(network: Network): NetworkProperties {
  switch (network) {
    // Mainnet
    case Network.mainnet:
      return getMainnetNetworkObject();

    // L2s
    case Network.arbitrum:
      return getArbitrumNetworkObject();
    case Network.base:
      return getBaseNetworkObject();
    case Network.bsc:
      return getBSCNetworkObject();
    case Network.optimism:
      return getOptimismNetworkObject();
    case Network.polygon:
      return getPolygonNetworkObject();
    case Network.zora:
      return getZoraNetworkObject();
    case Network.gnosis:
      return getGnosisNetworkObject();
    case Network.avalanche:
      return getAvalancheNetworkObject();
    case Network.blast:
      return getBlastNetworkObject();
    case Network.degen:
      return getDegenNetworkObject();
    // Testnets
    case Network.goerli:
      return getGoerliNetworkObject();

    // Fallback
    default:
      return getMainnetNetworkObject();
  }
}

export function getNetworkObject({ chainId }: { chainId: ChainId }): NetworkProperties {
  switch (chainId) {
    // Mainnet
    case ChainId.mainnet:
      return getMainnetNetworkObject();

    // L2s
    case ChainId.arbitrum:
      return getArbitrumNetworkObject();
    case ChainId.base:
      return getBaseNetworkObject();
    case ChainId.bsc:
      return getBSCNetworkObject();
    case ChainId.optimism:
      return getOptimismNetworkObject();
    case ChainId.polygon:
      return getPolygonNetworkObject();
    case ChainId.zora:
      return getZoraNetworkObject();
    case ChainId.gnosis:
      return getGnosisNetworkObject();
    case ChainId.avalanche:
      return getAvalancheNetworkObject();
    case ChainId.blast:
      return getBlastNetworkObject();
    case ChainId.degen:
      return getDegenNetworkObject();
    // Testnets
    case ChainId.goerli:
      return getGoerliNetworkObject();

    // Fallback
    default:
      return getMainnetNetworkObject();
  }
}

/**
 * Sorts Networks based on addresses assets
 */
export function sortNetworks(): NetworkProperties[] {
  const accountAddress = store.getState().settings.accountAddress;

  // sorting based on # of tokens
  const tokenSort = (network1: NetworkProperties, network2: NetworkProperties) => {
    const count1 = ls.account.get([accountAddress, network1.value, 'totalTokens']) || 0;
    const count2 = ls.account.get([accountAddress, network2.value, 'totalTokens']) || 0;

    return count1 > count2 ? -1 : 1;
  };

  return RainbowNetworks.sort(tokenSort);
}

export function getSwappableNetworks(): NetworkProperties[] {
  return RainbowNetworks.filter(network => network.features.swaps);
}

export const RainbowNetworkByChainId = RainbowNetworks.reduce(
  (acc, network) => {
    acc[network.id] = network;
    return acc;
  },
  {} as Record<ChainId, NetworkProperties>
);
