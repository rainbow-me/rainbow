import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { addCashClearState } from '../redux/addCash';
import { dataClearState } from '../redux/data';
import { explorerClearState } from '../redux/explorer';
import { clearIsWalletEmpty } from '../redux/isWalletEmpty';
import { nonceClearState } from '../redux/nonce';
import { clearOpenStateSettings } from '../redux/openStateSettings';
import { requestsClearState } from '../redux/requests';
import { savingsClearState } from '../redux/savings';
import { uniswapClearState } from '../redux/uniswap';
import { uniqueTokensClearState } from '../redux/uniqueTokens';
import { walletConnectClearState } from '../redux/walletconnect';
import { promiseUtils } from '../utils';

export default function useClearAccountData() {
  const dispatch = useDispatch();

  const clearAccountData = useCallback(async () => {
    const p0 = dispatch(explorerClearState());
    const p1 = dispatch(dataClearState());
    const p2 = dispatch(clearIsWalletEmpty());
    const p3 = dispatch(uniqueTokensClearState());
    const p4 = dispatch(clearOpenStateSettings());
    const p5 = dispatch(walletConnectClearState());
    const p6 = dispatch(nonceClearState());
    const p7 = dispatch(requestsClearState());
    const p8 = dispatch(uniswapClearState());
    const p9 = dispatch(savingsClearState());
    const p10 = dispatch(addCashClearState());
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
      p10,
    ]);
  }, [dispatch]);

  return clearAccountData;
}
