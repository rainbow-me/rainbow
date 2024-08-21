import { ChainId, NetworkProperties } from '@/networks/types';
import store from '@/redux/store';
import * as ls from '@/storage';
import { arbitrumNetworkObject } from './arbitrum';
import { avalancheNetworkObject } from './avalanche';
import { baseNetworkObject } from './base';
import { blastNetworkObject } from './blast';
import { bscNetworkObject } from './bsc';
import { degenNetworkObject } from './degen';
import { gnosisNetworkObject } from './gnosis';
import { goerliNetworkObject } from './goerli';
import { mainnetNetworkObject } from './mainnet';
import { optimismNetworkObject } from './optimism';
import { polygonNetworkObject } from './polygon';
import { zoraNetworkObject } from './zora';

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
export const networkObjects = {
  [ChainId.arbitrum]: arbitrumNetworkObject,
  [ChainId.avalanche]: avalancheNetworkObject,
  [ChainId.base]: baseNetworkObject,
  [ChainId.blast]: blastNetworkObject,
  [ChainId.bsc]: bscNetworkObject,
  [ChainId.degen]: degenNetworkObject,
  [ChainId.gnosis]: gnosisNetworkObject,
  [ChainId.goerli]: goerliNetworkObject,
  [ChainId.mainnet]: mainnetNetworkObject,
  [ChainId.optimism]: optimismNetworkObject,
  [ChainId.polygon]: polygonNetworkObject,
  [ChainId.zora]: zoraNetworkObject,
};

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

  return Object.values(networkObjects).sort(tokenSort);
}

export function getSwappableNetworks(): NetworkProperties[] {
  return Object.values(networkObjects).filter(network => network.features.swaps);
}
