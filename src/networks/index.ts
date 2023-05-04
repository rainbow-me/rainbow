import { ArbitrumNetworkObject } from './arbitrum';
import { BSCNetworkObject } from './bsc';
import { MainnetNetworkObject } from './mainnet';
import { OptimismNetworkObject } from './optimism';
import { PolygonNetworkObject } from './polygon';
import { Network, NetworkProperties } from './types';

export function getNetworkObj(network: Network): NetworkProperties {
  switch (network) {
    case Network.arbitrum:
      return ArbitrumNetworkObject;
    case Network.bsc:
      return BSCNetworkObject;
    case Network.optimism:
      return OptimismNetworkObject;
    case Network.polygon:
      return PolygonNetworkObject;
    default:
      return MainnetNetworkObject;
  }
}
