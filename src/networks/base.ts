import { ChainId, Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { base } from '@wagmi/chains';
import { getRemoteConfig } from '@/model/remoteConfig';
import { defaultChains } from './chains';

const { base_enabled, base_tx_enabled, op_chains_enabled, op_chains_tx_enabled } = getRemoteConfig();

export const baseNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...base,

  // network related data
  enabled: base_enabled && op_chains_enabled,
  name: 'Base',
  longName: 'Base',
  value: Network.base,

  rpc: defaultChains[ChainId.base].rpcUrls.default.http[0],

  // features
  features: {
    flashbots: false,
    walletconnect: true,
    swaps: true,
    nfts: true,
    txs: base_tx_enabled && op_chains_tx_enabled,
  },

  gas: {
    // ?
    roundGasDisplay: true,
    OptimismTxFee: true,
  },

  // design tings
  colors: {
    light: '#0052FF',
    dark: '#3979FF',
  },
};
