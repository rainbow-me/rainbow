import { captureException } from '@sentry/react-native';
import { uniqBy } from 'lodash';
import { Dispatch } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import {
  applyENSMetadataFallbackToToken,
  applyENSMetadataFallbackToTokens,
  parseSimplehashNFTs,
} from '../parsers/uniqueTokens';
import { AppGetState, AppState } from './store';
import { analytics } from '@/analytics';
import { UniqueAsset } from '@/entities';
import { fetchEnsTokens } from '@/handlers/ens';
import {
  getUniqueTokens,
  saveUniqueTokens,
} from '@/handlers/localstorage/accountLocal';
import {
  apiGetAccountUniqueToken,
  apiGetAccountUniqueTokens,
  UNIQUE_TOKENS_LIMIT_PER_PAGE,
  UNIQUE_TOKENS_LIMIT_TOTAL,
} from '@/handlers/opensea-api';
import { fetchPoaps } from '@/handlers/poap';
import {
  fetchRawUniqueTokens,
  getNftsByWalletAddress,
  START_CURSOR,
} from '@/handlers/simplehash';
import { Network } from '@/helpers/networkTypes';
import { queryClient } from '@/react-query';
import { rainbowFetch } from '@/rainbow-fetch';

const POLYGON_ALLOWLIST_STALE_TIME = 600000; // 10 minutes
const POAP_ADDRESS = '0x22c1f6050e56d2876009903609a2cc3fef83b415';

// -- Constants ------------------------------------------------------------- //

const UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_REQUEST =
  'uniqueTokens/UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_REQUEST';
const UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_SUCCESS =
  'uniqueTokens/UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_SUCCESS';
const UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_FAILURE =
  'uniqueTokens/UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_FAILURE';

const UNIQUE_TOKENS_GET_UNIQUE_TOKENS_REQUEST =
  'uniqueTokens/UNIQUE_TOKENS_GET_UNIQUE_TOKENS_REQUEST';
const UNIQUE_TOKENS_GET_UNIQUE_TOKENS_SUCCESS =
  'uniqueTokens/UNIQUE_TOKENS_GET_UNIQUE_TOKENS_SUCCESS';
const UNIQUE_TOKENS_GET_UNIQUE_TOKENS_FAILURE =
  'uniqueTokens/UNIQUE_TOKENS_GET_UNIQUE_TOKENS_FAILURE';

const UNIQUE_TOKENS_CLEAR_STATE = 'uniqueTokens/UNIQUE_TOKENS_CLEAR_STATE';
const UNIQUE_TOKENS_CLEAR_STATE_SHOWCASE =
  'uniqueTokens/UNIQUE_TOKENS_CLEAR_STATE_SHOWCASE';

// -- Actions --------------------------------------------------------------- //

/**
 * Represents the current state of the `uniqueTokens` reducer.
 */
interface UniqueTokensState {
  /**
   * Whether or not unique tokens are currently being fetched via API.
   */
  fetchingUniqueTokens: boolean;

  /**
   * Whether or not unique showcased tokens are currently being fetched via
   * API.
   */
  fetchingUniqueTokensShowcase: boolean;

  /**
   * Whether or not unique tokens are currently being loaded from local
   * storage.
   */
  loadingUniqueTokens: boolean;

  /**
   * Whether or not unique showcased tokens are currently being loaded from
   * local storage.
   */
  loadingUniqueTokensShowcase: boolean;

  /**
   * The user's unique tokens.
   */
  uniqueTokens: UniqueAsset[];

  /**
   * The user's unique showcased tokens.
   */
  uniqueTokensShowcase: UniqueAsset[];
}

/**
 * An action for the `uniqueTokens` reducer.
 */
type UniqueTokensAction =
  | UniqueTokensLoadAction
  | UniqueTokensGetAction
  | UniqueTokensClearStateAction
  | UniqueTokensClearStateShowcaseAction;

/**
 * The action for starting to load unique tokens from local storage.
 */
interface UniqueTokensLoadUniqueTokensRequestAction {
  type: typeof UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_REQUEST;
}

/**
 * The action used when unique tokens are loaded successfully from local
 * storage.
 */
interface UniqueTokensLoadUniqueTokensSuccessAction {
  type: typeof UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_SUCCESS;
  payload: UniqueAsset[];
}

/**
 * The action used when loading unique tokens from local storage fails.
 */
interface UniqueTokensLoadUniqueTokensFailureAction {
  type: typeof UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_FAILURE;
}

/**
 * An action related to loading tokens from local storage.
 */
