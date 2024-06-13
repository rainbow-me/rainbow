import { getArbitrumNetworkObject } from './arbitrum';
import { getBSCNetworkObject } from './bsc';
import { getMainnetNetworkObject } from './mainnet';
import { getGoerliNetworkObject } from './goerli';
import { getOptimismNetworkObject } from './optimism';
import { getPolygonNetworkObject } from './polygon';
import { Network, NetworkProperties } from './types';
import { getZoraNetworkObject } from './zora';
import { getGnosisNetworkObject } from './gnosis';
import { getBaseNetworkObject } from './base';
import { getAvalancheNetworkObject } from './avalanche';
import { getBlastNetworkObject } from './blast';
import { getDegenNetworkObject } from './degen';
import store from '@/redux/store';
import * as ls from '@/storage';

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
