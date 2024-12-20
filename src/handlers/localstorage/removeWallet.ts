import AsyncStorage from '@react-native-async-storage/async-storage';
import { keys } from 'lodash';
import { accountLocalKeys } from './accountLocal';
import { getKey } from './common';
import { logger, RainbowError } from '@/logger';
import { removeNotificationSettingsForWallet } from '@/notifications/settings';
import { Network } from '@/state/backendNetworks/types';

export const removeWalletData = async (accountAddress: any) => {
  logger.debug('[localstorage/removeWallet]: removing wallet data', { accountAddress });
  const allPrefixes = accountLocalKeys;
  logger.debug('[localstorage/removeWallet]: all prefixes', { allPrefixes });
  const networks = keys(Network);
  const allKeysWithNetworks = allPrefixes.map(prefix => networks.map(network => getKey(prefix, accountAddress, network)));
  const allKeys = allKeysWithNetworks.flat();
  try {
    await AsyncStorage.multiRemove(allKeys);
  } catch (error) {
    logger.error(new RainbowError('[localstorage/removeWallet]: Error removing wallet data from storage'), {
      error,
    });
  }
  removeNotificationSettingsForWallet(accountAddress);
};
