import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { addCashClearState } from '../redux/addCash';
import { dataResetState } from '../redux/data';
import { explorerClearState } from '../redux/explorer';
import { nonceClearState } from '../redux/nonce';
import { resetOpenStateSettings } from '../redux/openStateSettings';
import { requestsResetState } from '../redux/requests';
import { savingsClearState } from '../redux/savings';
import { uniqueTokensResetState } from '../redux/uniqueTokens';
import { uniswapResetState } from '../redux/uniswap';
import { walletConnectResetState } from '../redux/walletconnect';
import { promiseUtils } from '../utils';

export default function useResetAccountState() {
  const dispatch = useDispatch();

  const resetAccountState = useCallback(async () => {
    const p0 = dispatch(explorerClearState());
    const p1 = dispatch(dataResetState());
    const p2 = dispatch(uniqueTokensResetState());
    const p3 = dispatch(resetOpenStateSettings());
    const p4 = dispatch(walletConnectResetState());
    const p5 = dispatch(nonceClearState());
    const p6 = dispatch(requestsResetState());
    const p7 = dispatch(uniswapResetState());
    const p8 = dispatch(savingsClearState());
    const p9 = dispatch(addCashClearState());
    await promiseUtils.PromiseAllWithFails([
      p0,
      p1,
      p2,
      p3,
      p4,
      p5,
      p6,
      p7,
      p8,
      p9,
    ]);
  }, [dispatch]);

  return resetAccountState;
}
