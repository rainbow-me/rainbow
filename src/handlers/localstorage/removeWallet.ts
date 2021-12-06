import AsyncStorage from '@react-native-community/async-storage';
import { concat, flatten, keys, map } from 'lodash';
import NetworkTypes from '../../helpers/networkTypes';
import { accountLocalKeys } from './accountLocal';
import { getKey } from './common';
import { uniswapAccountLocalKeys } from './uniswap';
import { walletConnectAccountLocalKeys } from './walletconnectRequests';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

export const removeWalletData = async (accountAddress: any) => {
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
