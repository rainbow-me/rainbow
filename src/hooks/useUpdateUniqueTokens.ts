import {
  UNIQUE_TOKENS_GET_UNIQUE_TOKENS_FAILURE,
  UNIQUE_TOKENS_GET_UNIQUE_TOKENS_REQUEST,
  UNIQUE_TOKENS_GET_UNIQUE_TOKENS_SUCCESS,
} from '@/redux/uniqueTokens';
import { useDispatch } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import { analytics } from '@/analytics';
import { saveUniqueTokens } from '@/handlers/localstorage/accountLocal';
import { fetchRawUniqueTokens, START_CURSOR } from '@/handlers/simplehash';
import { useCallback } from 'react';
import { captureException } from '@sentry/react-native';
import { logger, RainbowError } from '@/logger';
import { Network } from '@/helpers';
import { fetchPolygonAllowlist } from '@/resources/polygonAllowlistQuery';
import { parseSimplehashNFTs } from '@/parsers';
import { filterNfts, uniqueTokensQueryKey } from './useFetchUniqueTokens';
import {
  UNIQUE_TOKENS_LIMIT_PER_PAGE,
  UNIQUE_TOKENS_LIMIT_TOTAL,
} from '@/handlers/opensea-api';
import { queryClient } from '@/react-query';
import { UniqueAsset } from '@/entities';

export const fetchAllUniqueTokens = async (
  address: string,
  network: Network
) => {
  const [newUniqueTokensResponse, polygonAllowlist] = await Promise.all([
    fetchRawUniqueTokens(address, START_CURSOR),
    fetchPolygonAllowlist(),
  ]);

  const { rawNFTData, nextCursor } = newUniqueTokensResponse;

  let cursor = nextCursor;
  let uniqueTokens = filterNfts(
    parseSimplehashNFTs(rawNFTData),
    polygonAllowlist
  );

  let shouldFetchMore =
    cursor && rawNFTData?.length === UNIQUE_TOKENS_LIMIT_PER_PAGE;

  while (shouldFetchMore) {
    // eslint-disable-next-line no-await-in-loop
    const { rawNFTData, nextCursor } = await fetchRawUniqueTokens(
      address,
      cursor
    );
    const newUniqueTokens = filterNfts(
      parseSimplehashNFTs(rawNFTData),
      polygonAllowlist
    );
    uniqueTokens = [...uniqueTokens, ...newUniqueTokens];
    cursor = nextCursor;

    shouldFetchMore =
      cursor &&
      rawNFTData?.length === UNIQUE_TOKENS_LIMIT_PER_PAGE &&
      uniqueTokens.length < UNIQUE_TOKENS_LIMIT_TOTAL;
  }
  analytics.identify(undefined, { NFTs: uniqueTokens.length });
  saveUniqueTokens(uniqueTokens, address, network);
  queryClient.setQueryData<UniqueAsset[]>(
    uniqueTokensQueryKey({ address }),
    uniqueTokens
  );
  return uniqueTokens;
};

export const useUpdateUniqueTokens = () => {
  const { accountAddress: address, network } = useAccountSettings();
  const dispatch = useDispatch();

  const updateUniqueTokens = useCallback(async () => {
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
      captureException(error);
      logger.error(new RainbowError(`useUpdateUniqueTokens error: ${error}`));
      dispatch({
        showcase: false,
        type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_FAILURE,
      });
    }
  }, [address, dispatch, network]);

  return { updateUniqueTokens };
};
