import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import networkTypes from '../helpers/networkTypes';
import { useAccountSettings } from '../hooks';
import { dataLoadState } from '../redux/data';
import { contactsLoadState } from '../redux/contacts';
import { openStateSettingsLoadState } from '../redux/openStateSettings';
import { requestsLoadState } from '../redux/requests';
import { settingsLoadState } from '../redux/settings';
import { uniswapLoadState } from '../redux/uniswap';
import { uniqueTokensLoadState } from '../redux/uniqueTokens';
import { walletConnectLoadState } from '../redux/walletconnect';
import { promiseUtils, sentryUtils } from '../utils';

export default function useLoadAccountData() {
  const dispatch = useDispatch();
  const { network } = useAccountSettings();

  const loadAccountData = useCallback(async () => {
    sentryUtils.addInfoBreadcrumb('Load wallet data');
    await dispatch(openStateSettingsLoadState());
    const promises = [];
    const p1 = dispatch(settingsLoadState());
    promises.push(p1);
    if (network === networkTypes.mainnet) {
      const p2 = dispatch(dataLoadState());
      const p3 = dispatch(uniqueTokensLoadState());
      const p4 = dispatch(walletConnectLoadState());
      const p5 = dispatch(requestsLoadState());
      promises.push(p2, p3, p4, p5);
    }

    const p6 = dispatch(uniswapLoadState());
    const p7 = dispatch(contactsLoadState());
    promises.push(p6, p7);

    return promiseUtils.PromiseAllWithFails(promises);
  }, [dispatch, network]);

  return loadAccountData;
}
