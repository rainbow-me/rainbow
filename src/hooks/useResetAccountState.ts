import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { dataResetState } from '../redux/data';
import { explorerClearState } from '../redux/explorer';
import { requestsResetState } from '../redux/requests';
import { uniswapResetState } from '../redux/uniswap';
import { promiseUtils } from '../utils';

export default function useResetAccountState() {
  const dispatch = useDispatch();

  const resetAccountState = useCallback(async () => {
    const p0 = dispatch(explorerClearState());
    const p1 = dispatch(dataResetState());
    const p2 = dispatch(requestsResetState());
    const p3 = dispatch(uniswapResetState());
    // @ts-expect-error ts-migrate(2739) FIXME: Type '(dispatch: any) => void' is missing the foll... Remove this comment to see the full error message
    await promiseUtils.PromiseAllWithFails([p0, p1, p2, p3]);
  }, [dispatch]);

  return resetAccountState;
}
