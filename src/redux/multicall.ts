import { BigNumber } from '@ethersproject/bignumber';
import { Contract } from '@ethersproject/contracts';
import { ChainId } from '@uniswap/sdk';
import { chunk, forEach, get, keys, map, omit } from 'lodash';
import { web3Provider } from '../handlers/web3';
import { MULTICALL_ABI, MULTICALL_NETWORKS } from '../references/uniswap';
import { AppDispatch, AppGetState } from './store';

// -- Constants ------------------------------------------------------------- //
const MULTICALL_UPDATE_RESULTS = 'multicall/MULTICALL_UPDATE_RESULTS';
const MULTICALL_ADD_LISTENERS = 'multicall/MULTICALL_ADD_LISTENERS';
const MULTICALL_REMOVE_LISTENERS = 'multicall/MULTICALL_REMOVE_LISTENERS';

// chunk calls to not exceed the gas limit
const CALL_CHUNK_SIZE = 500;

// -- Actions --------------------------------------------------------------- //
export interface MulticallState {
  listeners: {
    // on a per-chain basis
    [chainId in ChainId]?: {
      // stores how many listeners there are for each call key
      [callKey: string]: number;
    };
  };

  results: {
    [chainId in ChainId]?: {
      [callKey: string]: {
        data?: string | null;
        blockNumber?: number;
        fetchingBlockNumber?: number;
      };
    };
  };
}

interface MulticallUpdateResultsAction {
  type: typeof MULTICALL_UPDATE_RESULTS;
  payload: MulticallState['results'];
}

interface MulticallAddListenersAction {
  type: typeof MULTICALL_ADD_LISTENERS;
  payload: MulticallState['listeners'];
}

interface MulticallRemoveListenersAction {
  type: typeof MULTICALL_REMOVE_LISTENERS;
  payload: MulticallState['listeners'];
}

export type MulticallActionTypes =
  | MulticallUpdateResultsAction
  | MulticallAddListenersAction
  | MulticallRemoveListenersAction;

export interface Call {
  address: string;
  callData: string;
}

export function toCallKey(call: Call): string {
  return `${call.address}-${call.callData}`;
}

export function parseCallKey(callKey: string): Call {
  const pcs = callKey.split('-');
  return {
    address: pcs[0],
    callData: pcs[1],
  };
}

export const multicallAddListeners = ({
  calls,
  chainId,
}: {
  calls: Call[];
  chainId: ChainId;
}) => (dispatch: AppDispatch, getState: AppGetState) => {
  const { listeners: existingListeners } = getState().multicall;
  const updatedListeners = {
    ...existingListeners,
  };

  updatedListeners[chainId] = updatedListeners[chainId] ?? {};

  forEach(calls, call => {
    const callKey = toCallKey(call);
    updatedListeners[chainId] = {
      [callKey]: (updatedListeners?.[chainId]?.[callKey] ?? 0) + 1,
    };
  });

  dispatch({
    payload: updatedListeners,
    type: MULTICALL_ADD_LISTENERS,
  });
};

export const multicallRemoveListeners = ({
  calls,
  chainId,
}: {
  calls: object;
  chainId: ChainId;
}) => (dispatch: AppDispatch, getState: AppGetState) => {
  const { listeners: existingListeners } = getState().multicall;
  let updatedListeners = {
    ...existingListeners,
  };

  if (!updatedListeners[chainId]) return;

  forEach(calls, call => {
    const callKey = toCallKey(call);
    const listenerCount = updatedListeners?.[chainId]?.[callKey];
    if (!listenerCount) return;

    if (listenerCount === 1) {
      updatedListeners = omit(updatedListeners, `[${chainId}][${callKey}]`);
    } else {
      updatedListeners[chainId] = {
        [callKey]: listenerCount - 1,
      };
    }
  });
  dispatch({
    payload: updatedListeners,
    type: MULTICALL_REMOVE_LISTENERS,
  });
};

