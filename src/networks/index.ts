import { ArbitrumNetworkObject } from './arbitrum';
import { BSCNetworkObject } from './bsc';
import { MainnetNetworkObject } from './mainnet';
import { GoerliNetworkObject } from './goerli';
import { OptimismNetworkObject } from './optimism';
import { PolygonNetworkObject } from './polygon';
import { Network, NetworkProperties } from './types';
import { ZoraNetworkObject } from './zora';
import { GnosisNetworkObject } from './gnosis';
import { BaseNetworkObject } from './base';

/**
 * Array of all Rainbow Networks
 */
export const RainbowNetworks = [
  // L2s
  ArbitrumNetworkObject,
  BaseNetworkObject,
  BSCNetworkObject,
  OptimismNetworkObject,
  PolygonNetworkObject,
  ZoraNetworkObject,
  GnosisNetworkObject,

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
    case Network.base:
      return BaseNetworkObject;
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
