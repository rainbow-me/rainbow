import { getUniqueTokens } from '@/handlers/localstorage/accountLocal';
import {
  UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_FAILURE,
  UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_REQUEST,
  UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_SUCCESS,
} from '@/redux/uniqueTokens';
import { useDispatch } from 'react-redux';
import useAccountSettings from './useAccountSettings';

export const useLoadUniqueTokens = () => {
  const { accountAddress, network } = useAccountSettings();
  const dispatch = useDispatch();

  const loadUniqueTokens = async () => {
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
  };

  return { loadUniqueTokens };
};
