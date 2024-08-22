import { Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { goerli } from '@wagmi/chains';
import { getRemoteConfig } from '@/model/remoteConfig';

const { goerli_enabled, goerli_tx_enabled } = getRemoteConfig();

export const goerliNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...goerli,

  // network related data
  enabled: goerli_enabled,
  name: 'Goerli',
  longName: 'Goerli',
  value: Network.goerli,

  rpc: '',

  // features
  features: {
    // not sure if flashbots is being used app wide vs just swaps
    flashbots: false,
    walletconnect: false,
    swaps: false,
    nfts: false,
    pools: true,
    txs: goerli_tx_enabled,
  },

  gas: {
    speeds: [gasUtils.NORMAL, gasUtils.FAST, gasUtils.CUSTOM],
    gasType: 'eip1559',
    roundGasDisplay: true,

    // this prob can just be blockTime
    pollingIntervalInMs: 5_000,
  },

  swaps: {
    defaultSlippage: 100,
  },

  nfts: {
    simplehashNetwork: 'ethereum-goerli',
  },

  // design tings
  colors: {
    light: '#f6c343',
    dark: '#f6c343',
  },
};
