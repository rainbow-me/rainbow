declare module '*.png';
declare module '*.svg';
declare module '*.jpeg';
declare module '*.jpg';

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
  export const ADDYS_API_KEY: string;
  export const ETHEREUM_MAINNET_RPC_DEV: string;
  export const IMGIX_DOMAIN: string;
  export const IMGIX_TOKEN: string;
  export const CLOUDINARY_API_KEY: string;
  export const CLOUDINARY_API_SECRET: string;
  export const CLOUDINARY_CLOUD_NAME: string;
  export const NOTIFICATIONS_API_KEY: string;
  export const PINATA_API_KEY: string;
  export const PINATA_API_SECRET: string;
  export const PINATA_API_URL: string;
  export const PINATA_GATEWAY_URL: string;
  export const APP_CENTER_READ_ONLY_TOKEN_ANDROID: string;
  export const APP_CENTER_READ_ONLY_TOKEN_IOS: string;
  export const CODE_PUSH_DEPLOYMENT_KEY_ANDROID: string;
  export const CODE_PUSH_DEPLOYMENT_KEY_IOS: string;
  export const NFT_API_KEY: string;
  export const NFT_API_URL: string;
  export const ETHERSCAN_API_KEY: string;
  export const ANVIL_URL_ANDROID: string;
  export const ANVIL_URL_IOS: string;
  export const RAINBOW_MASTER_KEY: string;
  export const SECURE_WALLET_HASH_KEY: string;
  export const TEST_SEEDS: string;
  export const DEV_PKEY: string;
  export const RAINBOW_TOKEN_LIST_URL: string;
  export const WC_PROJECT_ID: string;
  export const LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  export const LOG_DEBUG: string;
  export const QUIET_OLD_LOGGER: string;
  export const ARC_GRAPHQL_API_KEY: string;
  export const METADATA_GRAPHQL_API_KEY: string;
  export const GRAPH_ENS_API_KEY: string;
  export const RESERVOIR_API_KEY_PROD: string;
  export const RESERVOIR_API_KEY_DEV: string;
  export const RPC_PROXY_BASE_URL_PROD: string;
  export const RPC_PROXY_BASE_URL_DEV: string;
  export const RPC_PROXY_API_KEY_PROD: string;
  export const RPC_PROXY_API_KEY_DEV: string;
  export const REACT_NATIVE_RUDDERSTACK_WRITE_KEY: string;
  export const RUDDERSTACK_DATA_PLANE_URL: string;
  export const SILENCE_EMOJI_WARNINGS: boolean;
  export const MWP_ENCRYPTION_KEY: string;
}
