import { Platform } from 'react-native';

import type { Address } from 'viem';
import {
  apeChain,
  arbitrum as arbitrumChain,
  arbitrumNova as arbitrumNovaChain,
  arbitrumSepolia as arbitrumSepoliaChain,
  avalanche as avalancheChain,
  avalancheFuji as avalancheFujiChain,
  base as baseChain,
  baseSepolia as baseSepoliaChain,
  blast as blastChain,
  blastSepolia as blastSepoliaChain,
  bsc as bscChain,
  bscTestnet as bscTestnetChain,
  celo as celoChain,
  degen as degenChain,
  gnosis as gnosisChain,
  goerli as goerliChain,
  gravity as gravityChain,
  holesky as holeskyChain,
  linea as lineaChain,
  mainnet as mainnetChain,
  manta as mantaChain,
  optimism as optimismChain,
  optimismSepolia as optimismSepoliaChain,
  polygonAmoy as polygonAmoyChain,
  polygon as polygonChain,
  polygonMumbai as polygonMumbaiChain,
  polygonZkEvm as polygonZkEvmChain,
  sanko as sankoChain,
  scroll as scrollChain,
  sepolia as sepoliaChain,
  zksync as zksyncChain,
  zora as zoraChain,
  zoraSepolia as zoraSepoliaChain,
  type Chain as ViemChain,
} from 'viem/chains';

import type { AddressOrEth } from '@/__swaps__/types/assets';

const ANVIL_CHAIN_ID = 1337;
const ANVIL_OP_CHAIN_ID = 1338;
const ANVIL_RPC_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8545' : 'http://127.0.0.1:8545';

export enum Network {
  apechain = 'apechain',
  arbitrum = 'arbitrum',
  avalanche = 'avalanche',
  base = 'base',
  blast = 'blast',
  bsc = 'bsc',
  degen = 'degen',
  gnosis = 'gnosis',
  goerli = 'goerli',
  gravity = 'gravity',
  ink = 'ink',
  linea = 'linea',
  mainnet = 'mainnet',
  optimism = 'optimism',
  polygon = 'polygon',
  sanko = 'sanko',
  scroll = 'scroll',
  zksync = 'zksync',
  zora = 'zora',
}

export enum ChainId {
  apechain = apeChain.id,
  arbitrum = arbitrumChain.id,
  arbitrumNova = arbitrumNovaChain.id,
  arbitrumSepolia = arbitrumSepoliaChain.id,
  avalanche = avalancheChain.id,
  avalancheFuji = avalancheFujiChain.id,
  base = baseChain.id,
  baseSepolia = baseSepoliaChain.id,
  blast = blastChain.id,
  blastSepolia = blastSepoliaChain.id,
  bsc = bscChain.id,
  bscTestnet = bscTestnetChain.id,
  celo = celoChain.id,
  degen = degenChain.id,
  gnosis = gnosisChain.id,
  goerli = goerliChain.id,
  gravity = gravityChain.id,
  anvil = ANVIL_CHAIN_ID,
  anvilOptimism = ANVIL_OP_CHAIN_ID,
  holesky = holeskyChain.id,
  ink = 57073,
  linea = lineaChain.id,
  mainnet = mainnetChain.id,
  manta = mantaChain.id,
  optimism = optimismChain.id,
  optimismSepolia = optimismSepoliaChain.id,
  polygon = polygonChain.id,
  polygonAmoy = polygonAmoyChain.id,
  polygonMumbai = polygonMumbaiChain.id,
  polygonZkEvm = polygonZkEvmChain.id,
  rari = 1380012617,
  sanko = sankoChain.id,
  scroll = scrollChain.id,
  sepolia = sepoliaChain.id,
  zksync = zksyncChain.id,
  zora = zoraChain.id,
  zoraSepolia = zoraSepoliaChain.id,
}

