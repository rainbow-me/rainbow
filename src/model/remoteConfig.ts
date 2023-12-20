import { useQuery } from '@tanstack/react-query';
import { createQueryKey, queryClient } from '@/react-query';
import remoteConfig from '@react-native-firebase/remote-config';
import {
  ARBITRUM_MAINNET_RPC,
  DATA_API_KEY,
  DATA_ENDPOINT,
  DATA_ORIGIN,
  ETHEREUM_GOERLI_RPC,
  ETHEREUM_GOERLI_RPC_DEV,
  ETHEREUM_MAINNET_RPC,
  ETHEREUM_MAINNET_RPC_DEV,
  OPTIMISM_MAINNET_RPC,
  POLYGON_MAINNET_RPC,
  BASE_MAINNET_RPC,
  BASE_MAINNET_RPC_DEV,
  BSC_MAINNET_RPC,
  ZORA_MAINNET_RPC,
} from 'react-native-dotenv';
import { RainbowError, logger } from '@/logger';

interface RainbowConfig extends Record<string, string | boolean | number> {
  arbitrum_mainnet_rpc: string;
  bsc_mainnet_rpc: string;
  data_api_key: string;
  data_endpoint: string;
  data_origin: string;
  default_slippage_bips: string;
  ethereum_goerli_rpc: string;
  ethereum_mainnet_rpc: string;
  f2c_enabled: boolean;
  flashbots_enabled: boolean;
  op_nft_network: string;
  op_rewards_enabled: boolean;
  optimism_mainnet_rpc: string;
  polygon_mainnet_rpc: string;
  zora_mainnet_rpc: string;
  base_mainnet_rpc: string;
  swagg_enabled: boolean;
  trace_call_block_number_offset: number;
  profiles_enabled: boolean;

  arbitrum_enabled: boolean;
  bsc_enabled: boolean;
  polygon_enabled: boolean;
  optimism_enabled: boolean;
  zora_enabled: boolean;
  base_enabled: boolean;
  op_chains_enabled: boolean;
  mainnet_enabled: boolean;
  goerli_enabled: boolean;

  arbitrum_tx_enabled: boolean;
  base_tx_enabled: boolean;
  bsc_tx_enabled: boolean;
  polygon_tx_enabled: boolean;
  optimism_tx_enabled: boolean;
  zora_tx_enabled: boolean;
  op_chains_tx_enabled: boolean;
  mainnet_tx_enabled: boolean;
  goerli_tx_enabled: boolean;

  base_swaps_enabled: boolean;
  mints_enabled: boolean;
  points_enabled: boolean;
  points_fully_enabled: boolean;
  rpc_proxy_enabled: boolean;
  remote_promo_enabled: boolean;
  test_do_not_use: boolean;
}

const DEFAULT_CONFIG: RainbowConfig = {
  arbitrum_mainnet_rpc: ARBITRUM_MAINNET_RPC,
  data_api_key: DATA_API_KEY,
  data_endpoint: DATA_ENDPOINT || 'wss://api-v4.zerion.io',
  data_origin: DATA_ORIGIN,
  default_slippage_bips: JSON.stringify({
    arbitrum: 200,
    mainnet: 100,
    optimism: 200,
    polygon: 200,
    bsc: 200,
    base: 200,
    zora: 200,
  }),
  ethereum_goerli_rpc: __DEV__ ? ETHEREUM_GOERLI_RPC_DEV : ETHEREUM_GOERLI_RPC,
  ethereum_mainnet_rpc: __DEV__
    ? ETHEREUM_MAINNET_RPC_DEV
    : ETHEREUM_MAINNET_RPC,
  f2c_enabled: true,
  flashbots_enabled: true,
  op_nft_network: 'op-mainnet',
  op_rewards_enabled: false,
  optimism_mainnet_rpc: OPTIMISM_MAINNET_RPC,
  polygon_mainnet_rpc: POLYGON_MAINNET_RPC,
  bsc_mainnet_rpc: BSC_MAINNET_RPC,
  zora_mainnet_rpc: ZORA_MAINNET_RPC,
  base_mainnet_rpc: __DEV__ ? BASE_MAINNET_RPC_DEV : BASE_MAINNET_RPC,
  swagg_enabled: true,
  trace_call_block_number_offset: 20,
  profiles_enabled: true,

  arbitrum_enabled: true,
  bsc_enabled: true,
  polygon_enabled: true,
  optimism_enabled: true,
  zora_enabled: true,
  base_enabled: true,
  op_chains_enabled: true,

  mainnet_enabled: true,

  goerli_enabled: true,

  arbitrum_tx_enabled: true,
  base_tx_enabled: true,
  bsc_tx_enabled: true,
  polygon_tx_enabled: true,
  optimism_tx_enabled: true,
  zora_tx_enabled: true,
  op_chains_tx_enabled: true,

  mainnet_tx_enabled: true,

  goerli_tx_enabled: true,

  base_swaps_enabled: false,
  mints_enabled: true,
  points_enabled: true,
  points_fully_enabled: true,
  rpc_proxy_enabled: true,
  remote_promo_enabled: false,
  test_do_not_use: true,
};

