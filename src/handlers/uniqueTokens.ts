import {
  UNIQUE_TOKENS_GET_UNIQUE_TOKENS_FAILURE,
  UNIQUE_TOKENS_GET_UNIQUE_TOKENS_REQUEST,
  UNIQUE_TOKENS_GET_UNIQUE_TOKENS_SUCCESS,
  UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_FAILURE,
  UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_REQUEST,
  UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_SUCCESS,
} from '@/redux/uniqueTokens';
import { analytics } from '@/analytics';
import {
  getUniqueTokens,
  saveUniqueTokens,
} from '@/handlers/localstorage/accountLocal';
import {
  fetchSimplehashNfts,
  UNIQUE_TOKENS_LIMIT_PER_PAGE,
  UNIQUE_TOKENS_LIMIT_TOTAL,
} from '@/handlers/simplehash';
import { captureException } from '@sentry/react-native';
import { logger, RainbowError } from '@/logger';
import { Network } from '@/helpers';
import { fetchPolygonAllowlist } from '@/resources/polygonAllowlistQuery';
import { parseSimplehashNfts } from '@/parsers';
import { queryClient } from '@/react-query';
import { UniqueAsset } from '@/entities';
import store from '@/redux/store';
import { uniqueTokensQueryKey } from '@/hooks/useFetchUniqueTokens';

export const fetchAllUniqueTokens = async (
  address: string,
  network: Network
) => {
  const [newUniqueTokensResponse, polygonAllowlist] = await Promise.all([
    fetchSimplehashNfts(address),
    fetchPolygonAllowlist(),
  ]);

  const { rawNftData, nextCursor } = newUniqueTokensResponse;

  let cursor = nextCursor;
  let uniqueTokens = parseSimplehashNfts(rawNftData, polygonAllowlist);

  let shouldFetchMore =
    cursor && rawNftData?.length === UNIQUE_TOKENS_LIMIT_PER_PAGE;

  while (shouldFetchMore) {
    // eslint-disable-next-line no-await-in-loop
    const { rawNftData, nextCursor } = await fetchSimplehashNfts(
      address,
      cursor as string
    );

    const newUniqueTokens = parseSimplehashNfts(rawNftData, polygonAllowlist);

    uniqueTokens = [...uniqueTokens, ...newUniqueTokens];
    cursor = nextCursor;

    shouldFetchMore =
      cursor &&
      rawNftData?.length === UNIQUE_TOKENS_LIMIT_PER_PAGE &&
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

export const updateUniqueTokens = async () => {
  const { dispatch, getState } = store;
  const state = getState();
  const accountAddress = state.settings.accountAddress;
  const network = state.settings.network;

  dispatch({
    showcase: false,
    type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_REQUEST,
  });
  try {
    const uniqueTokens = await fetchAllUniqueTokens(accountAddress, network);
    dispatch({
      payload: uniqueTokens,
      showcase: false,
      type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_SUCCESS,
    });
  } catch (error) {
    captureException(error);
    logger.error(new RainbowError(`updateUniqueTokens error: ${error}`));
    dispatch({
      showcase: false,
      type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_FAILURE,
    });
  }
};

export const loadUniqueTokens = async () => {
  const { dispatch, getState } = store;
  const state = getState();
  const accountAddress = state.settings.accountAddress;
  const network = state.settings.network;

  dispatch({ type: UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_REQUEST });
  try {
    const cachedUniqueTokens = await getUniqueTokens(accountAddress, network);
    dispatch({
      payload: cachedUniqueTokens,
      type: UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_SUCCESS,
    });
  } catch (error) {
    captureException(error);
    logger.error(new RainbowError(`updateUniqueTokens error: ${error}`));
    dispatch({ type: UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_FAILURE });
  }
};
