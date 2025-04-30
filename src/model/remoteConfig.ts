import remoteConfig, { FirebaseRemoteConfigTypes } from '@react-native-firebase/remote-config';
import { dequal } from 'dequal';
import { CURRENT_APP_VERSION } from '@/hooks/useAppVersion';
import { RainbowError, logger } from '@/logger';
import { ChainId, Network } from '@/state/backendNetworks/types';
import { createQueryStore } from '@/state/internal/createQueryStore';
import { delay } from '@/utils/delay';
import { time } from '@/utils/time';
import { shallowEqual } from '@/worklets/comparisons';

// ============ RainbowConfig ================================================== //

const REMOTE_CONFIG_VERSION = digitsOnly(CURRENT_APP_VERSION);

export interface RainbowConfig extends Record<string, string | boolean | number | Record<string, number>> {
  /* Objects */
  default_slippage_bips: Record<string, number>;
  default_slippage_bips_chainId: Record<string, number>;

  /* Strings */
  op_nft_network: string;

  /* Numbers */
  trace_call_block_number_offset: number;
  trending_tokens_limit: number;

  /* Booleans */
  f2c_enabled: boolean;
  op_rewards_enabled: boolean;
  swagg_enabled: boolean;
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

  trending_tokens_enabled: boolean;
  new_discover_cards_enabled: boolean;
  rainbow_trending_tokens_list_enabled: boolean;
  king_of_the_hill_enabled: boolean;
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

export const DEFAULT_CONFIG: Readonly<RainbowConfig> = {
  /* Objects */
  default_slippage_bips: DEFAULT_SLIPPAGE_BIPS,
  default_slippage_bips_chainId: DEFAULT_SLIPPAGE_BIPS_CHAINID,

  /* Strings */
  op_nft_network: 'op-mainnet',

  /* Numbers */
  trace_call_block_number_offset: 20,
  trending_tokens_limit: 10,

  /* Booleans */
  f2c_enabled: true,
  op_rewards_enabled: false,
  swagg_enabled: true,
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

  trending_tokens_enabled: false,
  new_discover_cards_enabled: false,
  rainbow_trending_tokens_list_enabled: false,
  king_of_the_hill_enabled: false,
};

// ============ Firebase Defaults ============================================== //

type StringifiedFirebaseDefaults = Readonly<{
  default_slippage_bips: string;
  default_slippage_bips_chainId: string;
}>;

const STRINGIFIED_FIREBASE_DEFAULTS: StringifiedFirebaseDefaults = {
  default_slippage_bips: JSON.stringify(DEFAULT_CONFIG.default_slippage_bips),
  default_slippage_bips_chainId: JSON.stringify(DEFAULT_CONFIG.default_slippage_bips_chainId),
};

type FirebaseConfigDefaults = Omit<RainbowConfig, keyof StringifiedFirebaseDefaults> &
  StringifiedFirebaseDefaults &
  FirebaseRemoteConfigTypes.ConfigDefaults;

/**
 * Builds the payload for `rc.setDefaults` with stringified objects.
 */
function getFirebaseDefaults(): FirebaseConfigDefaults {
  return { ...DEFAULT_CONFIG, ...STRINGIFIED_FIREBASE_DEFAULTS };
}

// ============ Remote Config Store ============================================ //

interface RemoteConfigState {
  config: RainbowConfig;
  lastFetchedVersion: number;
  getRemoteConfigKey: <K extends keyof RainbowConfig>(key: K) => RainbowConfig[K];
}

export const useRemoteConfigStore = createQueryStore<RainbowConfig, never, RemoteConfigState>(
  {
    fetcher: fetchRemoteConfig,
    retryDelay: (retryCount: number) => Math.min(retryCount > 1 ? 2 ** retryCount * 1_000 : 1_000, 30_000),
    setData: ({ data, set }) =>
      set(state => {
        const configChanged = !dequal(state.config, data);
        const versionChanged = state.lastFetchedVersion !== REMOTE_CONFIG_VERSION;

        return configChanged || versionChanged
          ? {
              config: configChanged ? data : state.config,
              lastFetchedVersion: REMOTE_CONFIG_VERSION,
            }
          : state;
      }),
    cacheTime: time.weeks(1),
    maxRetries: 3,
    staleTime: time.minutes(10),
  },

  (_, get) => ({
    config: DEFAULT_CONFIG,
    lastFetchedVersion: 0,
    getRemoteConfigKey: key => get().config[key],
  }),

  { storageKey: 'remoteConfig' }
);

// ============ Public Methods ================================================= //

export async function initializeRemoteConfig(): Promise<void> {
  const { fetch, lastFetchedVersion } = useRemoteConfigStore.getState();
  if (lastFetchedVersion !== REMOTE_CONFIG_VERSION) {
    await Promise.race([fetch(undefined, { force: true }), delay(time.seconds(3))]);
  } else {
    requestIdleCallback(() => fetch(undefined, { force: true }), { timeout: time.seconds(5) });
  }
}

export function getRemoteConfig(): RainbowConfig {
  return useRemoteConfigStore.getState().config;
}

export function useRemoteConfig(): RainbowConfig;
export function useRemoteConfig<K extends keyof RainbowConfig>(keys: K[]): Pick<RainbowConfig, K>;
export function useRemoteConfig<K extends keyof RainbowConfig>(keys?: K[]): RainbowConfig | Pick<RainbowConfig, K> {
  return useRemoteConfigStore(state => selectRemoteConfigKeys(state, keys), keys ? shallowEqual : undefined);
}

// ============ Fetcher ======================================================== //

const PARSERS = buildParsers(DEFAULT_CONFIG);
let hasInitializedRemoteConfig = false;

async function fetchRemoteConfig(): Promise<RainbowConfig> {
  const rc = remoteConfig();
  const newConfig: RainbowConfig = { ...DEFAULT_CONFIG };

  if (!hasInitializedRemoteConfig) {
    await Promise.all([rc.setConfigSettings({ minimumFetchIntervalMillis: time.minutes(2) }), rc.setDefaults(getFirebaseDefaults())]).then(
      () => {
        hasInitializedRemoteConfig = true;
      }
    );
  }

  await rc.fetchAndActivate();
  const params = rc.getAll();

  for (const key of Object.keys(PARSERS)) {
    const configValue = params[key];
    if (configValue !== undefined) newConfig[key] = PARSERS[key](configValue);
  }

  return newConfig;
}

// ============ Helper Functions =============================================== //

/**
 * Converts a string to a number by removing non-numeric characters.
 * @param string - The string to convert.
 * @returns The number that results from removing non-numeric characters, or 0 if the resulting string is empty.
 */
function digitsOnly(string: string): number {
  const numeric = string.replace(/\D+/g, '');
  return numeric.length ? Number(numeric) : 0;
}

type Parser<K extends keyof RainbowConfig> = (value: FirebaseRemoteConfigTypes.ConfigValue) => RainbowConfig[K];
type Parsers = { [K in keyof RainbowConfig]: Parser<K> };

function buildParsers(defaults: RainbowConfig): Parsers {
  const parseFunctions = {
    boolean: v => v.asBoolean(),
    number: v => v.asNumber(),
    string: v => v.asString(),
  } satisfies Record<string, Parser<keyof RainbowConfig>>;

  const parsers: Partial<Parsers> = {};

  for (const key in defaults) {
    const defaultValue = defaults[key];
    if (defaultValue === undefined) continue;
    let parser: Parser<typeof key>;

    switch (typeof defaultValue) {
      case 'boolean':
        parser = parseFunctions.boolean;
        break;
      case 'number':
        parser = parseFunctions.number;
        break;
      case 'string':
        parser = parseFunctions.string;
        break;
      default:
        parser = v => {
          try {
            return JSON.parse(v.asString());
          } catch (error) {
            logger.error(new RainbowError(`Error parsing remote config value for key: ${key}`, error));
            return defaultValue;
          }
        };
    }

    parsers[key] = parser;
  }

  return parsers as Parsers;
}

function selectRemoteConfigKeys<K extends keyof RainbowConfig>(
  state: RemoteConfigState,
  keys: K[] | undefined
): RainbowConfig | Pick<RainbowConfig, K> {
  if (!keys) return state.config;
  const result: Partial<RainbowConfig> = {};
  for (const key of keys) result[key] = state.config[key];
  return result as Pick<RainbowConfig, K>;
}
