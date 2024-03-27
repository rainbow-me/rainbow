import * as chain from 'viem/chains';
import type { Chain as _Chain } from 'viem/chains';

export type Chain = _Chain & {
  network: string;
};

const HARDHAT_CHAIN_ID = 1337;
const BLAST_CHAIN_ID = 81457;
const HARDHAT_OP_CHAIN_ID = 1338;

export const chainHardhat: Chain = {
  id: HARDHAT_CHAIN_ID,
  name: 'Hardhat',
  network: 'hardhat',
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

export const chainBlast: Chain = {
  id: BLAST_CHAIN_ID,
  name: 'Blast',
  network: 'blast',
  rpcUrls: {
    public: { http: [process.env.BLAST_MAINNET_RPC as string] },
    default: {
      http: [process.env.BLAST_MAINNET_RPC as string],
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

export const chainHardhatOptimism: Chain = {
  id: HARDHAT_OP_CHAIN_ID,
  name: 'Hardhat OP',
  network: 'hardhat-optimism',
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
  bsc = 'bsc',
  celo = 'celo',
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
  goerli = 'goerli',
  sepolia = 'sepolia',
  optimismSepolia = 'optimism-sepolia',
  bscTestnet = 'bsc-testnet',
  polygonMumbai = 'polygon-mumbai',
  arbitrumGoerli = 'arbitrum-goerli',
  baseSepolia = 'base-sepolia',
  zoraSepolia = 'zora-sepolia',
}

export enum ChainId {
  arbitrum = chain.arbitrum.id,
  arbitrumNova = chain.arbitrumNova.id,
  avalanche = chain.avalanche.id,
  avalancheFuji = chain.avalancheFuji.id,
  base = chain.base.id,
  blast = BLAST_CHAIN_ID,
  bsc = chain.bsc.id,
  celo = chain.celo.id,
  gnosis = chain.gnosis.id,
  linea = chain.linea.id,
  manta = chain.manta.id,
  optimism = chain.optimism.id,
  mainnet = chain.mainnet.id,
  polygon = chain.polygon.id,
  polygonZkEvm = chain.polygonZkEvm.id,
  rari = 1380012617,
  zora = chain.zora.id,
  hardhat = HARDHAT_CHAIN_ID,
  hardhatOptimism = chainHardhatOptimism.id,
  goerli = chain.goerli.id,
  sepolia = chain.sepolia.id,
  scroll = chain.scroll.id,
  holesky = chain.holesky.id,
  optimismSepolia = chain.optimismSepolia.id,
  bscTestnet = chain.bscTestnet.id,
  polygonMumbai = chain.polygonMumbai.id,
  arbitrumGoerli = chain.arbitrumGoerli.id,
  arbitrumSepolia = chain.arbitrumSepolia.id,
  baseSepolia = chain.baseSepolia.id,
  zoraSepolia = chain.zoraSepolia.id,
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
  [ChainName.goerli]: ChainId.goerli,
  ['ethereum-sepolia']: ChainId.sepolia,
  [ChainName.sepolia]: ChainId.sepolia,
  [ChainName.optimismSepolia]: ChainId.optimismSepolia,
  [ChainName.bscTestnet]: ChainId.bscTestnet,
  [ChainName.polygonMumbai]: ChainId.polygonMumbai,
  [ChainName.arbitrumGoerli]: ChainId.arbitrumGoerli,
  [ChainName.baseSepolia]: ChainId.baseSepolia,
  [ChainName.zoraSepolia]: ChainId.zoraSepolia,
  [ChainName.blast]: ChainId.blast,
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
  [ChainId.goerli]: ChainName.goerli,
  [ChainId.sepolia]: ChainName.sepolia,
  [ChainId.optimismSepolia]: ChainName.optimismSepolia,
  [ChainId.bscTestnet]: ChainName.bscTestnet,
  [ChainId.polygonMumbai]: ChainName.polygonMumbai,
  [ChainId.arbitrumGoerli]: ChainName.arbitrumGoerli,
  [ChainId.baseSepolia]: ChainName.baseSepolia,
  [ChainId.zoraSepolia]: ChainName.zoraSepolia,
};

export const ChainNameDisplay = {
  [ChainId.arbitrum]: 'Arbitrum',
  [ChainId.arbitrumNova]: chain.arbitrumNova.name,
  [ChainId.avalanche]: 'Avalanche',
  [ChainId.avalancheFuji]: 'Avalanche Fuji',
  [ChainId.base]: 'Base',
  [ChainId.blast]: 'Blast',
  [ChainId.bsc]: 'BSC',
  [ChainId.celo]: chain.celo.name,
  [ChainId.linea]: 'Linea',
  [ChainId.manta]: 'Manta',
  [ChainId.optimism]: 'Optimism',
  [ChainId.polygon]: 'Polygon',
  [ChainId.polygonZkEvm]: chain.polygonZkEvm.name,
  [ChainId.rari]: 'RARI Chain',
  [ChainId.scroll]: chain.scroll.name,
  [ChainId.zora]: 'Zora',
  [ChainId.mainnet]: 'Ethereum',
  [ChainId.hardhat]: 'Hardhat',
  [ChainId.hardhatOptimism]: chainHardhatOptimism.name,
  [ChainId.goerli]: chain.goerli.name,
  [ChainId.sepolia]: chain.sepolia.name,
  [ChainId.holesky]: chain.holesky.name,
  [ChainId.optimismSepolia]: chain.optimismSepolia.name,
  [ChainId.bscTestnet]: 'BSC Testnet',
  [ChainId.polygonMumbai]: chain.polygonMumbai.name,
  [ChainId.arbitrumGoerli]: chain.arbitrumGoerli.name,
  [ChainId.arbitrumSepolia]: chain.arbitrumSepolia.name,
  [ChainId.baseSepolia]: chain.baseSepolia.name,
  [ChainId.zoraSepolia]: 'Zora Sepolia',
} as const;
