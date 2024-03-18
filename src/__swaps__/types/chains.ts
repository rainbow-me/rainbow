import * as chain from 'viem/chains';
import type { Chain } from '@wagmi/chains';

const HARDHAT_CHAIN_ID = 1337;
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
  arbitrumSepolia = 'arbitrum-sepolia',
  base = 'base',
  bsc = 'bsc',
  optimism = 'optimism',
  polygon = 'polygon',
  zora = 'zora',
  mainnet = 'mainnet',
  holesky = 'holesky',
  hardhat = 'hardhat',
  hardhatOptimism = 'hardhat-optimism',
  goerli = 'goerli',
  sepolia = 'sepolia',
  optimismGoerli = 'optimism-goerli',
  optimismSepolia = 'optimism-sepolia',
  bscTestnet = 'bsc-testnet',
  polygonMumbai = 'polygon-mumbai',
  arbitrumGoerli = 'arbitrum-goerli',
  baseGoerli = 'base-goerli',
  baseSepolia = 'base-sepolia',
  zoraTestnet = 'zora-testnet',
  zoraSepolia = 'zora-sepolia',
}

export enum ChainId {
  arbitrum = chain.arbitrum.id,
  base = chain.base.id,
  bsc = chain.bsc.id,
  optimism = chain.optimism.id,
  mainnet = chain.mainnet.id,
  polygon = chain.polygon.id,
  zora = chain.zora.id,
  hardhat = HARDHAT_CHAIN_ID,
  hardhatOptimism = chainHardhatOptimism.id,
  goerli = chain.goerli.id,
  sepolia = chain.sepolia.id,
  holesky = chain.holesky.id,
  optimismGoerli = chain.optimismGoerli.id,
  optimismSepolia = chain.optimismSepolia.id,
  bscTestnet = chain.bscTestnet.id,
  polygonMumbai = chain.polygonMumbai.id,
  arbitrumGoerli = chain.arbitrumGoerli.id,
  arbitrumSepolia = chain.arbitrumSepolia.id,
  baseGoerli = chain.baseGoerli.id,
  baseSepolia = chain.baseSepolia.id,
  zoraTestnet = chain.zoraTestnet.id,
  zoraSepolia = chain.zoraSepolia.id,
}

export const chainNameToIdMapping: {
  [key in ChainName]: ChainId;
} = {
  [ChainName.arbitrum]: ChainId.arbitrum,
  [ChainName.arbitrumSepolia]: ChainId.arbitrumSepolia,
  [ChainName.base]: ChainId.base,
  [ChainName.bsc]: ChainId.bsc,
  [ChainName.optimism]: ChainId.optimism,
  [ChainName.polygon]: ChainId.polygon,
  [ChainName.zora]: ChainId.zora,
  [ChainName.mainnet]: ChainId.mainnet,
  [ChainName.holesky]: ChainId.holesky,
  [ChainName.hardhat]: ChainId.hardhat,
  [ChainName.hardhatOptimism]: ChainId.hardhatOptimism,
  [ChainName.goerli]: ChainId.goerli,
  [ChainName.sepolia]: ChainId.sepolia,
  [ChainName.optimismGoerli]: ChainId.optimismGoerli,
  [ChainName.optimismSepolia]: ChainId.optimismSepolia,
  [ChainName.bscTestnet]: ChainId.bscTestnet,
  [ChainName.polygonMumbai]: ChainId.polygonMumbai,
  [ChainName.arbitrumGoerli]: ChainId.arbitrumGoerli,
  [ChainName.baseGoerli]: ChainId.baseGoerli,
  [ChainName.baseSepolia]: ChainId.baseSepolia,
  [ChainName.zoraTestnet]: ChainId.zoraTestnet,
  [ChainName.zoraSepolia]: ChainId.zoraSepolia,
};

export const chainIdToNameMapping: {
  [key in ChainId]: ChainName;
} = {
  [ChainId.arbitrum]: ChainName.arbitrum,
  [ChainId.arbitrumSepolia]: ChainName.arbitrumSepolia,
  [ChainId.base]: ChainName.base,
  [ChainId.bsc]: ChainName.bsc,
  [ChainId.optimism]: ChainName.optimism,
  [ChainId.polygon]: ChainName.polygon,
  [ChainId.zora]: ChainName.zora,
  [ChainId.mainnet]: ChainName.mainnet,
  [ChainId.holesky]: ChainName.holesky,
  [ChainId.hardhat]: ChainName.hardhat,
  [ChainId.hardhatOptimism]: ChainName.hardhatOptimism,
  [ChainId.goerli]: ChainName.goerli,
  [ChainId.sepolia]: ChainName.sepolia,
  [ChainId.optimismGoerli]: ChainName.optimismGoerli,
  [ChainId.optimismSepolia]: ChainName.optimismSepolia,
  [ChainId.bscTestnet]: ChainName.bscTestnet,
  [ChainId.polygonMumbai]: ChainName.polygonMumbai,
  [ChainId.arbitrumGoerli]: ChainName.arbitrumGoerli,
  [ChainId.baseGoerli]: ChainName.baseGoerli,
  [ChainId.baseSepolia]: ChainName.baseSepolia,
  [ChainId.zoraTestnet]: ChainName.zoraTestnet,
  [ChainId.zoraSepolia]: ChainName.zoraSepolia,
};

export const ChainNameDisplay = {
  [ChainId.arbitrum]: 'Arbitrum',
  [ChainId.base]: 'Base',
  [ChainId.bsc]: 'BSC',
  [ChainId.optimism]: 'Optimism',
  [ChainId.polygon]: 'Polygon',
  [ChainId.zora]: 'Zora',
  [ChainId.mainnet]: 'Ethereum',
  [ChainId.hardhat]: 'Hardhat',
  [ChainId.hardhatOptimism]: chainHardhatOptimism.name,
  [ChainId.goerli]: chain.goerli.name,
  [ChainId.sepolia]: chain.sepolia.name,
  [ChainId.holesky]: chain.holesky.name,
  [ChainId.optimismGoerli]: chain.optimismGoerli.name,
  [ChainId.optimismSepolia]: chain.optimismSepolia.name,
  [ChainId.bscTestnet]: 'BSC Testnet',
  [ChainId.polygonMumbai]: chain.polygonMumbai.name,
  [ChainId.arbitrumGoerli]: chain.arbitrumGoerli.name,
  [ChainId.arbitrumSepolia]: chain.arbitrumSepolia.name,
  [ChainId.baseGoerli]: chain.baseGoerli.name,
  [ChainId.baseSepolia]: chain.baseSepolia.name,
  [ChainId.zoraTestnet]: 'Zora Goerli',
  [ChainId.zoraSepolia]: 'Zora Sepolia',
} as const;
