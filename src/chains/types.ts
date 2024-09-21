import * as chain from 'viem/chains';

const HARDHAT_CHAIN_ID = 1337;
const HARDHAT_OP_CHAIN_ID = 1338;

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

export enum ChainId {
  arbitrum = chain.arbitrum.id,
  arbitrumNova = chain.arbitrumNova.id,
  arbitrumSepolia = chain.arbitrumSepolia.id,
  avalanche = chain.avalanche.id,
  avalancheFuji = chain.avalancheFuji.id,
  base = chain.base.id,
  baseSepolia = chain.baseSepolia.id,
  blast = chain.blast.id,
  blastSepolia = chain.blastSepolia.id,
  bsc = chain.bsc.id,
  bscTestnet = chain.bscTestnet.id,
  celo = chain.celo.id,
  degen = chain.degen.id,
  gnosis = chain.gnosis.id,
  goerli = chain.goerli.id,
  hardhat = HARDHAT_CHAIN_ID,
  hardhatOptimism = HARDHAT_OP_CHAIN_ID,
  holesky = chain.holesky.id,
  linea = chain.linea.id,
  mainnet = chain.mainnet.id,
  manta = chain.manta.id,
  optimism = chain.optimism.id,
  optimismSepolia = chain.optimismSepolia.id,
  polygon = chain.polygon.id,
  polygonAmoy = chain.polygonAmoy.id,
  polygonMumbai = chain.polygonMumbai.id,
  polygonZkEvm = chain.polygonZkEvm.id,
  rari = 1380012617,
  scroll = chain.scroll.id,
  sepolia = chain.sepolia.id,
  zora = chain.zora.id,
  zoraSepolia = chain.zoraSepolia.id,
}

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
  goerli = 'goerli',
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
  polygonMumbai = 'polygon-mumbai',
  baseSepolia = 'base-sepolia',
  zoraSepolia = 'zora-sepolia',
  polygonAmoy = 'polygon-amoy',
}

export const chainHardhat: chain.Chain = {
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

export const chainHardhatOptimism: chain.Chain = {
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

export interface BackendNetworkServices {
  meteorology: {
    enabled: boolean;
  };
  notifications: {
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
