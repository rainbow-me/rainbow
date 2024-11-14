import { Asset } from '@/entities';

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

// NFTs Contracts
export const ENS_NFT_CONTRACT_ADDRESS = '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85';
export const POAP_NFT_ADDRESS = '0x22c1f6050e56d2876009903609a2cc3fef83b415';
export const CRYPTO_KITTIES_NFT_ADDRESS = '0x06012c8cf97bead5deae237070f9587f8e7a266d';
export const CRYPTO_PUNKS_NFT_ADDRESS = '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb';

export const RAINBOW_PROFILES_BASE_URL = 'https://rainbow.me';
export const POAP_BASE_URL = 'https://poap.website/';

// Symbols
export const ETH_SYMBOL = 'ETH';

// Default Favorites
export const ETH_ADDRESS = 'eth';
export const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
export const DAI_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f';
export const SOCKS_ADDRESS = '0x23b608675a2b2fb1890d3abbd85c5775c51691d5';
export const WBTC_ADDRESS = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599';
export const USDC_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

// Other Assets
export const DOG_ADDRESS = '0xbaac2b4491727d78d2b78815144570b9f2fe8899';

export type AddCashCurrencyAsset = Pick<Asset, 'decimals' | 'name' | 'symbol'>;

export type ReferrerType = 'native-app' | 'app-claim';
export const REFERRER: ReferrerType = 'native-app';
export const REFERRER_CLAIM: ReferrerType = 'app-claim';
