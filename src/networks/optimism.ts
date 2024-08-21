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
  networkType: 'layer2',

  rpc: defaultChains[ChainId.optimism].rpcUrls.default.http[0],

  // features
  features: {
    txHistory: true,
    flashbots: false,
    walletconnect: true,
    swaps: true,
    nfts: true,
    pools: false,
    txs: optimism_tx_enabled && op_chains_tx_enabled,
  },

  gas: {
    speeds: [gasUtils.NORMAL, gasUtils.FAST, gasUtils.URGENT, gasUtils.CUSTOM],

    // ?
    gasType: 'eip1559',
    roundGasDisplay: true,
    OptimismTxFee: true,

    // this prob can just be blockTime,
    pollingIntervalInMs: 5_000,
  },

  swaps: {
    defaultSlippage: 200,
  },

  nfts: { simplehashNetwork: 'optimism' },

  // design tings
  colors: {
    light: '#FF4040',
    dark: '#FF6A6A',
  },
};
