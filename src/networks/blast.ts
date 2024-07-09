import { getProviderForNetwork, proxyRpcEndpoint } from '@/handlers/web3';
import { Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import { blast } from 'viem/chains';
import { getBlastGasPrices } from '@/redux/gas';
import { getRemoteConfig } from '@/model/remoteConfig';
import { BLAST_MAINNET_RPC } from 'react-native-dotenv';
import { BLAST_ETH_ADDRESS } from '@/references';

const BLAST_CHAIN_ID = 81457;

export const getBlastNetworkObject = (): NetworkProperties => {
  const { blast_enabled, blast_tx_enabled } = getRemoteConfig();
  return {
    // where wagmi chain data usually is
    ...blast,

    // network related data
    enabled: blast_enabled,
    name: 'Blast',
    network: 'blast',
    longName: 'Blast',
    value: Network.blast,
    networkType: 'layer2',
    blockTimeInMs: 5_000,

    nativeCurrency: {
      ...blast.nativeCurrency,
      address: BLAST_ETH_ADDRESS,
    },

    balanceCheckerAddress: '',
    rpc: () => proxyRpcEndpoint(BLAST_CHAIN_ID),
    getProvider: () => getProviderForNetwork(Network.blast),

    // features
    features: {
      txHistory: true,
      flashbots: false,
      walletconnect: true,
      swaps: true,
      nfts: true,
      pools: false,
      txs: blast_tx_enabled,
    },

    gas: {
      speeds: [gasUtils.NORMAL, gasUtils.FAST, gasUtils.URGENT, gasUtils.CUSTOM],
      // ?
      gasType: 'eip1559',
      roundGasDisplay: true,

      // this prob can just be blockTime,
      pollingIntervalInMs: 5_000,

      getGasPrices: getBlastGasPrices,
    },

    swaps: {
      defaultSlippage: 200,
    },

    nfts: { simplehashNetwork: 'blast' },

    // design tings
    colors: {
      light: '#25292E',
      dark: '#FCFC03',
    },

    rpcUrls: {
      public: { http: [BLAST_MAINNET_RPC as string] },
      default: {
        http: [BLAST_MAINNET_RPC as string],
      },
    },
  };
};
