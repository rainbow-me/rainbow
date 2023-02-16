import {
  UNIQUE_TOKENS_GET_UNIQUE_TOKENS_FAILURE,
  UNIQUE_TOKENS_GET_UNIQUE_TOKENS_REQUEST,
  UNIQUE_TOKENS_GET_UNIQUE_TOKENS_SUCCESS,
} from '@/redux/uniqueTokens';
import { useDispatch } from 'react-redux';
import useAccountProfile from './useAccountProfile';
import useAccountSettings from './useAccountSettings';
import { analytics } from '@/analytics';
import {
  getUniqueTokens,
  saveUniqueTokens,
} from '@/handlers/localstorage/accountLocal';
import { START_CURSOR } from '@/handlers/simplehash';
import { parseSimplehashNFTs } from '@/parsers';
import { fetchUniqueTokens } from '@/resources/uniqueTokensQuery';
import { fetchPolygonAllowlist } from '@/resources/polygonAllowlistQuery';
import { promiseUtils } from '@/utils';
import { uniqBy } from 'lodash';
import { useCallback } from 'react';
import { filterNfts, UNIQUE_TOKENS_LIMIT_TOTAL } from './useUniqueTokens';
import { captureException } from '@sentry/react-native';
import { logger, RainbowError } from '@/logger';

export const useUpdateUniqueTokensState = () => {
  const { accountAddress: address } = useAccountProfile();
  const { network } = useAccountSettings();
  const dispatch = useDispatch();

  const updateUniqueTokensState = useCallback(async () => {
    dispatch({
      showcase: false,
      type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_REQUEST,
    });
    try {
      const [
        storedUniqueTokens,
        polygonAllowlist,
        newUniqueTokensResponse,
      ] = await promiseUtils.PromiseAllWithFails([
        getUniqueTokens(address, network),
        fetchPolygonAllowlist(),
        fetchUniqueTokens({
          address,
          cursor: START_CURSOR,
        }),
      ]);
      const { data, nextCursor } = newUniqueTokensResponse;
      let cursor = nextCursor;
      let uniqueTokens;
      const newUniqueTokens = filterNfts(
        parseSimplehashNFTs(data),
        polygonAllowlist
      );
      if (storedUniqueTokens?.length) {
        uniqueTokens = uniqBy(
          [...storedUniqueTokens, ...newUniqueTokens],
          'uniqueId'
        );
      } else {
        uniqueTokens = newUniqueTokens;
      }
      while (cursor && uniqueTokens.length < UNIQUE_TOKENS_LIMIT_TOTAL) {
        // eslint-disable-next-line no-await-in-loop
        const { data, nextCursor } = await fetchUniqueTokens({
          address,
          cursor,
        });
        const newUniqueTokens = filterNfts(
          parseSimplehashNFTs(data),
          polygonAllowlist
        );
        if (storedUniqueTokens?.length) {
          uniqueTokens = uniqBy(
            [...uniqueTokens, ...newUniqueTokens],
            'uniqueId'
          );
        } else {
          uniqueTokens = [...uniqueTokens, ...newUniqueTokens];
        }
        cursor = nextCursor;
      }
      analytics.identify(undefined, { NFTs: uniqueTokens.length });
      saveUniqueTokens(uniqueTokens, address, network);
      dispatch({
        payload: uniqueTokens,
        showcase: false,
        type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_SUCCESS,
      });
    } catch (error) {
      captureException(error);
      logger.error(
        new RainbowError(`useUpdateUniqueTokensState error: ${error}`)
      );
      dispatch({
        showcase: false,
        type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_FAILURE,
      });
    }
  }, [address, dispatch, network]);

  return { updateUniqueTokensState };
};
