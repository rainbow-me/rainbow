import { ChainId, Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { bsc } from '@wagmi/chains';
import { getRemoteConfig } from '@/model/remoteConfig';
import { defaultChains } from './chains';

const { bsc_enabled, bsc_tx_enabled } = getRemoteConfig();

export const bscNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...bsc,

  // network related data
  enabled: bsc_enabled,
  name: 'BSC',
  longName: 'Binance Smart Chain',
  value: Network.bsc,

  rpc: defaultChains[ChainId.bsc].rpcUrls.default.http[0],

  // features
  features: {
    flashbots: false,
    walletconnect: true,
    swaps: true,
    nfts: true,
    txs: bsc_tx_enabled,
  },

  gas: {
    speeds: [gasUtils.NORMAL, gasUtils.FAST, gasUtils.URGENT],

    // ?
    roundGasDisplay: false,
  },

  swaps: {
    defaultSlippage: 200,
  },

  // design tings
  colors: {
    light: '#8247E5',
    dark: '#F0B90B',
  },
};