const remoteConfigQueryKey = createQueryKey(
  'remoteConfig',
  {},
  { persisterVersion: 1 }
);

export async function fetchRemoteConfig(): Promise<RainbowConfig> {
  const config: RainbowConfig = { ...DEFAULT_CONFIG };
  throw new RainbowError('Failed to fetch remote config');
  try {
    const fetchedRemotely = await remoteConfig().fetchAndActivate();
    if (!fetchedRemotely) {
      throw new RainbowError('Failed to fetch remote config');
    }
    logger.debug('Remote config fetched successfully');
    const parameters = remoteConfig().getAll();
    Object.entries(parameters).forEach($ => {
      const [key, entry] = $;
      if (key === 'default_slippage_bips') {
        config[key] = JSON.parse(entry.asString());
      } else if (
        key === 'flashbots_enabled' ||
        key === 'f2c_enabled' ||
        key === 'swagg_enabled' ||
        key === 'op_rewards_enabled' ||
        key === 'profiles_enabled' ||
        key === 'mainnet_tx_enabled' ||
        key === 'arbitrum_tx_enabled' ||
        key === 'bsc_tx_enabled' ||
        key === 'polygon_tx_enabled' ||
        key === 'optimism_tx_enabled' ||
        key === 'zora_tx_enabled' ||
        key === 'base_tx_enabled' ||
        key === 'op_chains_tx_enabled' ||
        key === 'goerli_tx_enabled' ||
        key === 'mainnet_enabled' ||
        key === 'arbitrum_enabled' ||
        key === 'bsc_enabled' ||
        key === 'polygon_enabled' ||
        key === 'optimism_enabled' ||
        key === 'zora_enabled' ||
        key === 'base_enabled' ||
        key === 'op_chains_enabled' ||
        key === 'goerli_enabled' ||
        key === 'base_swaps_enabled' ||
        key === 'mints_enabled' ||
        key === 'points_enabled' ||
        key === 'points_fully_enabled' ||
        key === 'rpc_proxy_enabled' ||
        key === 'remote_promo_enabled' ||
        key === 'test_do_not_use'
      ) {
        config[key] = entry.asBoolean();
      } else {
        config[key] = entry.asString();
      }
    });
    return config;
  } catch (e) {
    if (e instanceof RainbowError) {
      logger.error(e);
    } else {
      logger.error(new RainbowError('Failed to fetch remote config'), e);
    }
    throw e;
  }
}

const QUERY_PARAMS = {
  queryKey: remoteConfigQueryKey,
  queryFn: fetchRemoteConfig,
  staleTime: 600_000, // 10 minutes,
  cacheTime: Infinity,
  placeholderData: DEFAULT_CONFIG,
  retry: 3,
  retryDelay: (attempt: number) =>
    Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
  onError: () => queryClient.setQueryData(remoteConfigQueryKey, DEFAULT_CONFIG),
};

export async function prefetchRemoteConfig(): Promise<void> {
  await queryClient.prefetchQuery(QUERY_PARAMS);
}

export function useRemoteConfig(): RainbowConfig {
  const query = useQuery<RainbowConfig>(
    remoteConfigQueryKey,
    fetchRemoteConfig,
    QUERY_PARAMS
  );

  return query?.data ?? DEFAULT_CONFIG;
}
