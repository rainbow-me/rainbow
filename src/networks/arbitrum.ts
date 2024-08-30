import { getProviderForNetwork, proxyRpcEndpoint } from '@/handlers/web3';
import { Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { arbitrum } from '@wagmi/chains';
import { ARBITRUM_ETH_ADDRESS } from '@/references';
import { getArbitrumGasPrices } from '@/redux/gas';
import { getRemoteConfig } from '@/model/remoteConfig';

export const getArbitrumNetworkObject = (): NetworkProperties => {
  const { arbitrum_enabled, arbitrum_tx_enabled } = getRemoteConfig();
  return {
    // wagmi chain data
    ...arbitrum,
    // network related data
    enabled: arbitrum_enabled,
    name: 'Arbitrum',
    longName: 'Arbitrum',
    value: Network.arbitrum,
    networkType: 'layer2',
    blockTimeInMs: 5_000,

    nativeCurrency: {
      ...arbitrum.nativeCurrency,
      address: ARBITRUM_ETH_ADDRESS,
    },

    rpc: () => proxyRpcEndpoint(arbitrum.id),
    getProvider: () => getProviderForNetwork(Network.arbitrum),
    balanceCheckerAddress: '0x54A4E5800345c01455a7798E0D96438364e22723',

    // features
    features: {
      txHistory: true,

      // not sure if flashbots is being used app wide vs just swaps
      flashbots: false,
      walletconnect: true,
      swaps: true,
      nfts: true,
      pools: false,
      txs: arbitrum_tx_enabled,
    },

    gas: {
      speeds: [gasUtils.NORMAL, gasUtils.FAST, gasUtils.URGENT, gasUtils.CUSTOM],

      // ?
      gasType: 'eip1559',
      roundGasDisplay: true,

      // this prob can just be blockTime
      pollingIntervalInMs: 3_000,

      // needs more research
      getGasPrices: getArbitrumGasPrices,
    },

    swaps: {
      defaultSlippage: 200,
    },

    nfts: { simplehashNetwork: 'arbitrum' },

    // design tings
    colors: {
      light: '#2D374B',
      dark: '#ADBFE3',
    },
  };
};
