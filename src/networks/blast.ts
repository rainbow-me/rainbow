import { getProviderForNetwork, proxyRpcEndpoint } from '@/handlers/web3';
import { Network, NetworkProperties } from './types';
import { gasUtils } from '@/utils';
import type { Chain } from '@wagmi/chains';
// import { blast } from '@wagmi/chains';
import { getAvalancheGasPrices, getBlastGasPrices } from '@/redux/gas';
import { getRemoteConfig } from '@/model/remoteConfig';
import { BLAST_MAINNET_RPC } from 'react-native-dotenv';
import { BLAST_ETH_ADDRESS } from '@/references';

const BLAST_CHAIN_ID = 81457;
export const chainBlast: Chain = {
  id: BLAST_CHAIN_ID,
  name: 'Blast',
  network: 'blast',
  rpcUrls: {
    public: { http: [BLAST_MAINNET_RPC as string] },
    default: {
      http: [BLAST_MAINNET_RPC as string],
    },
  },
  blockExplorers: {
    default: { name: 'Blastscan', url: 'https://blastscan.io/' },
  },
  nativeCurrency: {
    name: 'Blast',
    symbol: 'BLAST',
    decimals: 18,
  },
};

export const getBlastNetworkObject = (): NetworkProperties => {
  const { blast_enabled, blast_tx_enabled } = getRemoteConfig();
  return {
    // where wagmi chain data usually is
    ...chainBlast,

    // network related data
    enabled: blast_enabled,
    name: 'Blast',
    longName: 'Blast',
    value: Network.blast,
    networkType: 'layer2',
    blockTimeInMs: 5_000,

    nativeCurrency: {
      ...chainBlast.nativeCurrency,
      address: BLAST_ETH_ADDRESS,
    },

    balanceCheckerAddress: '',
    rpc: proxyRpcEndpoint(BLAST_CHAIN_ID),
    getProvider: getProviderForNetwork(Network.blast),

    // features
    features: {
      txHistory: true,
      flashbots: false,
      walletconnect: true,
      swaps: false,
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

    nfts: {},

    // design tings
    colors: {
      light: '#25292E',
      dark: '#FCFC03',
    },
  };
};
