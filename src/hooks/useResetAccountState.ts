import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { explorerClearState } from '../redux/explorer';
import { requestsResetState } from '../redux/requests';
import { promiseUtils } from '../utils';

export default function useResetAccountState() {
  const dispatch = useDispatch();

  const resetAccountState = useCallback(async () => {
    const p0 = dispatch(explorerClearState());
    const p1 = dispatch(requestsResetState());

    // @ts-expect-error ts-migrate(2739) FIXME: Type '(dispatch: any) => void' is missing the foll... Remove this comment to see the full error message
    await promiseUtils.PromiseAllWithFails([p0, p1]);
  }, [dispatch]);

  return resetAccountState;
}
