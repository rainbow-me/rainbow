import AsyncStorage from '@react-native-async-storage/async-storage';
import { keys } from 'lodash';
import NetworkTypes from '../../helpers/networkTypes';
import { accountLocalKeys } from './accountLocal';
import { getKey } from './common';
import { uniswapAccountLocalKeys } from './uniswap';
import { walletConnectAccountLocalKeys } from './walletconnectRequests';
import logger from '@/utils/logger';
import { removeNotificationSettingsForWallet } from '@/notifications/settings';

export const removeWalletData = async (accountAddress: any) => {
  logger.log('[remove wallet]', accountAddress);
  const allPrefixes = accountLocalKeys.concat(
    uniswapAccountLocalKeys,
    walletConnectAccountLocalKeys
  );
  logger.log('[remove wallet] - all prefixes', allPrefixes);
  const networks = keys(NetworkTypes);
  const allKeysWithNetworks = allPrefixes.map(prefix =>
    networks.map(network => getKey(prefix, accountAddress, network))
  );
  const allKeys = allKeysWithNetworks.flat();
  try {
    await AsyncStorage.multiRemove(allKeys);
  } catch (error) {
    logger.log('Error removing wallet data from storage', error);
  }
  removeNotificationSettingsForWallet(accountAddress);
};
