import { getProviderForNetwork } from '@/handlers/web3';
import { Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { zora } from '@wagmi/chains';
import { ZORA_ETH_ADDRESS } from '@/references';
import { getZoraGasPrices } from '@/redux/gas';
import config from '@/model/config';

export const getZoraNetworkObject = (): NetworkProperties => {
  return {
    // wagmi chain data
    ...zora,

    // network related data
    enabled: config.zora_enabled && config.op_chains_enabled,
    name: 'Zora',
    longName: 'Zora',
    value: Network.zora,
    networkType: 'layer2',
    blockTimeInMs: 5_000,

    nativeCurrency: {
      ...zora.nativeCurrency,
      address: ZORA_ETH_ADDRESS,
    },

    rpc: config.zora_mainnet_rpc,
    getProvider: getProviderForNetwork(Network.zora),
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
      txs: config.zora_tx_enabled && config.op_chains_tx_enabled,
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

      getGasPrices: getZoraGasPrices,
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
};
