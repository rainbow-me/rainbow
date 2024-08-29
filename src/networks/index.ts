import { ChainId } from '@/networks/types';
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
import { NetworkProperties } from './types';
import { getZoraNetworkObject } from './zora';

/**
 * Array of all Rainbow Networks
 * the ordering is the default sorting
 */
export const RainbowNetworkObjects = [
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

export const RainbowSupportedChainIds = [
  ChainId.mainnet,
  ChainId.arbitrum,
  ChainId.base,
  ChainId.optimism,
  ChainId.polygon,
  ChainId.zora,
  ChainId.gnosis,
  ChainId.goerli,
  ChainId.bsc,
  ChainId.avalanche,
  ChainId.blast,
  ChainId.degen,
];

/**
 * Helper function to get specific Rainbow Network's Object
 */
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

  return RainbowNetworkObjects.sort(tokenSort);
}

export function getSwappableNetworks(): NetworkProperties[] {
  return RainbowNetworkObjects.filter(network => network.features.swaps);
}

export const RainbowNetworkByChainId = RainbowNetworkObjects.reduce(
  (acc, network) => {
    acc[network.id] = network;
    return acc;
  },
  {} as Record<ChainId, NetworkProperties>
);
