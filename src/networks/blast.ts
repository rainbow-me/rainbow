import { getProvider, proxyRpcEndpoint } from '@/handlers/web3';
import { Network, NetworkProperties , ChainId } from './types';
import { gasUtils } from '@/utils';
import { blast } from 'viem/chains';
import { getBlastGasPrices } from '@/redux/gas';
import { getRemoteConfig } from '@/model/remoteConfig';
import { BLAST_MAINNET_RPC } from 'react-native-dotenv';
import { BLAST_ETH_ADDRESS } from '@/references';

const { blast_enabled, blast_tx_enabled } = getRemoteConfig();

export const blastNetworkObject: NetworkProperties = {
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
  rpc: () => proxyRpcEndpoint(blast.id),
  getProvider: () => getProvider({ chainId: ChainId.blast }),

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
