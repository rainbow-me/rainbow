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
} from 'react-native-dotenv';
import {
  getNetwork,
  saveNetwork,
} from '@rainbow-me/handlers/localstorage/globalSettings';
import {
  setRpcEndpoints,
  web3SetHttpProvider,
} from '@rainbow-me/handlers/web3';

import Logger from 'logger';

export interface RainbowConfig extends Record<string, any> {
  arbitrum_mainnet_rpc?: string;
  data_api_key?: string;
  data_endpoint?: string;
  data_origin?: string;
  default_slippage_bips?: string;
  ethereum_goerli_rpc?: string;
  ethereum_mainnet_rpc?: string;
  op_nft_network?: string;
  optimism_mainnet_rpc?: string;
  polygon_mainnet_rpc?: string;
  trace_call_block_number_offset?: number;
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
  }),
  ethereum_goerli_rpc: __DEV__ ? ETHEREUM_GOERLI_RPC_DEV : ETHEREUM_GOERLI_RPC,
  ethereum_mainnet_rpc: __DEV__
    ? ETHEREUM_MAINNET_RPC_DEV
    : ETHEREUM_MAINNET_RPC,
  op_nft_network: 'op-mainnet',
  optimism_mainnet_rpc: OPTIMISM_MAINNET_RPC,
  polygon_mainnet_rpc: POLYGON_MAINNET_RPC,
  trace_call_block_number_offset: 20,
};

// Initialize with defaults in case firebase doesn't respond
let config: RainbowConfig = { ...DEFAULT_CONFIG };
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
