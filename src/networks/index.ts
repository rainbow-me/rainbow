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
import * as ls from '@/storage';

/**
 * Array of all Rainbow Networks
 */
export const RainbowNetworks = [
  // L2s
  getArbitrumNetworkObject(),
  getBaseNetworkObject(),
  getBSCNetworkObject(),
  getOptimismNetworkObject(),
  getPolygonNetworkObject(),
  getZoraNetworkObject(),
  getGnosisNetworkObject(),

  // Testnets
  getGoerliNetworkObject(),

  // Mainnet
  getMainnetNetworkObject(),
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

export function checkIfNetworkIsEnabled(network: Network): boolean {
  return (
    !!ls.device.get(['enabledNetworks'])?.[network] &&
    getNetworkObj(network).enabled
  );
}
