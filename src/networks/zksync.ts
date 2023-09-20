import { getProviderForNetwork } from '@/handlers/web3';
import { Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { zkSync } from '@wagmi/chains';
import { ZKSYNC_ETH_ADDRESS } from '@/references';
import { getZkSyncGasPrices } from '@/redux/gas';
import config from '@/model/config';

export const getZkSyncNetworkObject = (): NetworkProperties => {
  return {
    // wagmi chain data
    ...zkSync,

    // network related data
    enabled: config.zkSync_enabled,
    name: 'ZkSync',
    longName: 'ZkSync Era',
    value: Network.zkSync,
    networkType: 'layer2',
    blockTimeInMs: 3_000,

    nativeCurrency: {
      ...zkSync.nativeCurrency,
      address: ZKSYNC_ETH_ADDRESS,
    },

    rpc: config.zkSync_mainnet_rpc,
    getProvider: getProviderForNetwork(Network.zkSync),
    // TODO: not sure what this is
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
      txs: config.zkSync_tx_enabled,
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

      // this prob can just be blockTime,
      pollingIntervalInMs: 3_000,

      getGasPrices: getZkSyncGasPrices,
    },

    swaps: {
      defaultSlippage: 200,
    },

    nfts: {},

    // design tings
    colors: {
      light: '#fcfdff',
      dark: '#15171a',
    },
  };
};