type UniqueTokensLoadAction =
  | UniqueTokensLoadUniqueTokensRequestAction
  | UniqueTokensLoadUniqueTokensSuccessAction
  | UniqueTokensLoadUniqueTokensFailureAction;

/**
 * The action for starting to fetch unique tokens via API.
 */
interface UniqueTokensGetUniqueTokensRequestAction {
  type: typeof UNIQUE_TOKENS_GET_UNIQUE_TOKENS_REQUEST;
  showcase: boolean;
}

/**
 * The action used when unique tokens have been fetched from the API
 * successfully.
 */
interface UniqueTokensGetUniqueTokensSuccessAction {
  type: typeof UNIQUE_TOKENS_GET_UNIQUE_TOKENS_SUCCESS;
  showcase: boolean;
  payload: UniqueAsset[];
}

/**
 * The action used when fetching unique tokens via API fails.
 */
interface UniqueTokensGetUniqueTokensFailureAction {
  type: typeof UNIQUE_TOKENS_GET_UNIQUE_TOKENS_FAILURE;
  showcase: boolean;
}

/**
 * An action related to fetching unique tokens by API.
 */
type UniqueTokensGetAction =
  | UniqueTokensGetUniqueTokensRequestAction
  | UniqueTokensGetUniqueTokensSuccessAction
  | UniqueTokensGetUniqueTokensFailureAction;

/**
 * The action used to reset the state for unique tokens, but not the showcase.
 */
interface UniqueTokensClearStateAction {
  type: typeof UNIQUE_TOKENS_CLEAR_STATE;
}

/**
 * The action used to clear the showcase state.
 */
interface UniqueTokensClearStateShowcaseAction {
  type: typeof UNIQUE_TOKENS_CLEAR_STATE_SHOWCASE;
}

/**
 * Loads unique tokens from local storage and updates state.
 */