const multicallUpdateResults = ({
  blockNumber,
  chainId,
  results,
}: {
  blockNumber: number;
  chainId: ChainId;
  results: Record<string, string | null>;
}) => (dispatch: AppDispatch, getState: AppGetState) => {
  const { results: existingResults } = getState().multicall;
  const updatedResults = {
    ...existingResults,
  };
  updatedResults[chainId] = updatedResults[chainId] ?? {};

  forEach(keys(results), callKey => {
    const current = get(existingResults, `[${chainId}][${callKey}]`);
    if ((current?.blockNumber ?? 0) > blockNumber) return;
    updatedResults[chainId] = {
      [callKey]: { blockNumber, data: results[callKey] },
    };
  });

  dispatch({
    payload: updatedResults,
    type: MULTICALL_UPDATE_RESULTS,
  });
};

/**
 * Return the keys that need to be refetched
 * @param callResults current call result state
 * @param listeningKeys each call key mapped to how old the data can be in blocks
 * @param chainId the current chain id
 * @param latestBlockNumber the latest block number
 */
function outdatedListeningKeys(
  callResults: MulticallState['results'],
  listeningKeys: string[],
  chainId: ChainId | undefined,
  latestBlockNumber: number | undefined
): string[] {
  if (!chainId) return [];
  const results = callResults[chainId];
  // no results at all, load everything
  if (!results) return listeningKeys;

  return listeningKeys.filter(callKey => {
    const data = get(callResults, `${chainId}.${callKey}`);
    // no data, must fetch
    if (!data) return true;

    // already fetching it for a recent enough block, don't refetch it
    if (
      data.fetchingBlockNumber &&
      latestBlockNumber &&
      data.fetchingBlockNumber >= latestBlockNumber
    )
      return false;

    // if data is newer than latestBlockNumber, don't fetch it
    return !(
      data.blockNumber &&
      latestBlockNumber &&
      data.blockNumber >= latestBlockNumber
    );
  });
}

export function activeListeningKeys(
  allListeners: MulticallState['listeners'],
  chainId?: ChainId
): string[] {
  if (!allListeners || !chainId) return [];
  const listeners = allListeners[chainId];
  if (!listeners) return [];
  return keys(listeners);
}

export const multicallUpdateOutdatedListeners = (
  latestBlockNumber?: number
) => (dispatch: AppDispatch, getState: AppGetState) => {
  const { chainId } = getState().settings;
  const { listeners, results } = getState().multicall;
  const listeningKeys = activeListeningKeys(listeners, chainId);
  const outdatedCallKeys = outdatedListeningKeys(
    results,
    listeningKeys,
    chainId,
    latestBlockNumber
  );

  const calls = map(outdatedCallKeys, key => parseCallKey(key));
  const chunkedCalls = chunk(calls, CALL_CHUNK_SIZE);

  const multicallContract = new Contract(
    MULTICALL_NETWORKS[chainId as ChainId],
    MULTICALL_ABI,
    web3Provider
  );

  forEach(chunkedCalls, (chunk, chunkIndex) => {
    multicallContract
      .aggregate(
        map(chunk, obj => {
          return [obj.address, obj.callData];
        })
      )
      .then(([resultsBlockNumber, returnData]: [BigNumber, string[]]) => {
        // accumulates the length of all previous indices
        const firstCallKeyIndex = chunkIndex * CALL_CHUNK_SIZE;
        const lastCallKeyIndex = firstCallKeyIndex + returnData.length;

        const results = outdatedCallKeys
          .slice(firstCallKeyIndex, lastCallKeyIndex)
          .reduce<{ [callKey: string]: string | null }>((memo, callKey, i) => {
            memo[callKey] = returnData[i] ?? null;
            return memo;
          }, {});

        dispatch(
          multicallUpdateResults({
            blockNumber: resultsBlockNumber.toNumber(),
            chainId,
            results,
          })
        );
      })
      .catch((error: any) => {
        console.log(
          '### [multicall redux, aggregate call] - Failed to fetch multicall',
          error
        );
      });
  });
};

// -- Reducer --------------------------------------------------------------- //
export const INITIAL_MULTICALL_STATE: MulticallState = {
  listeners: {},
  results: {},
};

export default (
  state = INITIAL_MULTICALL_STATE,
  action: MulticallActionTypes
) => {
  switch (action.type) {
    case MULTICALL_ADD_LISTENERS:
      return {
        ...state,
        listeners: action.payload,
      };
    case MULTICALL_REMOVE_LISTENERS:
      return {
        ...state,
        listeners: action.payload,
      };
    case MULTICALL_UPDATE_RESULTS:
      return {
        ...state,
        results: action.payload,
      };
    default:
      return state;
  }
};
