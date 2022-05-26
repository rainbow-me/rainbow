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
  ETHEREUM_KOVAN_RPC,
  // @ts-ignore
  ETHEREUM_KOVAN_RPC_DEV,
  // @ts-ignore
  ETHEREUM_MAINNET_RPC,
  // @ts-ignore
  ETHEREUM_MAINNET_RPC_DEV,
  // @ts-ignore
  ETHEREUM_RINKEBY_RPC,
  // @ts-ignore
  ETHEREUM_RINKEBY_RPC_DEV,
  // @ts-ignore
  ETHEREUM_ROPSTEN_RPC,
  // @ts-ignore
  ETHEREUM_ROPSTEN_RPC_DEV,
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
  ethereum_goerli_rpc?: string;
  ethereum_kovan_rpc?: string;
  ethereum_mainnet_rpc?: string;
  ethereum_rinkeby_rpc?: string;
  ethereum_ropsten_rpc?: string;
  optimism_mainnet_rpc?: string;
  polygon_mainnet_rpc?: string;
}

const DEFAULT_CONFIG = {
  arbitrum_mainnet_rpc: ARBITRUM_MAINNET_RPC,
  data_api_key: DATA_API_KEY,
  data_endpoint: DATA_ENDPOINT || 'wss://api-v4.zerion.io',
  data_origin: DATA_ORIGIN,
  ethereum_goerli_rpc: __DEV__ ? ETHEREUM_GOERLI_RPC_DEV : ETHEREUM_GOERLI_RPC,
  ethereum_kovan_rpc: __DEV__ ? ETHEREUM_KOVAN_RPC_DEV : ETHEREUM_KOVAN_RPC,
  ethereum_mainnet_rpc: __DEV__
    ? ETHEREUM_MAINNET_RPC_DEV
    : ETHEREUM_MAINNET_RPC,
  ethereum_rinkeby_rpc: __DEV__
    ? ETHEREUM_RINKEBY_RPC_DEV
    : ETHEREUM_RINKEBY_RPC,
  ethereum_ropsten_rpc: __DEV__
    ? ETHEREUM_ROPSTEN_RPC_DEV
    : ETHEREUM_ROPSTEN_RPC,
  optimism_mainnet_rpc: OPTIMISM_MAINNET_RPC,
  polygon_mainnet_rpc: POLYGON_MAINNET_RPC,
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
      config[key] = entry.asString();
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
