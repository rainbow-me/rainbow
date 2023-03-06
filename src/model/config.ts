import remoteConfig from '@react-native-firebase/remote-config';
import { captureException } from '@sentry/react-native';
import {
  // @ts-ignore
  ARBITRUM_MAINNET_RPC,
  // @ts-ignore
  DATA_API_KEY,
  // @ts-ignore
  DATA_ENDPOINT,
  // @ts-ignore
  DATA_ORIGIN,
  // @ts-ignore
  ETHEREUM_GOERLI_RPC,
  // @ts-ignore
  ETHEREUM_GOERLI_RPC_DEV,
  // @ts-ignore
  ETHEREUM_MAINNET_RPC,
  // @ts-ignore
  ETHEREUM_MAINNET_RPC_DEV,
  // @ts-ignore
  OPTIMISM_MAINNET_RPC,
  // @ts-ignore
  POLYGON_MAINNET_RPC,
  // @ts-ignore
  BSC_MAINNET_RPC,
} from 'react-native-dotenv';
import {
  getNetwork,
  saveNetwork,
} from '@/handlers/localstorage/globalSettings';
import { setRpcEndpoints, web3SetHttpProvider } from '@/handlers/web3';

import Logger from '@/utils/logger';

export interface RainbowConfig extends Record<string, any> {
  arbitrum_mainnet_rpc?: string;
  bsc_mainnet_rpc?: string;
  data_api_key?: string;
  data_endpoint?: string;
  data_origin?: string;
  default_slippage_bips?: string;
  ethereum_goerli_rpc?: string;
  ethereum_mainnet_rpc?: string;
  f2c_enabled?: boolean;
  flashbots_enabled?: boolean;
  op_nft_network?: string;
  op_rewards_enabled?: boolean;
  optimism_mainnet_rpc?: string;
  polygon_mainnet_rpc?: string;
  swagg_enabled?: boolean;
  trace_call_block_number_offset?: number;
  wyre_enabled?: boolean;
  profiles_enabled?: boolean;
}

const DEFAULT_CONFIG = {
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
  swagg_enabled: true,
  trace_call_block_number_offset: 20,
  wyre_enabled: true,
  profiles_enabled: true,
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
        key === 'wyre_enabled' ||
        key === 'f2c_enabled' ||
        key === 'swagg_enabled' ||
        key === 'op_rewards_enabled' ||
        key === 'profiles_enabled'
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