export enum ChainName {
  apechain = 'apechain',
  arbitrum = 'arbitrum',
  arbitrumNova = 'arbitrum-nova',
  arbitrumSepolia = 'arbitrum-sepolia',
  avalanche = 'avalanche',
  avalancheFuji = 'avalanche-fuji',
  base = 'base',
  baseSepolia = 'base-sepolia',
  blast = 'blast',
  blastSepolia = 'blast-sepolia',
  bsc = 'bsc',
  bscTestnet = 'bsc-testnet',
  celo = 'celo',
  degen = 'degen',
  gnosis = 'gnosis',
  goerli = 'goerli',
  gravity = 'gravity',
  anvil = 'anvil',
  anvilOptimism = 'anvil-optimism',
  holesky = 'holesky',
  ink = 'ink',
  linea = 'linea',
  mainnet = 'mainnet',
  manta = 'manta',
  optimism = 'optimism',
  optimismSepolia = 'optimism-sepolia',
  polygon = 'polygon',
  polygonAmoy = 'polygon-amoy',
  polygonMumbai = 'polygon-mumbai',
  polygonZkEvm = 'polygon-zkevm',
  rari = 'rari',
  sanko = 'sanko',
  scroll = 'scroll',
  sepolia = 'sepolia',
  zksync = 'zksync',
  zora = 'zora',
  zoraSepolia = 'zora-sepolia',
}

export const chainAnvil: ViemChain = {
  id: ANVIL_CHAIN_ID,
  name: 'Anvil',
  nativeCurrency: {
    decimals: 18,
    name: 'Anvil',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: [ANVIL_RPC_URL] },
    default: { http: [ANVIL_RPC_URL] },
  },
  testnet: true,
};

export const chainAnvilOptimism: ViemChain = {
  id: ANVIL_OP_CHAIN_ID,
  name: 'Anvil OP',
  nativeCurrency: {
    decimals: 18,
    name: 'Anvil OP',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: [ANVIL_RPC_URL] },
    default: { http: [ANVIL_RPC_URL] },
  },
  testnet: true,
};

export interface BackendNetworkServices {
  meteorology: {
    enabled: boolean;
  };
  notifications: {
    enabled: boolean;
  };
  swap: {
    enabled: boolean;
    swap: boolean;
    swapExactOutput: boolean;
    bridge: boolean;
    bridgeExactOutput: boolean;
  };
  addys: {
    approvals: boolean;
    transactions: boolean;
    assets: boolean;
    positions: boolean;
    interactionsWith: boolean;
  };
  tokenSearch: {
    enabled: boolean;
  };
  nftProxy: {
    enabled: boolean;
  };
  sponsorship?: {
    enabled: boolean;
  };
  launcher: {
    v1: {
      enabled: boolean;
      contractAddress: Address;
    };
  };
}

export interface BackendNetwork {
  id: string;
  name: string;
  label: string;
  colors: {
    light: string;
    dark: string;
  };
  icons: {
    badgeURL: string;
  };
  testnet: boolean;
  internal: boolean;
  opStack: boolean;
  defaultExplorer: {
    url: string;
    label: string;
    transactionURL: string;
    tokenURL: string;
  };
  defaultRPC: {
    enabledDevices: string[];
    url: string;
  };
  gasUnits: {
    basic: {
      approval: string;
      swap: string;
      swapPermit: string;
      eoaTransfer: string;
      tokenTransfer: string;
    };
    wrapped: {
      wrap: string;
      unwrap: string;
    };
  };
  nativeAsset: {
    address: AddressOrEth;
    name: string;
    symbol: string;
    decimals: number;
    iconURL: string;
    colors: {
      primary: string;
      fallback: string;
      shadow: string;
    };
  };
  nativeWrappedAsset: {
    address: Address;
    name: string;
    symbol: string;
    decimals: number;
    iconURL: string;
    colors: {
      primary: string;
      fallback: string;
      shadow: string;
    };
  };
  privateMempoolTimeout?: number;
  enabledServices: BackendNetworkServices;
}
