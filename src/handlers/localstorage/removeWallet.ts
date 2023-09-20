import AsyncStorage from '@react-native-async-storage/async-storage';
import { keys } from 'lodash';
import NetworkTypes from '../../helpers/networkTypes';
import { accountLocalKeys } from './accountLocal';
import { getKey } from './common';
import { walletConnectAccountLocalKeys } from './walletconnectRequests';
import { logger, RainbowError } from '@/logger';
import { removeNotificationSettingsForWallet } from '@/notifications/settings';

export const removeWalletData = async (accountAddress: any) => {
  logger.debug('[remove wallet]', { accountAddress });
  const allPrefixes = accountLocalKeys.concat(walletConnectAccountLocalKeys);
  logger.debug('[remove wallet] - all prefixes', { allPrefixes });
  const networks = keys(NetworkTypes);
  const allKeysWithNetworks = allPrefixes.map(prefix =>
    networks.map(network => getKey(prefix, accountAddress, network))
  );
  const allKeys = allKeysWithNetworks.flat();
  try {
    await AsyncStorage.multiRemove(allKeys);
  } catch (error) {
    logger.error(new RainbowError('Error removing wallet data from storage'));
  }
  removeNotificationSettingsForWallet(accountAddress);
};
