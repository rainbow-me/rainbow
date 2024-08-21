import { ChainId, Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { avalanche } from '@wagmi/chains';
import { getRemoteConfig } from '@/model/remoteConfig';
import { defaultChains } from './chains';

const { avalanche_enabled, avalanche_tx_enabled } = getRemoteConfig();

export const avalancheNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...avalanche,

  // network related data
  enabled: avalanche_enabled,
  name: 'Avalanche',
  longName: 'Avalanche',
  value: Network.avalanche,
  networkType: 'layer2',

  rpc: defaultChains[ChainId.avalanche].rpcUrls.default.http[0],

  // features
  features: {
    txHistory: true,
    flashbots: false,
    walletconnect: true,
    swaps: true,
    nfts: true,
    pools: false,
    txs: avalanche_tx_enabled,
  },

  gas: {
    speeds: [gasUtils.NORMAL, gasUtils.FAST, gasUtils.URGENT, gasUtils.CUSTOM],
    // ?
    gasType: 'eip1559',
    roundGasDisplay: true,

    // this prob can just be blockTime,
    pollingIntervalInMs: 5_000,
  },

  swaps: {
    defaultSlippage: 200,
  },

  nfts: { simplehashNetwork: 'avalanche' },

  // design tings
  colors: {
    light: '#E84142',
    dark: '#FF5D5E',
  },
};
