import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import networkTypes from '../helpers/networkTypes';
import { useAccountSettings } from '../hooks';
import { addCashLoadState } from '../redux/addCash';
import { dataLoadState } from '../redux/data';
import { contactsLoadState } from '../redux/contacts';
import { openStateSettingsLoadState } from '../redux/openStateSettings';
import { requestsLoadState } from '../redux/requests';
import { savingsLoadState } from '../redux/savings';
import { settingsLoadState } from '../redux/settings';
import { uniswapLoadState } from '../redux/uniswap';
import { uniqueTokensLoadState } from '../redux/uniqueTokens';
import { walletConnectLoadState } from '../redux/walletconnect';
import { logger, promiseUtils } from '../utils';
import useCheckEthBalance from './useCheckEthBalance';

export default function useLoadAccountData() {
  const dispatch = useDispatch();
  const { network } = useAccountSettings();
  const checkEthBalance = useCheckEthBalance();

  const loadAccountData = useCallback(async () => {
    logger.sentry('Load wallet data');
    await dispatch(openStateSettingsLoadState());
    const promises = [];
    const p1 = dispatch(settingsLoadState());
    promises.push(p1);
    if (network === networkTypes.mainnet) {
      const p2 = dispatch(savingsLoadState());
      const p3 = dispatch(dataLoadState());
      const p4 = dispatch(uniqueTokensLoadState());
      const p5 = dispatch(walletConnectLoadState());
      const p6 = dispatch(requestsLoadState());
      promises.push(p2, p3, p4, p5, p6);
    }

    const p6 = dispatch(uniswapLoadState());
    const p7 = dispatch(contactsLoadState());
    const p8 = dispatch(addCashLoadState());
    const p9 = checkEthBalance();
    promises.push(p6, p7, p8, p9);

    return promiseUtils.PromiseAllWithFails(promises);
  }, [checkEthBalance, dispatch, network]);

  return loadAccountData;
}
