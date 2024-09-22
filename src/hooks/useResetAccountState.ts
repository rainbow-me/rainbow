import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { requestsResetState } from '../redux/requests';

export default function useResetAccountState() {
  const dispatch = useDispatch();

  const resetAccountState = useCallback(() => {
    dispatch(requestsResetState());
  }, [dispatch]);

  return resetAccountState;
}
