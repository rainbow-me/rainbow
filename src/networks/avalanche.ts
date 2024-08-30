import { getProviderForNetwork, proxyRpcEndpoint } from '@/handlers/web3';
import { Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { avalanche } from '@wagmi/chains';
import { AVAX_AVALANCHE_ADDRESS } from '@/references';
import { getAvalancheGasPrices } from '@/redux/gas';
import { getRemoteConfig } from '@/model/remoteConfig';

export const getAvalancheNetworkObject = (): NetworkProperties => {
  const { avalanche_enabled, avalanche_tx_enabled } = getRemoteConfig();
  return {
    // wagmi chain data
    ...avalanche,

    // network related data
    enabled: avalanche_enabled,
    name: 'Avalanche',
    longName: 'Avalanche',
    value: Network.avalanche,
    networkType: 'layer2',
    blockTimeInMs: 5_000,

    nativeCurrency: {
      ...avalanche.nativeCurrency,
      address: AVAX_AVALANCHE_ADDRESS,
    },

    rpc: () => proxyRpcEndpoint(avalanche.id),
    getProvider: () => getProviderForNetwork(Network.avalanche),
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
      txs: avalanche_tx_enabled,
    },

    gas: {
      speeds: [gasUtils.NORMAL, gasUtils.FAST, gasUtils.URGENT, gasUtils.CUSTOM],
      // ?
      gasType: 'eip1559',
      roundGasDisplay: true,

      // this prob can just be blockTime,
      pollingIntervalInMs: 5_000,

      getGasPrices: getAvalancheGasPrices,
    },

    swaps: {
      defaultSlippage: 200,
    },

    nfts: { simplehashNetwork: 'avalanche' },

    // design tings
    colors: {
      light: '#E84142',
      dark: '#FF5D5E',
    },
  };
};
