import AsyncStorage from '@react-native-community/async-storage';
import { concat, flatten, keys, map } from 'lodash';
import NetworkTypes from '../../helpers/networkTypes';
import { accountLocalKeys } from './accountLocal';
import { getKey } from './common';
import { uniswapAccountLocalKeys } from './uniswap';
import { walletConnectAccountLocalKeys } from './walletconnectRequests';
import logger from 'logger';

export const removeWalletData = async accountAddress => {
  logger.log('[remove wallet]', accountAddress);
  const allPrefixes = concat(
    accountLocalKeys,
    uniswapAccountLocalKeys,
    walletConnectAccountLocalKeys
  );
  logger.log('[remove wallet] - all prefixes', allPrefixes);
  const networks = keys(NetworkTypes);
  const allKeysWithNetworks = map(allPrefixes, prefix =>
    map(networks, network => getKey(prefix, accountAddress, network))
  );
  const allKeys = flatten(allKeysWithNetworks);
  try {
    await AsyncStorage.multiRemove(allKeys);
  } catch (error) {
    logger.log('Error removing wallet data from storage', error);
  }
};
