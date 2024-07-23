import { AddressOrEth } from '@/__swaps__/types/assets';
import { ChainId, ChainNameDisplay } from '@/__swaps__/types/chains';
import { Asset } from '@/entities';
import { Network } from '@/helpers/networkTypes';
import { AddressZero } from '@ethersproject/constants';

import type { Address } from 'viem';
import {
  Chain,
  arbitrum,
  arbitrumGoerli,
  arbitrumSepolia,
  avalanche,
  avalancheFuji,
  base,
  baseSepolia,
  bsc,
  bscTestnet,
  goerli,
  holesky,
  mainnet,
  optimism,
  optimismSepolia,
  polygon,
  polygonMumbai,
  zora,
  zoraSepolia,
  sepolia,
  blast,
  degen,
} from 'viem/chains';

export { default as balanceCheckerContractAbi } from './balances-checker-abi.json';
export { default as chainAssets } from './chain-assets.json';
export { signatureRegistryABI, SIGNATURE_REGISTRY_ADDRESS } from './signatureRegistry';
export { default as emojis } from './emojis.json';
export { default as ensIntroMarqueeNames } from './ens-intro-marquee-names.json';
export { default as erc20ABI } from './erc20-abi.json';
export { default as tokenGateCheckerAbi } from './token-gate-checker-abi.json';
export { default as optimismGasOracleAbi } from './optimism-gas-oracle-abi.json';
export { default as ethUnits } from './ethereum-units.json';
export { default as timeUnits } from './time-units.json';
export { supportedCurrencies as supportedNativeCurrencies, type SupportedCurrencyKey, type SupportedCurrency } from './supportedCurrencies';
export { default as shitcoins } from './shitcoins';
export { default as smartContractMethods } from './smartcontract-methods.json';
export { rainbowTokenList } from './rainbow-token-list';
export { gasUnits } from './gasUnits';

export {
  ENSRegistryWithFallbackABI,
  ENSETHRegistrarControllerABI,
  ENSReverseRegistrarABI,
  ENSBaseRegistrarImplementationABI,
  ENSPublicResolverABI,
  ensRegistryAddress,
  ensETHRegistrarControllerAddress,
  ensBaseRegistrarImplementationAddress,
  ensReverseRegistrarAddress,
  ensPublicResolverAddress,
} from './ens';

export const OVM_GAS_PRICE_ORACLE = '0x420000000000000000000000000000000000000F';

// Block Explorers
export const ARBITRUM_BLOCK_EXPLORER_URL = 'arbiscan.io';
export const POLYGON_BLOCK_EXPLORER_URL = 'polygonscan.com';
export const BSC_BLOCK_EXPLORER_URL = 'bscscan.com';
export const OPTIMISM_BLOCK_EXPLORER_URL = 'optimistic.etherscan.io';

// NFTs Contracts
export const SWAP_AGGREGATOR_CONTRACT_ADDRESS = '0x00000000009726632680FB29d3F7A9734E3010E2';
export const ENS_NFT_CONTRACT_ADDRESS = '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85';
export const UNIV3_NFT_CONTRACT_ADDRESS = '0xc36442b4a4522e871399cd717abdd847ab11fe88';
export const POAP_NFT_ADDRESS = '0x22c1f6050e56d2876009903609a2cc3fef83b415';
export const CRYPTO_KITTIES_NFT_ADDRESS = '0x06012c8cf97bead5deae237070f9587f8e7a266d';
export const CRYPTO_PUNKS_NFT_ADDRESS = '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb';

export const ETH_ICON_URL = 'https://s3.amazonaws.com/token-icons/eth.png';
export const RAINBOW_PROFILES_BASE_URL = 'https://rainbow.me';
export const POAP_BASE_URL = 'https://poap.website/';

