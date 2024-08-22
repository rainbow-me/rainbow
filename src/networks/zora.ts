import { ChainId, Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { zora } from '@wagmi/chains';
import { getRemoteConfig } from '@/model/remoteConfig';
import { defaultChains } from './chains';

const { zora_enabled, zora_tx_enabled, op_chains_enabled, op_chains_tx_enabled } = getRemoteConfig();

export const zoraNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...zora,

  // network related data
  enabled: zora_enabled && op_chains_enabled,
  name: 'Zora',
  longName: 'Zora',
  value: Network.zora,

  rpc: defaultChains[ChainId.zora].rpcUrls.default.http[0],

  // features
  features: {
    flashbots: false,
    walletconnect: true,
    swaps: true,
    nfts: true,
    pools: false,
    txs: zora_tx_enabled && op_chains_tx_enabled,
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

  nfts: {
    simplehashNetwork: 'zora',
  },

  // design tings
  colors: {
    light: '#2B5DF0',
    dark: '#6183F0',
  },
};
