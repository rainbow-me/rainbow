import {
  UNIQUE_TOKENS_GET_UNIQUE_TOKENS_FAILURE,
  UNIQUE_TOKENS_GET_UNIQUE_TOKENS_REQUEST,
  UNIQUE_TOKENS_GET_UNIQUE_TOKENS_SUCCESS,
} from '@/redux/uniqueTokens';
import { useDispatch } from 'react-redux';
import useAccountProfile from './useAccountProfile';
import useAccountSettings from './useAccountSettings';
import { fetchAllUniqueTokens } from './useUniqueTokens';

export const useUpdateUniqueTokensState = () => {
  const { accountAddress: address } = useAccountProfile();
  const { network } = useAccountSettings();
  const dispatch = useDispatch();

  const updateUniqueTokensState = async () => {
    dispatch({
      showcase: false,
      type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_REQUEST,
    });
    try {
      const uniqueTokens = await fetchAllUniqueTokens(address, network);
      dispatch({
        payload: uniqueTokens,
        showcase: false,
        type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_SUCCESS,
      });
    } catch (error) {
      dispatch({
        showcase: false,
        type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_FAILURE,
      });
    }
  };

  return { updateUniqueTokensState };
};
