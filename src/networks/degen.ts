import { getProviderForNetwork, proxyRpcEndpoint } from '@/handlers/web3';
import { Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { degen } from 'viem/chains';
import { DEGEN_CHAIN_DEGEN_ADDRESS } from '@/references';
import { getDegenGasPrices } from '@/redux/gas';
import { getRemoteConfig } from '@/model/remoteConfig';
import { DEGEN_MAINNET_RPC } from 'react-native-dotenv';

export const getDegenNetworkObject = (): NetworkProperties => {
  const { degen_enabled, degen_tx_enabled } = getRemoteConfig();
  return {
    // viem chain data
    ...degen,

    // network related data
    enabled: degen_enabled,
    name: 'Degen Chain',
    network: 'degen',
    longName: 'Degen Chain',
    value: Network.degen,
    networkType: 'layer2',
    blockTimeInMs: 5_000,

    nativeCurrency: {
      ...degen.nativeCurrency,
      address: DEGEN_CHAIN_DEGEN_ADDRESS,
    },

    rpc: () => proxyRpcEndpoint(degen.id),
    getProvider: () => getProviderForNetwork(Network.degen),
    // need to find balance checker address
    balanceCheckerAddress: '',

    // features
    features: {
      txHistory: true,
      flashbots: false,
      walletconnect: true,
      swaps: true,
      nfts: true,
      pools: false,
      txs: degen_tx_enabled,
    },

    gas: {
      speeds: [gasUtils.NORMAL, gasUtils.FAST, gasUtils.URGENT, gasUtils.CUSTOM],
      // ?
      gasType: 'eip1559',
      roundGasDisplay: true,

      // this prob can just be blockTime,
      pollingIntervalInMs: 5_000,

      getGasPrices: getDegenGasPrices,
    },

    swaps: {
      defaultSlippage: 200,
    },

    nfts: { simplehashNetwork: 'degen' },

    // design tings
    colors: {
      light: '#A36EFD',
      dark: '#A36EFD',
    },

    rpcUrls: {
      public: { http: [DEGEN_MAINNET_RPC as string] },
      default: {
        http: [DEGEN_MAINNET_RPC as string],
      },
    },
  };
};
