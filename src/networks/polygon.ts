import { getProviderForNetwork, proxyRpcEndpoint } from '@/handlers/web3';
import { Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { polygon } from '@wagmi/chains';
import { MATIC_MAINNET_ADDRESS, MATIC_POLYGON_ADDRESS } from '@/references';
import { getPolygonGasPrices } from '@/redux/gas';
import { getRemoteConfig } from '@/model/remoteConfig';

export const getPolygonNetworkObject = (): NetworkProperties => {
  const { polygon_tx_enabled } = getRemoteConfig();
  return {
    // wagmi chain data
    ...polygon,

    // network related data
    enabled: true,
    name: 'Polygon',
    longName: 'Polygon',
    value: Network.polygon,
    networkType: 'layer2',
    blockTimeInMs: 2_000,

    nativeCurrency: {
      ...polygon.nativeCurrency,
      address: MATIC_POLYGON_ADDRESS,
      mainnetAddress: MATIC_MAINNET_ADDRESS,
    },

    rpc: () => proxyRpcEndpoint(polygon.id),
    getProvider: () => getProviderForNetwork(Network.polygon),
    balanceCheckerAddress: '0x54A4E5800345c01455a77798E0D96438364e22723',

    // features
    features: {
      txHistory: true,
      flashbots: false,
      walletconnect: true,
      swaps: true,
      nfts: true,
      pools: false,
      txs: polygon_tx_enabled,
    },

    gas: {
      speeds: [gasUtils.NORMAL, gasUtils.FAST, gasUtils.URGENT],

      // ?
      gasType: 'legacy',
      roundGasDisplay: false,

      // this prob can just be blockTime
      pollingIntervalInMs: 2_000,

      getGasPrices: getPolygonGasPrices,
    },

    swaps: {
      defaultSlippage: 200,
      defaultToFastGas: true,
    },

    nfts: { simplehashNetwork: 'polygon' },

    // design tings
    colors: {
      light: '#8247E5',
      dark: '#A275EE',
    },
  };
};
