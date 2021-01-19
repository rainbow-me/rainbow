import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { addCashClearState } from '../redux/addCash';
import { dataResetState } from '../redux/data';
import { explorerClearState } from '../redux/explorer';
import { resetOpenStateSettings } from '../redux/openStateSettings';
import { requestsResetState } from '../redux/requests';
import { uniqueTokensResetState } from '../redux/uniqueTokens';
import { uniswapResetState } from '../redux/uniswap';
import { uniswapLiquidityResetState } from '../redux/uniswapLiquidity';
import { promiseUtils } from '../utils';

export default function useResetAccountState() {
  const dispatch = useDispatch();

  const resetAccountState = useCallback(async () => {
    const p0 = dispatch(explorerClearState());
    const p1 = dispatch(dataResetState());
    const p2 = dispatch(uniqueTokensResetState());
    const p3 = dispatch(resetOpenStateSettings());
    const p4 = dispatch(requestsResetState());
    const p5 = dispatch(uniswapResetState());
    const p6 = dispatch(uniswapLiquidityResetState());
    const p7 = dispatch(addCashClearState());
    await promiseUtils.PromiseAllWithFails([p0, p1, p2, p3, p4, p5, p6, p7]);
  }, [dispatch]);

  return resetAccountState;
}
