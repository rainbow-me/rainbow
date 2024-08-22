import { Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { gnosis } from '@wagmi/chains';

export const gnosisNetworkObject: NetworkProperties = {
  // wagmi chain data
  ...gnosis,

  // network related data
  enabled: false,
  name: 'Gnosis',
  longName: 'Gnosis',
  value: Network.gnosis,

  rpc: '',

  // features
  features: {
    flashbots: false,
    walletconnect: false,
    swaps: false,
    nfts: true,
    txs: false,
  },

  gas: {
    // ?
    roundGasDisplay: true,
    OptimismTxFee: true,
  },

  swaps: {
    defaultSlippage: 200,
  },

  // design tings
  colors: {
    light: '#FF4040',
    dark: '#FF6A6A',
  },
};
