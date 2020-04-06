import { concat, find, isEmpty } from 'lodash';
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import useAppState from './useAppState';
import { savingsLoadState } from '../redux/savings';
import { DAI_ADDRESS } from '../references';

export default function useSavingsAccount(includeDefaultDai) {
  const { justBecameActive } = useAppState();
  const dispatch = useDispatch();
  const { accountTokens, daiMarketData } = useSelector(({ savings }) => ({
    accountTokens: savings.accountTokens,
    daiMarketData: savings.daiMarketData,
  }));

  const accountHasCDAI = find(
    accountTokens,
    token => token.underlying.address === DAI_ADDRESS
  );

  let tokens = accountTokens;

  const shouldAddDai =
    includeDefaultDai && !accountHasCDAI && !isEmpty(daiMarketData);
  if (shouldAddDai) {
    tokens = concat(accountTokens, {
      ...daiMarketData,
    });
  }

  useEffect(() => {
    if (justBecameActive) {
      dispatch(savingsLoadState());
    }
  }, [dispatch, justBecameActive]);

  return tokens;
}
