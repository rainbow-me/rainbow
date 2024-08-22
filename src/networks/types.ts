import { Chain } from '@wagmi/chains';
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

export const networkToIdMapping: { [key in Network]: ChainId } = {
  [Network.arbitrum]: ChainId.arbitrum,
  [Network.goerli]: ChainId.goerli,
  [Network.mainnet]: ChainId.mainnet,
  [Network.optimism]: ChainId.optimism,
  [Network.polygon]: ChainId.polygon,
  [Network.base]: ChainId.base,
  [Network.bsc]: ChainId.bsc,
  [Network.zora]: ChainId.zora,
  [Network.gnosis]: ChainId.gnosis,
  [Network.avalanche]: ChainId.avalanche,
  [Network.blast]: ChainId.blast,
  [Network.degen]: ChainId.degen,
};

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
  [ChainName.degen]: ChainId.degen,
  [ChainName.gnosis]: ChainId.gnosis,
  [ChainName.linea]: ChainId.linea,
  [ChainName.manta]: ChainId.manta,
  [ChainName.optimism]: ChainId.optimism,
  [ChainName.goerli]: ChainId.goerli,
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
  [ChainName.polygonMumbai]: ChainId.polygonMumbai,
  [ChainName.baseSepolia]: ChainId.baseSepolia,
  [ChainName.zoraSepolia]: ChainId.zoraSepolia,
  [ChainName.blast]: ChainId.blast,
  [ChainName.blastSepolia]: ChainId.blastSepolia,
  [ChainName.polygonAmoy]: ChainId.polygonAmoy,
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
  [ChainId.degen]: ChainName.degen,
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
  [ChainId.polygonMumbai]: ChainName.polygonMumbai,
  [ChainId.baseSepolia]: ChainName.baseSepolia,
  [ChainId.zoraSepolia]: ChainName.zoraSepolia,
  [ChainId.polygonAmoy]: ChainName.polygonAmoy,
};

export const ChainNameDisplay = {
  [ChainId.arbitrum]: 'Arbitrum',
  [ChainId.arbitrumNova]: chain.arbitrumNova.name,
  [ChainId.avalanche]: 'Avalanche',
  [ChainId.avalancheFuji]: 'Avalanche Fuji',
  [ChainId.base]: 'Base',
  [ChainId.blast]: 'Blast',
  [ChainId.blastSepolia]: 'Blast Sepolia',
  [ChainId.bsc]: 'BSC',
  [ChainId.celo]: chain.celo.name,
  [ChainId.degen]: 'Degen Chain',
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
  [ChainId.hardhatOptimism]: 'Hardhat OP',
  [ChainId.sepolia]: chain.sepolia.name,
  [ChainId.holesky]: chain.holesky.name,
  [ChainId.optimismSepolia]: chain.optimismSepolia.name,
  [ChainId.bscTestnet]: 'BSC Testnet',
  [ChainId.polygonMumbai]: chain.polygonMumbai.name,
  [ChainId.arbitrumSepolia]: chain.arbitrumSepolia.name,
  [ChainId.baseSepolia]: chain.baseSepolia.name,
  [ChainId.zoraSepolia]: 'Zora Sepolia',
  [ChainId.polygonAmoy]: 'Polygon Amoy',
} as const;

export interface NetworkProperties extends Chain {
  // network related data
  enabled: boolean;
  name: string;
  longName: string;
  value: Network;

  rpc: string;

  // feature flags
  features: {
    flashbots: boolean;
    walletconnect: boolean;
    swaps: boolean;
    nfts: boolean;
    txs: boolean;
  };

  gas: {
    OptimismTxFee?: boolean;

    // for some networks gas is so cheap we dont want to round the gwei #
    roundGasDisplay: boolean;
  };

  // design tings
  colors: {
    light: string;
    dark: string;
  };
}