export const ETH_ADDRESS = 'eth';
export const ETH_SYMBOL = 'ETH';
export const ARBITRUM_ETH_ADDRESS = AddressZero;
export const OPTIMISM_ETH_ADDRESS = AddressZero;
export const ZORA_ETH_ADDRESS = AddressZero;
export const BASE_ETH_ADDRESS = AddressZero;
export const BNB_BSC_ADDRESS = AddressZero;
export const BNB_MAINNET_ADDRESS = '0xb8c77482e45f1f44de1745f52c74426c631bdd52';
export const MATIC_MAINNET_ADDRESS = '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0';
export const MATIC_POLYGON_ADDRESS = '0x0000000000000000000000000000000000001010';
export const DEGEN_CHAIN_DEGEN_ADDRESS = AddressZero;
export const AVAX_AVALANCHE_ADDRESS = AddressZero;
export const WAVAX_AVALANCHE_ADDRESS = '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7';
export const BLAST_ETH_ADDRESS = AddressZero;
export const DAI_AVALANCHE_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f';
export const USDC_AVALANCHE_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
export const WBTC_AVALANCHE_ADDRESS = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599';

export const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
export const WETH_POLYGON_ADDRESS = '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619';
export const WETH_ARBITRUM_ADDRESS = '0x82af49447d8a07e3bd95bd0d56f35241523fbab1';
export const WETH_ZORA_ADDRESS = '0x4200000000000000000000000000000000000006';
export const DAI_POLYGON_ADDRESS = '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063';
export const WMATIC_POLYGON_ADDRESS = '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270';
export const WDEGEN_DEGEN_CHAIN_ADDRESS = '0xeb54dacb4c2ccb64f8074eceea33b5ebb38e5387';
export const WBNB_BSC_ADDRESS = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c';
export const DAI_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f';
export const USDC_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
export const USDC_POLYGON_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
export const USDT_ADDRESS = '0xdac17f958d2ee523a2206206994597c13d831ec7';
export const TUSD_ADDRESS = '0x0000000000085d4780b73119b644ae5ecd22b376';
export const BUSD_ADDRESS = '0x4fabb145d64652a948d72533023f6e7a623c7c53';
export const SUSD_ADDRESS = '0x57ab1ec28d129707052df4df418d58a2d46d5f51';
export const GUSD_ADDRESS = '0x056fd409e1d7a124bd7017459dfea2f387b6d5cd';
export const SOCKS_ADDRESS = '0x23b608675a2b2fb1890d3abbd85c5775c51691d5';
export const WBTC_ADDRESS = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599';
export const DOG_ADDRESS = '0xbaac2b4491727d78d2b78815144570b9f2fe8899';
export const OP_ADDRESS = '0x4200000000000000000000000000000000000042';

export const BASE_DEGEN_ADDRESS = '0x4ed4e862860bed51a9570b96d89af5e1b0efefed';

export const TRANSFER_EVENT_TOPIC_LENGTH = 3;
export const TRANSFER_EVENT_KECCAK = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

export const AddCashCurrencies: {
  [key in Network]?: { [currency: string]: string };
} = {
  mainnet: {
    DAI: DAI_ADDRESS,
    ETH: ETH_ADDRESS,
    USDC: USDC_ADDRESS,
    MATIC: MATIC_MAINNET_ADDRESS,
  },
  polygon: {
    DAI: DAI_POLYGON_ADDRESS,
    ETH: WETH_POLYGON_ADDRESS,
    USDC: USDC_POLYGON_ADDRESS,
    MATIC: MATIC_POLYGON_ADDRESS,
  },
};

export type AddCashCurrencyAsset = Pick<Asset, 'decimals' | 'name' | 'symbol'>;

export const AddCashCurrencyInfo: {
  [key in Network]?: {
    [currency: string]: AddCashCurrencyAsset;
  };
} = {
  mainnet: {
    [DAI_ADDRESS]: {
      decimals: 18,
      name: 'Dai',
      symbol: 'DAI',
    },
    [ETH_ADDRESS]: {
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH',
    },
  },
};

export const NATIVE_ASSETS_PER_CHAIN: Record<ChainId, AddressOrEth> = {
  [ChainId.mainnet]: ETH_ADDRESS as Address,
  [ChainId.hardhat]: AddressZero as Address,
  [ChainId.sepolia]: AddressZero as Address,
  [ChainId.holesky]: AddressZero as Address,
  [ChainId.arbitrum]: AddressZero as Address,
  [ChainId.arbitrumSepolia]: AddressZero as Address,
  [ChainId.bsc]: AddressZero as Address,
  [ChainId.bscTestnet]: AddressZero as Address,
  [ChainId.optimism]: AddressZero as Address,
  [ChainId.hardhatOptimism]: AddressZero as Address,
  [ChainId.optimismSepolia]: AddressZero as Address,
  [ChainId.rari]: AddressZero as Address,
  [ChainId.base]: AddressZero as Address,
  [ChainId.baseSepolia]: AddressZero as Address,
  [ChainId.zora]: AddressZero as Address,
  [ChainId.zoraSepolia]: AddressZero as Address,
  [ChainId.polygon]: MATIC_POLYGON_ADDRESS as Address,
  [ChainId.polygonMumbai]: AddressZero as Address,
  [ChainId.avalanche]: AVAX_AVALANCHE_ADDRESS as Address,
  [ChainId.avalancheFuji]: AddressZero as Address,
  [ChainId.blast]: AddressZero as Address,
  [ChainId.blastSepolia]: AddressZero as Address,
  [ChainId.polygonAmoy]: AddressZero as Address,
};

