import { RainbowError, logger } from '@/logger';
import { createQueryKey, queryClient } from '@/react-query';
import { delay } from '@/utils/delay';
import remoteConfig from '@react-native-firebase/remote-config';
import { useQuery } from '@tanstack/react-query';

export interface RainbowConfig extends Record<string, string | boolean | number> {
  default_slippage_bips: string;
  default_slippage_bips_chainId: string;
  f2c_enabled: boolean;
  op_nft_network: string;
  op_rewards_enabled: boolean;
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
  idfa_check_enabled: boolean;
  rewards_enabled: boolean;

  degen_mode: boolean;
  featured_results: boolean;
  claimables: boolean;
  nfts_enabled: boolean;

  trending_tokens_limit: number;
}

export const DEFAULT_CONFIG: RainbowConfig = {
  default_slippage_bips: JSON.stringify({
    apechain: 200,
    arbitrum: 200,
    avalanche: 200,
    base: 200,
    bsc: 200,
    blast: 200,
    degen: 200,
    gnosis: 200,
    gravity: 200,
    ink: 200,
    linea: 200,
    mainnet: 100,
    optimism: 200,
    polygon: 200,
    sanko: 200,
    scroll: 200,
    zksync: 200,
    zora: 200,
  }),
  default_slippage_bips_chainId: JSON.stringify({
    '33139': 200,
    '42161': 200,
    '43114': 200,
    '8453': 200,
    '81457': 200,
    '56': 200,
    '666666666': 200,
    '1': 100,
    '10': 200,
    '137': 200,
    '7777777': 200,
  }),
  f2c_enabled: true,
  op_nft_network: 'op-mainnet',
  op_rewards_enabled: false,
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
  remote_cards_enabled: true,
  remote_promo_enabled: false,
  points_notifications_toggle: true,
  dapp_browser: true,
  idfa_check_enabled: true,
  rewards_enabled: true,

  degen_mode: true,
  featured_results: true,
  claimables: true,
  nfts_enabled: true,

  trending_tokens_limit: 10,
  trending_tokens_enabled: false,
};

export async function fetchRemoteConfig(): Promise<RainbowConfig> {
  const config: RainbowConfig = { ...DEFAULT_CONFIG };
  try {
    await remoteConfig().fetchAndActivate();
    logger.debug(`[remoteConfig]: Remote config fetched successfully`);
    const parameters = remoteConfig().getAll();
    Object.entries(parameters).forEach($ => {
      const [key, entry] = $;
      if (key === 'default_slippage_bips' || key === 'default_slippage_bips_chainId') {
        config[key] = JSON.parse(entry.asString());
      } else if (
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
        key === 'idfa_check_enabled' ||
        key === 'rewards_enabled' ||
        key === 'degen_mode' ||
        key === 'featured_results' ||
        key === 'claimables' ||
        key === 'nfts_enabled' ||
        key === 'trending_tokens_enabled'
      ) {
        config[key] = entry.asBoolean();
      } else if (key === 'trending_tokens_limit') {
        config[key] = entry.asNumber();
      } else {
        config[key] = entry.asString();
      }
    });
    return config;
  } catch (e) {
    logger.error(new RainbowError(`[remoteConfig]: Failed to fetch remote config`), {
      error: e,
    });
    throw e;
  } finally {
    logger.debug(`[remoteConfig]: Current remote config:\n${JSON.stringify(config, null, 2)}`);
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
