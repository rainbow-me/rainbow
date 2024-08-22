import { ChainId, Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { optimism } from '@wagmi/chains';
import { getRemoteConfig } from '@/model/remoteConfig';
import { defaultChains } from './chains';

const { optimism_enabled, optimism_tx_enabled, op_chains_enabled, op_chains_tx_enabled } = getRemoteConfig();

export const optimismNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...optimism,

  // network related data
  enabled: optimism_enabled && op_chains_enabled,
  name: 'Optimism',
  longName: 'Optimism',
  value: Network.optimism,

  rpc: defaultChains[ChainId.optimism].rpcUrls.default.http[0],

  // features
  features: {
    flashbots: false,
    walletconnect: true,
    swaps: true,
    nfts: true,
    txs: optimism_tx_enabled && op_chains_tx_enabled,
  },

  gas: {
    // ?
    roundGasDisplay: true,
    OptimismTxFee: true,
  },

  // design tings
  colors: {
    light: '#FF4040',
    dark: '#FF6A6A',
  },
};
