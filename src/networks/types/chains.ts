import { Chain } from 'viem/chains';
import * as chains from 'viem/chains';

const HARDHAT_CHAIN_ID = 1337;
const HARDHAT_OP_CHAIN_ID = 1338;

export const chainHardhat: Chain = {
  id: HARDHAT_CHAIN_ID,
  name: 'Hardhat',
  nativeCurrency: {
    decimals: 18,
    name: 'Hardhat',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['http://127.0.0.1:8545'] },
    default: { http: ['http://127.0.0.1:8545'] },
  },
  testnet: true,
};

export const chainHardhatOptimism: Chain = {
  id: HARDHAT_OP_CHAIN_ID,
  name: 'Hardhat OP',
  nativeCurrency: {
    decimals: 18,
    name: 'Hardhat OP',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['http://127.0.0.1:8545'] },
    default: { http: ['http://127.0.0.1:8545'] },
  },
  testnet: true,
};

export enum ChainName {
  arbitrum = 'arbitrum',
  arbitrumNova = 'arbitrum-nova',
  arbitrumSepolia = 'arbitrum-sepolia',
  avalanche = 'avalanche',
  avalancheFuji = 'avalanche-fuji',
  base = 'base',
  blast = 'blast',
  blastSepolia = 'blast-sepolia',
  bsc = 'bsc',
  celo = 'celo',
  degen = 'degen',
  gnosis = 'gnosis',
  linea = 'linea',
  manta = 'manta',
  optimism = 'optimism',
  polygon = 'polygon',
  polygonZkEvm = 'polygon-zkevm',
  rari = 'rari',
  scroll = 'scroll',
  zora = 'zora',
  mainnet = 'mainnet',
  holesky = 'holesky',
  hardhat = 'hardhat',
  hardhatOptimism = 'hardhat-optimism',
  sepolia = 'sepolia',
  optimismSepolia = 'optimism-sepolia',
  bscTestnet = 'bsc-testnet',
  baseSepolia = 'base-sepolia',
  zoraSepolia = 'zora-sepolia',
  polygonAmoy = 'polygon-amoy',
}

export enum ChainId {
  arbitrum = chains.arbitrum.id,
  arbitrumNova = chains.arbitrumNova.id,
  avalanche = chains.avalanche.id,
  avalancheFuji = chains.avalancheFuji.id,
  base = chains.base.id,
  blast = chains.blast.id,
  blastSepolia = chains.blastSepolia.id,
  bsc = chains.bsc.id,
  celo = chains.celo.id,
  gnosis = chains.gnosis.id,
  linea = chains.linea.id,
  manta = chains.manta.id,
  optimism = chains.optimism.id,
  mainnet = chains.mainnet.id,
  polygon = chains.polygon.id,
  polygonZkEvm = chains.polygonZkEvm.id,
  rari = 1380012617,
  zora = chains.zora.id,
  hardhat = chainHardhat.id,
  hardhatOptimism = chainHardhatOptimism.id,
  sepolia = chains.sepolia.id,
  scroll = chains.scroll.id,
  holesky = chains.holesky.id,
  optimismSepolia = chains.optimismSepolia.id,
  bscTestnet = chains.bscTestnet.id,
  arbitrumSepolia = chains.arbitrumSepolia.id,
  baseSepolia = chains.baseSepolia.id,
  zoraSepolia = chains.zoraSepolia.id,
  polygonAmoy = chains.polygonAmoy.id,
  degen = chains.degen.id,
}

