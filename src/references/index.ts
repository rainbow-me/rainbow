import { mapKeys, mapValues } from 'lodash';
import { savingsAssets } from './compound';
import { Asset, SavingsAsset } from '@rainbow-me/entities';

export { default as balanceCheckerContractAbi } from './balances-checker-abi.json';
export { default as chains } from './chains.json';
export { default as coingeckoIdsFallback } from './coingecko/ids.json';
export { compoundCERC20ABI, compoundCETHABI } from './compound';
export { default as DefaultTokenLists } from './default-token-lists.json';
export {
  defiSdkAdapterRegistryABI,
  DEFI_SDK_ADAPTER_REGISTRY_ADDRESS,
} from './defisdk';
export { default as emojis } from './emojis.json';
export { default as erc20ABI } from './erc20-abi.json';
export { default as ethUnits } from './ethereum-units.json';
export { DPI_ADDRESS } from './indexes';
export { default as migratedTokens } from './migratedTokens.json';
export { default as supportedNativeCurrencies } from './native-currencies.json';
export { default as shitcoins } from './shitcoins.json';
export { default as smartContractMethods } from './smartcontract-methods.json';
export { default as testnetAssets } from './testnet-assets.json';
export {
  CURATED_UNISWAP_TOKENS,
  PAIR_GET_RESERVES_CALL_DATA,
  PAIR_GET_RESERVES_FRAGMENT,
  PAIR_INTERFACE,
  RAINBOW_TOKEN_LIST,
  TOKEN_SAFE_LIST,
  UNISWAP_TESTNET_TOKEN_LIST,
  UNISWAP_V1_EXCHANGE_ABI,
  UNISWAP_V2_BASES,
  UNISWAP_V2_ROUTER_ABI,
  UNISWAP_V2_ROUTER_ADDRESS,
} from './uniswap';
export {
  getWyreErrorOverride,
  wyreSupportedCountries,
  WYRE_SUPPORTED_COUNTRIES_ISO,
} from './wyre';

export const ETH_ICON_URL = 'https://s3.amazonaws.com/token-icons/eth.png';

export const ETH_COINGECKO_ID = 'ethereum';
export const ETH_ADDRESS = 'eth';
export const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
export const CDAI_CONTRACT = '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643';
export const SAI_ADDRESS = '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359';
export const DAI_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f';
export const USDC_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
export const USDT_ADDRESS = '0xdac17f958d2ee523a2206206994597c13d831ec7';
export const TUSD_ADDRESS = '0x0000000000085d4780b73119b644ae5ecd22b376';
export const BUSD_ADDRESS = '0x4fabb145d64652a948d72533023f6e7a623c7c53';
export const SUSD_ADDRESS = '0x57ab1ec28d129707052df4df418d58a2d46d5f51';
export const GUSD_ADDRESS = '0x056fd409e1d7a124bd7017459dfea2f387b6d5cd';
export const SOCKS_ADDRESS = '0x23B608675a2B2fB1890d3ABBd85c5775c51691d5';
export const WBTC_ADDRESS = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';

export const TRANSFER_EVENT_TOPIC_LENGTH = 3;
export const TRANSFER_EVENT_KECCAK =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

export const AddCashCurrencies = {
  kovan: {
    DAI: '0xc4375b7de8af5a38a93548eb8453a498222c4ff2',
    ETH: ETH_ADDRESS,
  },
  mainnet: {
    DAI: DAI_ADDRESS,
    ETH: ETH_ADDRESS,
  },
};

export const AddCashCurrencyInfo = {
  kovan: {
    '0xc4375b7de8af5a38a93548eb8453a498222c4ff2': {
      decimals: 18,
      name: 'Dai',
      symbol: 'DAI',
    },
    'eth': {
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH',
    },
  },
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

export const DefaultUniswapFavorites = {
  mainnet: [ETH_ADDRESS, DAI_ADDRESS, WBTC_ADDRESS, SOCKS_ADDRESS],
  rinkeby: [
    // Ethereum
    ETH_ADDRESS,
    // DAI
    '0x5592ec0cfb4dbc12d3ab100b257153436a1f0fea',
  ],
};

export const savingsAssetsList: Record<
  string,
  Record<string, Asset>
> = savingsAssets;

export const savingsAssetsListByUnderlying: Record<
  string,
  Record<string, SavingsAsset>
> = mapValues(savingsAssets, (assetsByNetwork: Record<string, Asset>) =>
  mapKeys(
    mapValues(assetsByNetwork, (assetByContract, contractAddress) => ({
      ...assetByContract,
      contractAddress,
    })),
    value => value.address
  )
);
