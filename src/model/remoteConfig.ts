import remoteConfig from '@react-native-firebase/remote-config';
import { useQuery } from '@tanstack/react-query';
import { RainbowError, logger } from '@/logger';
import { createQueryKey, queryClient } from '@/react-query';
import { ChainId, Network } from '@/state/backendNetworks/types';
import { delay } from '@/utils/delay';

export interface RainbowConfig extends Record<string, string | boolean | number | Record<string, number>> {
  default_slippage_bips: Record<string, number>;
  default_slippage_bips_chainId: Record<string, number>;
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
  trending_tokens_enabled: boolean;
  new_discover_cards_enabled: boolean;
  rainbow_trending_tokens_list_enabled: boolean;
}

const Bips = {
  [100]: 100,
  [200]: 200,
  default: 500,
};

export const DEFAULT_SLIPPAGE_BIPS_CHAINID = {
  [ChainId.apechain]: Bips.default,
  [ChainId.arbitrum]: Bips.default,
  [ChainId.avalanche]: Bips.default,
  [ChainId.base]: Bips.default,
  [ChainId.blast]: Bips.default,
  [ChainId.bsc]: Bips['200'],
  [ChainId.degen]: Bips.default,
  [ChainId.gnosis]: Bips.default,
  [ChainId.gravity]: Bips.default,
  [ChainId.ink]: Bips.default,
  [ChainId.linea]: Bips.default,
  [ChainId.mainnet]: Bips['100'],
  [ChainId.optimism]: Bips.default,
  [ChainId.polygon]: Bips['200'],
  [ChainId.sanko]: Bips.default,
  [ChainId.scroll]: Bips.default,
  [ChainId.zksync]: Bips.default,
  [ChainId.zora]: Bips.default,
};

export const DEFAULT_SLIPPAGE_BIPS = {
  [Network.apechain]: Bips.default,
  [Network.arbitrum]: Bips.default,
  [Network.avalanche]: Bips.default,
  [Network.base]: Bips.default,
  [Network.blast]: Bips.default,
  [Network.bsc]: Bips['200'],
  [Network.degen]: Bips.default,
  [Network.gnosis]: Bips.default,
  [Network.gravity]: Bips.default,
  [Network.ink]: Bips.default,
  [Network.linea]: Bips.default,
  [Network.mainnet]: Bips['100'],
  [Network.optimism]: Bips.default,
  [Network.polygon]: Bips['200'],
  [Network.sanko]: Bips.default,
  [Network.scroll]: Bips.default,
  [Network.zksync]: Bips.default,
  [Network.zora]: Bips.default,
};

export const DEFAULT_CONFIG: RainbowConfig = {
  default_slippage_bips: DEFAULT_SLIPPAGE_BIPS,
  default_slippage_bips_chainId: DEFAULT_SLIPPAGE_BIPS_CHAINID,
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
  idfa_check_enabled: false,
  rewards_enabled: true,

  degen_mode: true,
  featured_results: true,
  claimables: true,
  nfts_enabled: true,

  trending_tokens_limit: 10,
  trending_tokens_enabled: false,
  new_discover_cards_enabled: false,
  rainbow_trending_tokens_list_enabled: false,
  king_of_the_hill_enabled: false,
};

export async function fetchRemoteConfig(): Promise<RainbowConfig> {
  const rc = remoteConfig();
  const config: RainbowConfig = { ...DEFAULT_CONFIG };

  try {
    await rc.fetchAndActivate();
    logger.debug(`[remoteConfig]: Remote config fetched successfully`);

    const parameters = rc.getAll();

    for (const [key, entry] of Object.entries(parameters)) {
      switch (key) {
        // JSON parsed keys
        case 'default_slippage_bips':
        case 'default_slippage_bips_chainId':
          config[key] = JSON.parse(entry.asString());
          break;

        // Number keys
        case 'trace_call_block_number_offset':
        case 'trending_tokens_limit':
          config[key] = entry.asNumber();
          break;

        // Boolean keys
        case 'f2c_enabled':
        case 'swagg_enabled':
        case 'op_rewards_enabled':
        case 'profiles_enabled':
        case 'mainnet_tx_enabled':
        case 'arbitrum_tx_enabled':
        case 'bsc_tx_enabled':
        case 'polygon_tx_enabled':
        case 'optimism_tx_enabled':
        case 'zora_tx_enabled':
        case 'base_tx_enabled':
        case 'degen_tx_enabled':
        case 'blast_tx_enabled':
        case 'avalanche_tx_enabled':
        case 'op_chains_tx_enabled':
        case 'goerli_tx_enabled':
        case 'mainnet_enabled':
        case 'arbitrum_enabled':
        case 'bsc_enabled':
        case 'polygon_enabled':
        case 'optimism_enabled':
        case 'zora_enabled':
        case 'base_enabled':
        case 'degen_enabled':
        case 'blast_enabled':
        case 'avalanche_enabled':
        case 'op_chains_enabled':
        case 'goerli_enabled':
        case 'base_swaps_enabled':
        case 'blast_swaps_enabled':
        case 'mints_enabled':
        case 'points_enabled':
        case 'points_fully_enabled':
        case 'rpc_proxy_enabled':
        case 'remote_promo_enabled':
        case 'remote_cards_enabled':
        case 'points_notifications_toggle':
        case 'dapp_browser':
        case 'idfa_check_enabled':
        case 'rewards_enabled':
        case 'degen_mode':
        case 'featured_results':
        case 'claimables':
        case 'nfts_enabled':
        case 'trending_tokens_enabled':
        case 'new_discover_cards_enabled':
        case 'rainbow_trending_tokens_list_enabled':
        case 'king_of_the_hill_enabled':
          config[key] = entry.asBoolean();
          break;

        // String keys (default)
        default:
          config[key] = entry.asString();
          break;
      }
    }
    return config;
  } catch (e) {
    logger.error(new RainbowError(`[remoteConfig]: Failed to fetch remote config`), {
      error: e,
    });
    return getRemoteConfig();
  } finally {
    logger.debug(`[remoteConfig]: Current remote config:\n${JSON.stringify(config, null, 2)}`);
  }
}

const remoteConfigQueryKey = createQueryKey('remoteConfig', {});

const QUERY_PARAMS = {
  queryKey: remoteConfigQueryKey,
  queryFn: fetchRemoteConfig,
  staleTime: 600_000, // 10 minutes
  placeholderData: DEFAULT_CONFIG,
  retry: 3,
  retryDelay: (attempt: number) => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30 * 1000),
};

export async function initializeRemoteConfig(): Promise<void> {
  const rc = remoteConfig();
  await rc.setConfigSettings({
    minimumFetchIntervalMillis: 120_000,
  });
  const defaults: Record<string, string | number | boolean> = {
    ...DEFAULT_CONFIG,
    default_slippage_bips: JSON.stringify(DEFAULT_CONFIG.default_slippage_bips),
    default_slippage_bips_chainId: JSON.stringify(DEFAULT_CONFIG.default_slippage_bips_chainId),
  };
  await rc.setDefaults(defaults);
  await Promise.race([queryClient.prefetchQuery(QUERY_PARAMS), delay(3000)]);
}

export function getRemoteConfig(): RainbowConfig {
  return queryClient.getQueryData(remoteConfigQueryKey) ?? DEFAULT_CONFIG;
}

export function useRemoteConfig(): RainbowConfig {
  const query = useQuery<RainbowConfig>(QUERY_PARAMS);
  return query?.data ?? DEFAULT_CONFIG;
}
