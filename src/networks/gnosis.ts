import { getProviderForNetwork } from '@/handlers/web3';
import { Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { gnosis } from '@wagmi/chains';
import { ETH_ADDRESS } from '@/references';
import { getOptimismGasPrices } from '@/redux/gas';

export const getGnosisNetworkObject = (): NetworkProperties => {
  return {
    // wagmi chain data
    ...gnosis,

    // network related data
    enabled: false,
    name: 'Gnosis',
    longName: 'Gnosis',
    value: Network.gnosis,
    networkType: 'layer1',
    blockTimeInMs: 5_000,

    nativeCurrency: {
      ...gnosis.nativeCurrency,
      address: ETH_ADDRESS,
    },

    rpc: () => '',
    getProvider: () => getProviderForNetwork(Network.optimism),
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

      getGasPrices: getOptimismGasPrices,
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
};
