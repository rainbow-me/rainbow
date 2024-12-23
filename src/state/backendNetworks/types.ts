import * as chain from 'viem/chains';

const ANVIL_CHAIN_ID = 1337;
const ANVIL_OP_CHAIN_ID = 1338;
const ANVIL_RPC_URL = 'http://127.0.0.1:8545/';

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
  apechain = chain.apeChain.id,
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
  gravity = chain.gravity.id,
  anvil = ANVIL_CHAIN_ID,
  anvilOptimism = ANVIL_OP_CHAIN_ID,
  holesky = chain.holesky.id,
  ink = 57073,
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
  sanko = chain.sanko.id,
  scroll = chain.scroll.id,
  sepolia = chain.sepolia.id,
  zksync = chain.zksync.id,
  zora = chain.zora.id,
  zoraSepolia = chain.zoraSepolia.id,
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

export const chainAnvil: chain.Chain = {
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

export const chainAnvilOptimism: chain.Chain = {
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
  privateMempoolTimeout?: number;
  enabledServices: BackendNetworkServices;
}
