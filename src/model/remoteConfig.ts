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
  AVALANCHE_MAINNET_RPC,
  AVALANCHE_MAINNET_RPC_DEV,
  BLAST_MAINNET_RPC,
  DEGEN_MAINNET_RPC,
} from 'react-native-dotenv';
import { RainbowError, logger } from '@/logger';
import { getNetwork, saveNetwork } from '@/handlers/localstorage/globalSettings';
import { web3SetHttpProvider } from '@/handlers/web3';
import { delay } from '@/utils/delay';

export interface RainbowConfig extends Record<string, string | boolean | number> {
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
  avalanche_mainnet_rpc: string;
  degen_mainnet_rpc: string;
  blast_mainnet_rpc: string;
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
  avalanche_enabled: boolean;
  degen_enabled: boolean;
  blast_enabled: boolean;

  arbitrum_tx_enabled: boolean;
  base_tx_enabled: boolean;
  bsc_tx_enabled: boolean;
  polygon_tx_enabled: boolean;
  optimism_tx_enabled: boolean;
  zora_tx_enabled: boolean;
  op_chains_tx_enabled: boolean;
  mainnet_tx_enabled: boolean;
  goerli_tx_enabled: boolean;
  avalanche_tx_enabled: boolean;
  degen_tx_enabled: boolean;
  blast_tx_enabled: boolean;

  base_swaps_enabled: boolean;
  blast_swaps_enabled: boolean;
  mints_enabled: boolean;
  points_enabled: boolean;
  points_fully_enabled: boolean;
  rpc_proxy_enabled: boolean;
  remote_cards_enabled: boolean;
  remote_promo_enabled: boolean;
  points_notifications_toggle: boolean;
  dapp_browser: boolean;
  swaps_v2: boolean;
  idfa_check_enabled: boolean;
  rewards_enabled: boolean;
}

export const DEFAULT_CONFIG: RainbowConfig = {
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
    avalanche: 200,
    blast: 200,
    degen: 200,
  }),
  ethereum_goerli_rpc: __DEV__ ? ETHEREUM_GOERLI_RPC_DEV : ETHEREUM_GOERLI_RPC,
  ethereum_mainnet_rpc: __DEV__ ? ETHEREUM_MAINNET_RPC_DEV : ETHEREUM_MAINNET_RPC,
  f2c_enabled: true,
  flashbots_enabled: true,
  op_nft_network: 'op-mainnet',
  op_rewards_enabled: false,
  optimism_mainnet_rpc: OPTIMISM_MAINNET_RPC,
  polygon_mainnet_rpc: POLYGON_MAINNET_RPC,
  bsc_mainnet_rpc: BSC_MAINNET_RPC,
  zora_mainnet_rpc: ZORA_MAINNET_RPC,
  base_mainnet_rpc: __DEV__ ? BASE_MAINNET_RPC_DEV : BASE_MAINNET_RPC,
  avalanche_mainnet_rpc: __DEV__ ? AVALANCHE_MAINNET_RPC_DEV : AVALANCHE_MAINNET_RPC,
  degen_mainnet_rpc: DEGEN_MAINNET_RPC,
  blast_mainnet_rpc: BLAST_MAINNET_RPC,
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
  avalanche_enabled: true,
  blast_enabled: true,
  degen_enabled: true,

  mainnet_enabled: true,

  goerli_enabled: true,

  arbitrum_tx_enabled: true,
  base_tx_enabled: true,
  bsc_tx_enabled: true,
  polygon_tx_enabled: true,
  optimism_tx_enabled: true,
  zora_tx_enabled: true,
  op_chains_tx_enabled: true,
  avalanche_tx_enabled: true,
  degen_tx_enabled: true,
  blast_tx_enabled: true,

  mainnet_tx_enabled: true,

  goerli_tx_enabled: true,

  base_swaps_enabled: true,
  blast_swaps_enabled: true,
  mints_enabled: true,
  points_enabled: true,
  points_fully_enabled: true,
  rpc_proxy_enabled: true,
  remote_cards_enabled: false,
  remote_promo_enabled: false,
  points_notifications_toggle: true,
  dapp_browser: true,
  swaps_v2: false,
  idfa_check_enabled: true,
  rewards_enabled: false,
};

export async function fetchRemoteConfig(): Promise<RainbowConfig> {
  const config: RainbowConfig = { ...DEFAULT_CONFIG };
  try {
    await remoteConfig().fetchAndActivate();
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
        key === 'degen_tx_enabled' ||
        key === 'blast_tx_enabled' ||
        key === 'avalanche_tx_enabled' ||
        key === 'op_chains_tx_enabled' ||
        key === 'goerli_tx_enabled' ||
        key === 'mainnet_enabled' ||
        key === 'arbitrum_enabled' ||
        key === 'bsc_enabled' ||
        key === 'polygon_enabled' ||
        key === 'optimism_enabled' ||
        key === 'zora_enabled' ||
        key === 'base_enabled' ||
        key === 'degen_enabled' ||
        key === 'blast_enabled' ||
        key === 'avalanche_enabled' ||
        key === 'op_chains_enabled' ||
        key === 'goerli_enabled' ||
        key === 'base_swaps_enabled' ||
        key === 'mints_enabled' ||
        key === 'points_enabled' ||
        key === 'points_fully_enabled' ||
        key === 'rpc_proxy_enabled' ||
        key === 'remote_promo_enabled' ||
        key === 'remote_cards_enabled' ||
        key === 'points_notifications_toggle' ||
        key === 'dapp_browser' ||
        key === 'swaps_v2' ||
        key === 'idfa_check_enabled' ||
        key === 'rewards_enabled'
      ) {
        config[key] = entry.asBoolean();
      } else {
        config[key] = entry.asString();
      }
    });
    return config;
  } catch (e) {
    logger.error(new RainbowError('Failed to fetch remote config'), {
      error: e,
    });
    throw e;
  } finally {
    logger.debug(`Current remote config:\n${JSON.stringify(config, null, 2)}`);
    const currentNetwork = await getNetwork();
    web3SetHttpProvider(currentNetwork);
    saveNetwork(currentNetwork);
  }
}

const remoteConfigQueryKey = createQueryKey('remoteConfig', {});

const QUERY_PARAMS = {
  queryKey: remoteConfigQueryKey,
  queryFn: fetchRemoteConfig,
  staleTime: 600_000, // 10 minutes,
  placeholderData: DEFAULT_CONFIG,
  retry: 3,
  retryDelay: (attempt: number) => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
};

export async function initializeRemoteConfig(): Promise<void> {
  await remoteConfig().setConfigSettings({
    minimumFetchIntervalMillis: 120_000,
  });
  await remoteConfig().setDefaults(DEFAULT_CONFIG);
  await Promise.race([queryClient.prefetchQuery(QUERY_PARAMS), delay(3000)]);
}

export function getRemoteConfig(): RainbowConfig {
  return queryClient.getQueryData(remoteConfigQueryKey) ?? DEFAULT_CONFIG;
}

export function useRemoteConfig(): RainbowConfig {
  const query = useQuery<RainbowConfig>(QUERY_PARAMS);
  return query?.data ?? DEFAULT_CONFIG;
}
