import remoteConfig from '@react-native-firebase/remote-config';
// @ts-ignore next-line
import { DATA_API_KEY, DATA_ENDPOINT, DATA_ORIGIN } from 'react-native-dotenv';
import Logger from 'logger';

export declare type RainbowConfig = {
  [key: string]: string;
};

const config: RainbowConfig = {};

const init = async () => {
  await remoteConfig().setConfigSettings({
    minimumFetchIntervalMillis: 120000,
  });

  await remoteConfig().setDefaults({
    data_api_key: DATA_API_KEY,
    data_endpoint: DATA_ENDPOINT || 'wss://api-v4.zerion.io',
    data_origin: DATA_ORIGIN,
  });

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
};

init();

export default config;
