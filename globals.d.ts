/**
 * @deprecated use `IS_ANDROID` from `@/env`
 */
declare let android: boolean;
/**
 * @deprecated use `IS_IOS` from `@/env`
 */
declare let ios: boolean;
/**
 * @deprecated use `IS_WEB` from `@/env`
 */
declare let web: boolean;
/**
 * @deprecated use `IS_DEV` from `@/env`
 */
declare let __DEV__: boolean;
/**
 * @deprecated use `IS_DEV` from `@/env`
 */
declare let IS_DEV: boolean;

declare module 'react-native-dotenv' {
  export const IS_TESTING: 'true' | 'false';
  export const IS_APK_BUILD: 'true' | 'false';
  export const ENABLE_DEV_MODE: '0' | '1';
  export const SENTRY_ENDPOINT: string;
  export const SENTRY_ENVIRONMENT: string;
  export const DATA_API_KEY: string;
  export const DATA_ENDPOINT: string;
  export const DATA_ORIGIN: string;
  export const ADDYS_API_KEY: string;
  export const ETHEREUM_GOERLI_RPC: string;
  export const ETHEREUM_GOERLI_RPC_DEV: string;
  export const ETHEREUM_KOVAN_RPC: string;
  export const ETHEREUM_KOVAN_RPC_DEV: string;
  export const ETHEREUM_MAINNET_RPC: string;
  export const ETHEREUM_MAINNET_RPC_DEV: string;
  export const ETHEREUM_RINKEBY_RPC: string;
  export const ETHEREUM_RINKEBY_RPC_DEV: string;
  export const ETHEREUM_ROPSTEN_RPC: string;
  export const ETHEREUM_ROPSTEN_RPC_DEV: string;
  export const OPTIMISM_MAINNET_RPC: string;
  export const BASE_MAINNET_RPC: string;
  export const BASE_MAINNET_RPC_DEV: string;
  export const POLYGON_MAINNET_RPC: string;
  export const ARBITRUM_MAINNET_RPC: string;
  export const BSC_MAINNET_RPC: string;
  export const ZORA_MAINNET_RPC: string;
  export const RAINBOW_WYRE_MERCHANT_ID: string;
  export const RAINBOW_WYRE_MERCHANT_ID_TEST: string;
  export const WYRE_ACCOUNT_ID: string;
  export const WYRE_ACCOUNT_ID_TEST: string;
  export const WYRE_ENDPOINT: string;
  export const WYRE_ENDPOINT_TEST: string;
  export const WYRE_TOKEN: string;
  export const WYRE_TOKEN_TEST: string;
  export const IMGIX_DOMAIN: string;
  export const IMGIX_TOKEN: string;
  export const CLOUDINARY_API_KEY: string;
  export const CLOUDINARY_API_SECRET: string;
  export const CLOUDINARY_CLOUD_NAME: string;
  export const PINATA_API_KEY: string;
  export const PINATA_API_SECRET: string;
  export const PINATA_API_URL: string;
  export const PINATA_GATEWAY_URL: string;
  export const APP_CENTER_READ_ONLY_TOKEN_ANDROID: string;
  export const APP_CENTER_READ_ONLY_TOKEN_IOS: string;
  export const CODE_PUSH_DEPLOYMENT_KEY_ANDROID: string;
  export const CODE_PUSH_DEPLOYMENT_KEY_IOS: string;
  export const COVALENT_ANDROID_API_KEY: string;
  export const COVALENT_IOS_API_KEY: string;
  export const NFT_API_KEY: string;
  export const NFT_API_URL: string;
  export const ETHERSCAN_API_KEY: string;
  export const POAP_API_KEY: string;
  export const HARDHAT_URL_ANDROID: string;
  export const HARDHAT_URL_IOS: string;
  export const SIMPLEHASH_API_KEY: string;
  export const RAINBOW_MASTER_KEY: string;
  export const REACT_APP_SEGMENT_API_WRITE_KEY: string;
  export const SECURE_WALLET_HASH_KEY: string;
  export const TEST_SEEDS: string;
  export const DEV_PKEY: string;
  export const RAINBOW_TOKEN_LIST_URL: string;
  export const WC_PROJECT_ID: string;
  export const RAMP_HOST_API_KEY: string;
  export const LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  export const LOG_DEBUG: string;
  export const QUIET_OLD_LOGGER: string;
  export const ARC_GRAPHQL_API_KEY: string;
  export const RESERVOIR_API_KEY_PROD: string;
  export const RESERVOIR_API_KEY_DEV: string;
}
