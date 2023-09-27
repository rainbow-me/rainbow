import remoteConfig from '@react-native-firebase/remote-config';
import { captureException } from '@sentry/react-native';
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
import {
  getNetwork,
  saveNetwork,
} from '@/handlers/localstorage/globalSettings';
import { setRpcEndpoints, web3SetHttpProvider } from '@/handlers/web3';

import Logger from '@/utils/logger';

export interface RainbowConfig
  extends Record<string, string | boolean | number> {
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
};

// Initialize with defaults in case firebase doesn't respond
const config: RainbowConfig = { ...DEFAULT_CONFIG };
setRpcEndpoints(config);

const init = async () => {
  try {
    await remoteConfig().setConfigSettings({
      minimumFetchIntervalMillis: 120000,
    });

    await remoteConfig().setDefaults(DEFAULT_CONFIG);

    const fetchedRemotely = await remoteConfig().fetchAndActivate();

    if (fetchedRemotely) {
      Logger.debug('Configs were retrieved from the backend and activated.');
    } else {
      Logger.debug(
        'No configs were fetched from the backend, and the local configs were already activated'
      );
    }
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
        key === 'mints_enabled'
      ) {
        config[key] = entry.asBoolean();
      } else {
        config[key] = entry.asString();
      }
    });
  } catch (e) {
    Logger.sentry('error getting remote config', e);
    captureException(e);
    Logger.sentry('using default config instead...');
  } finally {
    Logger.debug('CURRENT CONFIG', JSON.stringify(config, null, 2));
    // UPDATE THE PROVIDER AFTER LOADING THE NEW CONFIG
    const currentNetwork = await getNetwork();
    setRpcEndpoints(config);
    web3SetHttpProvider(currentNetwork);
    saveNetwork(currentNetwork);
  }
};

init();

export default config;
