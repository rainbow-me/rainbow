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
];

/**
 * Helper function to get specific Rainbow Network's Object
 */
export function getNetworkObj(network: Network): NetworkProperties {
  switch (network) {
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

    // Testnets
    case Network.goerli:
      return getGoerliNetworkObject();

    // Mainnet
    default:
      return getMainnetNetworkObject();
  }
}

/**
 * Sorts Networks based on addresses assets
 */
export function sortNetworks(overrideNetwork?: Network): NetworkProperties[] {
  const accountAddress = store.getState().settings.accountAddress;

  // sorting based on # of tokens
  const tokenSort = (
    network1: NetworkProperties,
    network2: NetworkProperties
  ) => {
    const count1 =
      ls.account.get([accountAddress, network1.value, 'totalTokens']) || 0;
    const count2 =
      ls.account.get([accountAddress, network2.value, 'totalTokens']) || 0;

    if (overrideNetwork && network1.value === overrideNetwork) {
      return -1;
    }

    return count1 > count2 ? -1 : 1;
  };

  return RainbowNetworks.sort(tokenSort);
}