export const chainNameToIdMapping: {
  [key in ChainName | 'ethereum' | 'ethereum-sepolia']: ChainId;
} = {
  ['ethereum']: ChainId.mainnet,
  [ChainName.arbitrum]: ChainId.arbitrum,
  [ChainName.arbitrumNova]: ChainId.arbitrumNova,
  [ChainName.arbitrumSepolia]: ChainId.arbitrumSepolia,
  [ChainName.avalanche]: ChainId.avalanche,
  [ChainName.avalancheFuji]: ChainId.avalancheFuji,
  [ChainName.base]: ChainId.base,
  [ChainName.bsc]: ChainId.bsc,
  [ChainName.celo]: ChainId.celo,
  [ChainName.gnosis]: ChainId.gnosis,
  [ChainName.linea]: ChainId.linea,
  [ChainName.manta]: ChainId.manta,
  [ChainName.optimism]: ChainId.optimism,
  [ChainName.polygon]: ChainId.polygon,
  [ChainName.polygonZkEvm]: ChainId.polygonZkEvm,
  [ChainName.rari]: ChainId.rari,
  [ChainName.scroll]: ChainId.scroll,
  [ChainName.zora]: ChainId.zora,
  [ChainName.mainnet]: ChainId.mainnet,
  [ChainName.holesky]: ChainId.holesky,
  [ChainName.hardhat]: ChainId.hardhat,
  [ChainName.hardhatOptimism]: ChainId.hardhatOptimism,
  ['ethereum-sepolia']: ChainId.sepolia,
  [ChainName.sepolia]: ChainId.sepolia,
  [ChainName.optimismSepolia]: ChainId.optimismSepolia,
  [ChainName.bscTestnet]: ChainId.bscTestnet,
  [ChainName.baseSepolia]: ChainId.baseSepolia,
  [ChainName.zoraSepolia]: ChainId.zoraSepolia,
  [ChainName.blast]: ChainId.blast,
  [ChainName.blastSepolia]: ChainId.blastSepolia,
  [ChainName.polygonAmoy]: ChainId.polygonAmoy,
  [ChainName.degen]: ChainId.degen,
};

export const chainIdToNameMapping: {
  [key in ChainId]: ChainName;
} = {
  [ChainId.arbitrum]: ChainName.arbitrum,
  [ChainId.arbitrumNova]: ChainName.arbitrumNova,
  [ChainId.arbitrumSepolia]: ChainName.arbitrumSepolia,
  [ChainId.avalanche]: ChainName.avalanche,
  [ChainId.avalancheFuji]: ChainName.avalancheFuji,
  [ChainId.base]: ChainName.base,
  [ChainId.blast]: ChainName.blast,
  [ChainId.blastSepolia]: ChainName.blastSepolia,
  [ChainId.bsc]: ChainName.bsc,
  [ChainId.celo]: ChainName.celo,
  [ChainId.gnosis]: ChainName.gnosis,
  [ChainId.linea]: ChainName.linea,
  [ChainId.manta]: ChainName.manta,
  [ChainId.optimism]: ChainName.optimism,
  [ChainId.polygon]: ChainName.polygon,
  [ChainId.polygonZkEvm]: ChainName.polygonZkEvm,
  [ChainId.rari]: ChainName.rari,
  [ChainId.scroll]: ChainName.scroll,
  [ChainId.zora]: ChainName.zora,
  [ChainId.mainnet]: ChainName.mainnet,
  [ChainId.holesky]: ChainName.holesky,
  [ChainId.hardhat]: ChainName.hardhat,
  [ChainId.hardhatOptimism]: ChainName.hardhatOptimism,
  [ChainId.sepolia]: ChainName.sepolia,
  [ChainId.optimismSepolia]: ChainName.optimismSepolia,
  [ChainId.bscTestnet]: ChainName.bscTestnet,
  [ChainId.baseSepolia]: ChainName.baseSepolia,
  [ChainId.zoraSepolia]: ChainName.zoraSepolia,
  [ChainId.polygonAmoy]: ChainName.polygonAmoy,
  [ChainId.degen]: ChainName.degen,
};

export interface BackendNetworkServices {
  meteorology: {
    enabled: boolean;
  };
  swap: {
    enabled: boolean;
  };
  addys: {
    approvals: boolean;
    transactions: boolean;
    assets: boolean;
    positions: boolean;
  };
  tokenSearch: {
    enabled: boolean;
  };
  nftProxy: {
    enabled: boolean;
  };
}

export interface BackendNetwork {
  id: string;
  name: string;
  label: string;
  icons: {
    badgeURL: string;
  };
  testnet: boolean;
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
    address: string;
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
    address: string;
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
  enabledServices: BackendNetworkServices;
}
