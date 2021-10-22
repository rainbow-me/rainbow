import remoteConfig from '@react-native-firebase/remote-config';
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
  ETHEREUM_MAINNET_RPC,
  // @ts-ignore
  ETHEREUM_MAINNET_RPC_DEV,
  // @ts-ignore
  OPTIMISM_MAINNET_RPC,
  // @ts-ignore
  POLYGON_MAINNET_RPC,
} from 'react-native-dotenv';
import { web3SetHttpProvider } from '@rainbow-me/handlers/web3';
import networkTypes from '@rainbow-me/helpers/networkTypes';
import Logger from 'logger';

export interface RainbowConfig extends Record<string, any> {
  arbitrum_mainnet_rpc?: string;
  ethereum_mainnet_rpc?: string;
  optimism_mainnet_rpc?: string;
  polygon_mainnet_rpc?: string;
  data_api_key?: string;
  data_endpoint?: string;
  data_origin?: string;
}

const DEFAULT_CONFIG = {
  arbitrum_mainnet_rpc: ARBITRUM_MAINNET_RPC,
  data_api_key: DATA_API_KEY,
  data_endpoint: DATA_ENDPOINT || 'wss://api-v4.zerion.io',
  data_origin: DATA_ORIGIN,
  ethereum_mainnet_rpc: __DEV__
    ? ETHEREUM_MAINNET_RPC_DEV
    : ETHEREUM_MAINNET_RPC,
  optimism_mainnet_rpc: OPTIMISM_MAINNET_RPC,
  polygon_mainnet_rpc: POLYGON_MAINNET_RPC,
};

// Initialize with defaults in case firebase doesn't respond
const config: RainbowConfig = DEFAULT_CONFIG;

const init = async () => {
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
    config[key] = entry.asString();
  });

  Logger.debug('CURRENT CONFIG', JSON.stringify(config, null, 2));
  // SET THE DEFAULT PROVIDER AFTER LOADING THE CONFIG
  web3SetHttpProvider(networkTypes.mainnet);
};

init();

export default config;
