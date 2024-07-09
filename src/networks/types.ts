import { EthereumAddress } from '@/entities';
import { GasPricesAPIData } from '@/entities/gas';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { Chain } from '@wagmi/chains';
// network.ts
export enum Network {
  arbitrum = 'arbitrum',
  goerli = 'goerli',
  mainnet = 'mainnet',
  optimism = 'optimism',
  polygon = 'polygon',
  base = 'base',
  bsc = 'bsc',
  zora = 'zora',
  gnosis = 'gnosis',
  avalanche = 'avalanche',
  blast = 'blast',
  degen = 'degen',
}

export type NetworkTypes = 'layer1' | 'layer2' | 'testnet';

export interface NetworkProperties extends Chain {
  // network related data
  enabled: boolean;
  name: string;
  longName: string;
  value: Network;
  networkType: 'layer1' | 'layer2' | 'testnet';
  blockTimeInMs: number;

  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
    address: string;
    mainnetAddress?: string;
  };

  rpc: () => string;
  getProvider: () => StaticJsonRpcProvider;
  balanceCheckerAddress: EthereumAddress;

  // feature flags
  features: {
    txHistory: boolean;
    flashbots: boolean;
    walletconnect: boolean;
    swaps: boolean;
    nfts: boolean;
    pools: boolean;
    txs: boolean;
  };

  gas: {
    speeds: string[];
    gasType: 'eip1559' | 'legacy';
    OptimismTxFee?: boolean;

    // for some networks gas is so cheap we dont want to round the gwei #
    roundGasDisplay: boolean;

    // this prob can just be blockTime
    pollingIntervalInMs: number;

    getGasPrices: () => Promise<GasPricesAPIData | null>;
  };

  swaps: {
    defaultSlippage: number;
    defaultToFastGas?: boolean;
  };

  nfts: {
    simplehashNetwork: string | null;
  };

  // design tings
  colors: {
    light: string;
    dark: string;
  };
}
