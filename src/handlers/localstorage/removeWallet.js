import AsyncStorage from '@react-native-community/async-storage';
import { concat, map } from 'lodash';
import { logger } from '../../utils';
import { accountLocalKeys } from './accountLocal';
import { getKey } from './common';
import { uniswapAccountLocalKeys } from './uniswap';
import { walletConnectAccountLocalKeys } from './walletconnect';

export const removeWalletData = async (accountAddress, network) => {
  logger.log('[remove wallet]', accountAddress, network);
  const allPrefixes = concat(
    accountLocalKeys,
    uniswapAccountLocalKeys,
    walletConnectAccountLocalKeys
  );
  logger.log('[remove wallet] - all prefixes', allPrefixes);
  const allKeys = map(allPrefixes, prefix =>
    getKey(prefix, accountAddress, network)
  );
  try {
    await AsyncStorage.multiRemove(allKeys);
  } catch (error) {
    logger.log('Error removing wallet data from storage', error);
  }
};