export const uniqueTokensLoadState = () => async (
  dispatch: Dispatch<UniqueTokensLoadAction>,
  getState: AppGetState
) => {
  const { accountAddress, network } = getState().settings;
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

/**
 * Resets unique tokens, but not the showcase, in state.
 */
export const uniqueTokensResetState = () => (
  dispatch: Dispatch<UniqueTokensClearStateAction>
) => {
  dispatch({ type: UNIQUE_TOKENS_CLEAR_STATE });
};

/**
 * Fetches unique tokens via API, updates state, and saves to local storage,
 * as long as the current network is mainnet.
 */
export const uniqueTokensRefreshState = () => async (
  dispatch: ThunkDispatch<AppState, unknown, never>,
  getState: AppGetState
) => {
  const { network } = getState().settings;

  // Currently not supported in testnets
  if (network !== Network.mainnet) {
    return;
  }

  dispatch(fetchUniqueTokens());
};

/**
 * Fetches unique tokens or showcased unique tokens via API, updates state,
 * and saves to local storage.
 *
 * @param showcaseAddress The showcase address to use for fetching, or no
 * address to fetch all unique tokens.
 */
export const fetchUniqueTokens = (showcaseAddress?: string) => async (
  dispatch: ThunkDispatch<
    AppState,
    unknown,
    UniqueTokensGetAction | UniqueTokensClearStateShowcaseAction
  >,
  getState: AppGetState
) => {
  dispatch({
    showcase: !!showcaseAddress,
    type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_REQUEST,
  });
  if (showcaseAddress) {
    dispatch({
      type: UNIQUE_TOKENS_CLEAR_STATE_SHOWCASE,
    });
  }
  const { network: currentNetwork } = getState().settings;
  const accountAddress = showcaseAddress || getState().settings.accountAddress;
  let uniqueTokens: UniqueAsset[] = [];
  let errorCheck = false;

  const polygonAllowlist = await queryClient.fetchQuery(
    ['polygon-allowlist'],
    async () => {
      return (
        await rainbowFetch(
          'https://metadata.p.rainbow.me/token-list/137-allowlist.json',
          { method: 'get' }
        )
      ).data.data.addresses;
    },
    {
      staleTime: POLYGON_ALLOWLIST_STALE_TIME, // 10 minutes
    }
  );
  let shouldStopFetching = false;
  let cursor = START_CURSOR;
  while (cursor && !shouldStopFetching) {
    try {
      const { rawNFTData, nextCursor } = await fetchRawUniqueTokens(
        accountAddress,
        cursor
      );

      cursor = nextCursor;
      shouldStopFetching =
        rawNFTData.length < UNIQUE_TOKENS_LIMIT_PER_PAGE ||
        uniqueTokens.length >= UNIQUE_TOKENS_LIMIT_TOTAL ||
        accountAddress !==
          (showcaseAddress || getState().settings.accountAddress);

      const tokens = parseSimplehashNFTs(rawNFTData).filter(
        (nft: UniqueAsset) => {
          if (nft.collection.name === null) return false;

          // filter out spam
          if (nft.spamScore >= 85) return false;

          // filter gnosis NFTs that are not POAPs
          if (
            nft.network === Network.gnosis &&
            nft.asset_contract &&
            nft?.asset_contract?.address?.toLowerCase() !== POAP_ADDRESS
          )
            return false;

          if (
            nft.network === Network.polygon &&
            !polygonAllowlist.includes(
              nft.asset_contract?.address?.toLowerCase()
            )
          ) {
            return false;
          }

          return true;
        }
      );
      uniqueTokens = uniqueTokens.concat(tokens);
    } catch (error) {
      dispatch({
        showcase: !!showcaseAddress,
        type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_FAILURE,
      });
      captureException(error);
      shouldStopFetching = true;
      errorCheck = true;
    }
  }

  // const fetchNetwork = async (network: Network) => {
  //   let shouldStopFetching = false;
  //   let page = 0;
  //   while (!shouldStopFetching) {
  //     shouldStopFetching = await fetchPage(page, network);
  //     // check that the account address to fetch for has not changed while fetching
  //     const isCurrentAccountAddress =
  //       accountAddress ===
  //       (showcaseAddress || getState().settings.accountAddress);
  //     if (!isCurrentAccountAddress) {
  //       shouldStopFetching = true;
  //     }

  //     page++;
  //   }
  // };

  // const fetchPage = async (cursor: string | null | undefined) => {
  //   let shouldStopFetching = false;
  //   try {
  //     let newPageResults;
  //     try {
  //       newPageResults = await fetchRawUniqueTokens(accountAddress, cursor);
  //     } catch (e) {
  //       newPageResults = [];
  //     }

  //     // If there are any "unknown" ENS names, fallback to the ENS
  //     // metadata service.
  //     // newPageResults = await applyENSMetadataFallbackToTokens(newPageResults);

  //     uniqueTokens = uniqueTokens.concat(newPageResults);
  //     shouldStopFetching =
  //       newPageResults.length < UNIQUE_TOKENS_LIMIT_PER_PAGE ||
  //       uniqueTokens.length >= UNIQUE_TOKENS_LIMIT_TOTAL;
  //   } catch (error) {
  //     dispatch({
  //       showcase: !!showcaseAddress,
  //       type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_FAILURE,
  //     });
  //     captureException(error);
  //     // stop fetching if there is an error & dont save results
  //     shouldStopFetching = true;
  //     errorCheck = true;
  //   }
  //   return shouldStopFetching;
  // };

  // await fetchNetwork(currentNetwork);

  // Only include poaps and L2 nft's on mainnet
  // if (currentNetwork === Network.mainnet) {
  //   const poaps = (await fetchPoaps(accountAddress)) ?? [];
  //   if (poaps.length > 0) {
  //     analytics.identify(undefined, { poaps: poaps.length });
  //     uniqueTokens = uniqueTokens.filter(token => token.familyName !== 'POAP');
  //     uniqueTokens = uniqueTokens.concat(poaps);
  //   }

  // Fetch Optimism and Arbitrum NFTs
  // const layer2NFTs = await getNftsByWalletAddress(accountAddress);

  // if (layer2NFTs.length > 0) {
  //   uniqueTokens = uniqueTokens.concat(layer2NFTs);
  // }

  // we only care about analytics for mainnet + L2's
  analytics.identify(undefined, { NFTs: uniqueTokens.length });

  // Fetch recently registered ENS tokens (OpenSea doesn't recognize these for a while).
  // We will fetch tokens registered in the past 48 hours to be safe.
  // const ensTokens = await fetchEnsTokens({
  //   address: accountAddress,
  //   timeAgo: { hours: 48 },
  // });
  // if (ensTokens.length > 0) {
  //   uniqueTokens = uniqBy([...uniqueTokens, ...ensTokens], 'uniqueId');
  // }
  // }

  // NFT Fetching clean up
  // check that the account address to fetch for has not changed while fetching before updating state
  const isCurrentAccountAddress =
    accountAddress === (showcaseAddress || getState().settings.accountAddress);
  if (!showcaseAddress && isCurrentAccountAddress && !errorCheck) {
    saveUniqueTokens(uniqueTokens, accountAddress, currentNetwork);
  }
  if (isCurrentAccountAddress && !errorCheck) {
    dispatch({
      payload: uniqueTokens,
      showcase: !!showcaseAddress,
      type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_SUCCESS,
    });
  }
};

/**
 * Revalidates a unique token via OpenSea API, updates state, and saves to local storage.
 *
 * Note:  it is intentional that there are no loading states dispatched in this action. This
 *        is for _revalidation_ purposes only.
 *
 * @param contractAddress - The contract address of the NFT
 * @param tokenId - The tokenId of the NFT
 * @param {Object} config - Optional configuration
 * @param {boolean} config.forceUpdate - Trigger a force update of metadata (equivalent to refreshing metadata in OpenSea)
 */
export const revalidateUniqueToken = (
  contractAddress: string,
  tokenId: string,
  { forceUpdate = false }: { forceUpdate?: boolean } = {}
) => async (
  dispatch: ThunkDispatch<
    AppState,
    unknown,
    UniqueTokensGetAction | UniqueTokensClearStateShowcaseAction
  >,
  getState: AppGetState
) => {
  const { network: currentNetwork } = getState().settings;
  const { uniqueTokens: existingUniqueTokens } = getState().uniqueTokens;
  const accountAddress = getState().settings.accountAddress;

  let token = await apiGetAccountUniqueToken(
    currentNetwork,
    contractAddress,
    tokenId,
    { forceUpdate }
  );

  // If the token is an "unknown" ENS name, fallback to the ENS
  // metadata service.
  try {
    token = await applyENSMetadataFallbackToToken(token);
  } catch (error) {
    captureException(error);
  }

  const uniqueTokens = existingUniqueTokens.map(existingToken =>
    existingToken.id === tokenId ? token : existingToken
  );

  saveUniqueTokens(uniqueTokens, accountAddress, currentNetwork);
  dispatch({
    payload: uniqueTokens,
    showcase: false,
    type: UNIQUE_TOKENS_GET_UNIQUE_TOKENS_SUCCESS,
  });

  return token;
};

// -- Reducer --------------------------------------------------------------- //

export const INITIAL_UNIQUE_TOKENS_STATE: UniqueTokensState = {
  fetchingUniqueTokens: false,
  fetchingUniqueTokensShowcase: false,
  loadingUniqueTokens: false,
  loadingUniqueTokensShowcase: false,
  uniqueTokens: [],
  uniqueTokensShowcase: [],
};

export default (
  state: UniqueTokensState = INITIAL_UNIQUE_TOKENS_STATE,
  action: UniqueTokensAction
): UniqueTokensState => {
  switch (action.type) {
    case UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_REQUEST:
      return {
        ...state,
        loadingUniqueTokens: true,
      };
    case UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_SUCCESS:
      return {
        ...state,
        loadingUniqueTokens: false,
        uniqueTokens: action.payload,
      };
    case UNIQUE_TOKENS_LOAD_UNIQUE_TOKENS_FAILURE:
      return {
        ...state,
        loadingUniqueTokens: false,
      };
    case UNIQUE_TOKENS_GET_UNIQUE_TOKENS_REQUEST:
      if (action.showcase) {
        return {
          ...state,
          fetchingUniqueTokensShowcase: true,
        };
      } else {
        return {
          ...state,
          fetchingUniqueTokens: true,
        };
      }
    case UNIQUE_TOKENS_GET_UNIQUE_TOKENS_SUCCESS:
      if (action.showcase) {
        return {
          ...state,
          fetchingUniqueTokensShowcase: false,
          uniqueTokensShowcase: action.payload,
        };
      } else {
        return {
          ...state,
          fetchingUniqueTokens: false,
          uniqueTokens: action.payload,
        };
      }
    case UNIQUE_TOKENS_GET_UNIQUE_TOKENS_FAILURE:
      if (action.showcase) {
        return {
          ...state,
          fetchingUniqueTokensShowcase: false,
        };
      } else {
        return {
          ...state,
          fetchingUniqueTokens: false,
        };
      }

    case UNIQUE_TOKENS_CLEAR_STATE:
      return {
        ...state,
        ...INITIAL_UNIQUE_TOKENS_STATE,
      };
    case UNIQUE_TOKENS_CLEAR_STATE_SHOWCASE:
      return {
        ...state,
        ...{
          fetchingUniqueTokensShowcase: false,
          loadingUniqueTokensShowcase: false,
          uniqueTokensShowcase: [],
        },
      };
    default:
      return state;
  }
};
