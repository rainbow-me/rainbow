import { ChainId, NetworkProperties } from '@/networks/types';
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
import { getZoraNetworkObject } from './zora';

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
  [ChainId.arbitrum]: getArbitrumNetworkObject(),
  [ChainId.avalanche]: getAvalancheNetworkObject(),
  [ChainId.base]: getBaseNetworkObject(),
  [ChainId.blast]: getBlastNetworkObject(),
  [ChainId.bsc]: getBSCNetworkObject(),
  [ChainId.degen]: getDegenNetworkObject(),
  [ChainId.gnosis]: getGnosisNetworkObject(),
  [ChainId.goerli]: getGoerliNetworkObject(),
  [ChainId.mainnet]: getMainnetNetworkObject(),
  [ChainId.optimism]: getOptimismNetworkObject(),
  [ChainId.polygon]: getPolygonNetworkObject(),
  [ChainId.zora]: getZoraNetworkObject(),
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

export const RainbowNetworkByChainId = Object.values(networkObjects).reduce(
  (acc, network) => {
    acc[network.id] = network;
    return acc;
  },
  {} as Record<ChainId, NetworkProperties>
);
