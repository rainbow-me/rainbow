import { ArbitrumNetworkObject } from './arbitrum';
import { BSCNetworkObject } from './bsc';
import { MainnetNetworkObject } from './mainnet';
import { GoerliNetworkObject } from './goerli';
import { OptimismNetworkObject } from './optimism';
import { PolygonNetworkObject } from './polygon';
import { Network, NetworkProperties } from './types';
import { ZoraNetworkObject } from './zora';
import { GnosisNetworkObject } from './gnosis';
import store from '@/redux/store';
import * as ls from '@/storage';

/**
 * Array of all Rainbow Networks
 * the ordering is the default sorting
 */
export const RainbowNetworks = [
  MainnetNetworkObject,
  ArbitrumNetworkObject,
  OptimismNetworkObject,
  PolygonNetworkObject,
  ZoraNetworkObject,
  GnosisNetworkObject,
  GoerliNetworkObject,
  BSCNetworkObject,
];

/**
 * Helper function to get specific Rainbow Network's Object
 */
export function getNetworkObj(network: Network): NetworkProperties {
  switch (network) {
    // L2s
    case Network.arbitrum:
      return ArbitrumNetworkObject;
    case Network.bsc:
      return BSCNetworkObject;
    case Network.optimism:
      return OptimismNetworkObject;
    case Network.polygon:
      return PolygonNetworkObject;
    case Network.zora:
      return ZoraNetworkObject;
    case Network.gnosis:
      return GnosisNetworkObject;

    // Testnets
    case Network.goerli:
      return GoerliNetworkObject;

    // Mainnet
    default:
      return MainnetNetworkObject;
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
      ls.assets.get([accountAddress, network1.value, 'totalTokens']) || 0;
    const count2 =
      ls.assets.get([accountAddress, network2.value, 'totalTokens']) || 0;

    if (overrideNetwork && network1.value === overrideNetwork) {
      return -1;
    }

    return count1 > count2 ? -1 : 1;
  };

  return RainbowNetworks.sort(tokenSort);
}
