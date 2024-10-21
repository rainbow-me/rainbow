import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { hiddenTokensLoadState } from '../redux/hiddenTokens';
import { showcaseTokensLoadState } from '../redux/showcaseTokens';
import { logger } from '@/logger';

export default function useLoadAccountData() {
  const dispatch = useDispatch();
  const loadAccountData = useCallback(async () => {
    logger.debug('[useLoadAccountData]: Load wallet account data');
    dispatch(showcaseTokensLoadState());
    dispatch(hiddenTokensLoadState());
  }, [dispatch]);

  return loadAccountData;
}
