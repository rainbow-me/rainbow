import { ChainId, Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { blast } from 'viem/chains';
import { getRemoteConfig } from '@/model/remoteConfig';
import { BLAST_MAINNET_RPC } from 'react-native-dotenv';
import { defaultChains } from './chains';

const { blast_enabled, blast_tx_enabled } = getRemoteConfig();

export const blastNetworkObject: NetworkProperties = {
  // where wagmi chain data usually is
  ...blast,

  // network related data
  enabled: blast_enabled,
  name: 'Blast',
  network: 'blast',
  longName: 'Blast',
  value: Network.blast,

  rpc: defaultChains[ChainId.blast].rpcUrls.default.http[0],

  // features
  features: {
    flashbots: false,
    walletconnect: true,
    swaps: true,
    nfts: true,
    txs: blast_tx_enabled,
  },

  gas: {
    speeds: [gasUtils.NORMAL, gasUtils.FAST, gasUtils.URGENT, gasUtils.CUSTOM],
    // ?
    roundGasDisplay: true,
  },

  swaps: {
    defaultSlippage: 200,
  },

  // design tings
  colors: {
    light: '#25292E',
    dark: '#FCFC03',
  },

  rpcUrls: {
    public: { http: [BLAST_MAINNET_RPC as string] },
    default: {
      http: [BLAST_MAINNET_RPC as string],
    },
  },
};
