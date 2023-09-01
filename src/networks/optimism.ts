import { getProviderForNetwork } from '@/handlers/web3';
import { Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { optimism } from '@wagmi/chains';
import { OPTIMISM_ETH_ADDRESS } from '@/references';
import { getOptimismGasPrices } from '@/redux/gas';
import config from '@/model/config';

export const getOptimismNetworkObject = (): NetworkProperties => {
  return {
    // wagmi chain data
    ...optimism,

    // network related data
    enabled: config.optimism_enabled && config.op_chains_enabled,
    name: 'Optimism',
    longName: 'Optimism',
    value: Network.optimism,
    networkType: 'layer2',
    blockTimeInMs: 5_000,

    nativeCurrency: {
      ...optimism.nativeCurrency,
      address: OPTIMISM_ETH_ADDRESS,
    },

    rpc: config.optimism_mainnet_rpc,
    getProvider: getProviderForNetwork(Network.optimism),
    balanceCheckerAddress: '0x1C8cFdE3Ba6eFc4FF8Dd5C93044B9A690b6CFf36',

    // features
    features: {
      txHistory: true,
      flashbots: false,
      walletconnect: true,
      swaps: true,
      nfts: true,
      savings: false,
      pools: false,
      txs: config.optimism_tx_enabled && config.op_chains_tx_enabled,
    },

    gas: {
      speeds: [
        gasUtils.NORMAL,
        gasUtils.FAST,
        gasUtils.URGENT,
        gasUtils.CUSTOM,
      ],

      // ?
      gasType: 'eip1559',
      roundGasDisplay: true,
      OptimismTxFee: true,

      // this prob can just be blockTime,
      pollingIntervalInMs: 5_000,

      getGasPrices: getOptimismGasPrices,
    },

    swaps: {
      defaultSlippage: 200,
    },

    nfts: {},

    // design tings
    colors: {
      light: '#FF4040',
      dark: '#FF6A6A',
    },
  };
};
