import { getUniqueTokens } from '@/handlers/localstorage/accountLocal';
import { AppState } from '@/redux/store';
import {
  UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_FAILURE,
  UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_REQUEST,
  UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_SUCCESS,
} from '@/redux/uniqueTokens';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useAccountSettings from './useAccountSettings';

export const useLoadUniqueTokens = () => {
  const { network } = useAccountSettings();
  const accountAddress = useSelector(
    (state: AppState) => state.settings.accountAddress
  );
  const dispatch = useDispatch();

  const loadUniqueTokens = useCallback(async () => {
    dispatch({ type: UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_REQUEST });
    try {
      const cachedUniqueTokens = await getUniqueTokens(accountAddress, network);
      dispatch({
        payload: cachedUniqueTokens,
        type: UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_SUCCESS,
      });
    } catch (error) {
      dispatch({ type: UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_FAILURE });
    }
  }, [accountAddress, dispatch, network]);

  return { loadUniqueTokens };
};
