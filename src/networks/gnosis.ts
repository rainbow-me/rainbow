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
  networkType: 'layer1',

  rpc: () => '',
  balanceCheckerAddress: '',

  // features
  features: {
    txHistory: false,
    flashbots: false,
    walletconnect: false,
    swaps: false,
    nfts: true,
    pools: false,
    txs: false,
  },

  gas: {
    speeds: [gasUtils.NORMAL],

    // ?
    gasType: 'legacy',
    roundGasDisplay: true,
    OptimismTxFee: true,

    // this prob can just be blockTime,
    pollingIntervalInMs: 5_000,
  },

  swaps: {
    defaultSlippage: 200,
  },

  nfts: {
    simplehashNetwork: 'gnosis',
  },

  // design tings
  colors: {
    light: '#FF4040',
    dark: '#FF6A6A',
  },
};