export const NATIVE_ASSETS_MAP_PER_CHAIN: Record<ChainId, AddressOrEth> = {
  [ChainId.arbitrum]: ETH_ADDRESS,
  [ChainId.arbitrumNova]: ETH_ADDRESS,
  [ChainId.arbitrumSepolia]: ETH_ADDRESS,
  [ChainId.avalanche]: AVAX_AVALANCHE_ADDRESS,
  [ChainId.avalancheFuji]: AVAX_AVALANCHE_ADDRESS,
  [ChainId.base]: ETH_ADDRESS,
  [ChainId.baseSepolia]: ETH_ADDRESS,
  [ChainId.blast]: ETH_ADDRESS,
  [ChainId.blastSepolia]: ETH_ADDRESS,
  [ChainId.bsc]: BNB_MAINNET_ADDRESS,
  [ChainId.bscTestnet]: BNB_MAINNET_ADDRESS,
  [ChainId.celo]: ETH_ADDRESS,
  [ChainId.gnosis]: ETH_ADDRESS,
  [ChainId.hardhat]: ETH_ADDRESS,
  [ChainId.hardhatOptimism]: ETH_ADDRESS,
  [ChainId.holesky]: ETH_ADDRESS,
  [ChainId.linea]: ETH_ADDRESS,
  [ChainId.mainnet]: ETH_ADDRESS,
  [ChainId.manta]: ETH_ADDRESS,
  [ChainId.optimism]: ETH_ADDRESS,
  [ChainId.optimismSepolia]: ETH_ADDRESS,
  [ChainId.polygon]: MATIC_MAINNET_ADDRESS,
  [ChainId.polygonAmoy]: MATIC_MAINNET_ADDRESS,
  [ChainId.polygonMumbai]: MATIC_MAINNET_ADDRESS,
  [ChainId.polygonZkEvm]: MATIC_MAINNET_ADDRESS,
  [ChainId.rari]: ETH_ADDRESS,
  [ChainId.scroll]: ETH_ADDRESS,
  [ChainId.sepolia]: ETH_ADDRESS,
  [ChainId.zora]: ETH_ADDRESS,
  [ChainId.zoraSepolia]: ETH_ADDRESS,
};

export const REFERRER = 'native-app';

export const SUPPORTED_MAINNET_CHAINS: Chain[] = [mainnet, polygon, optimism, arbitrum, base, zora, bsc, avalanche, blast].map(chain => ({
  ...chain,
  name: ChainNameDisplay[chain.id],
}));

export const SUPPORTED_CHAINS = ({ testnetMode = false }: { testnetMode?: boolean }): Chain[] =>
  [
    // In default order of appearance
    mainnet,
    base,
    optimism,
    arbitrum,
    polygon,
    zora,
    blast,
    degen,
    avalanche,
    bsc,

    // Testnets
    goerli,
    holesky,
    sepolia,
    baseSepolia,
    optimismSepolia,
    arbitrumGoerli,
    arbitrumSepolia,
    polygonMumbai,
    zoraSepolia,
    avalancheFuji,
    bscTestnet,
  ].reduce((chainList, chain) => {
    if (testnetMode || !chain.testnet) {
      chainList.push({ ...chain, name: ChainNameDisplay[chain.id] });
    }
    return chainList;
  }, [] as Chain[]);

export const SUPPORTED_CHAIN_IDS = ({ testnetMode = false }: { testnetMode?: boolean }): ChainId[] =>
  SUPPORTED_CHAINS({ testnetMode }).map(chain => chain.id);
