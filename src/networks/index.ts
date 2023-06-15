import { ArbitrumNetworkObject } from './arbitrum';
import { BSCNetworkObject } from './bsc';
import { MainnetNetworkObject } from './mainnet';
import { GoerliNetworkObject } from './goerli';
import { OptimismNetworkObject } from './optimism';
import { PolygonNetworkObject } from './polygon';
import { Network, NetworkProperties } from './types';

/**
 * Array of all Rainbow Networks
 */
export const RainbowNetworks = [
  // L2s
  ArbitrumNetworkObject,
  BSCNetworkObject,
  OptimismNetworkObject,
  PolygonNetworkObject,

  // Testnets
  GoerliNetworkObject,

  // Mainnet
  MainnetNetworkObject,
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

    // Testnets
    case Network.goerli:
      return GoerliNetworkObject;

    // Mainnet
    default:
      return MainnetNetworkObject;
  }
}
