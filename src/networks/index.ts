import { MainnetNetworkObject } from './mainnet';
import { Network, NetworkProperties } from './types';

export function getNetworkObj(network: Network): NetworkProperties {
  switch (network) {
    // Add cases for other networks
    default:
      return MainnetNetworkObject;
  }
}
