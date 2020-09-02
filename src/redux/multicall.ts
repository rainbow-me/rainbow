import { Contract } from '@ethersproject/contracts';
import { chunk, forEach, get, keys, map, omit } from 'lodash';
import { web3ProviderV4 } from '../handlers/web3';
import { MULTICALL_ABI, MULTICALL_NETWORKS } from '../references/uniswap';

// -- Constants ------------------------------------------------------------- //
const MULTICALL_UPDATE_RESULTS = 'multicall/MULTICALL_UPDATE_RESULTS';
const MULTICALL_ADD_LISTENERS = 'multicall/MULTICALL_ADD_LISTENERS';
const MULTICALL_REMOVE_LISTENERS = 'multicall/MULTICALL_REMOVE_LISTENERS';

// chunk calls to not exceed the gas limit
const CALL_CHUNK_SIZE = 500;

// -- Actions --------------------------------------------------------------- //
export interface MulticallState {
  listeners?: {
    // on a per-chain basis
    [chainId: number]: {
      // stores how many listeners there are for each call key
      [callKey: string]: number;
    };
  };

  results: {
    [chainId: number]: {
      [callKey: string]: {
        data?: string | null;
        blockNumber?: number;
        fetchingBlockNumber?: number;
      };
    };
  };
}

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

export const multicallAddListeners = ({ calls, chainId }) => (
  dispatch,
  getState
) => {
  const { listeners: existingListeners } = getState().multicall;
  const updatedListeners = {
    ...existingListeners,
  };

  updatedListeners[chainId] = updatedListeners[chainId] ?? {};

  forEach(calls, call => {
    const callKey = toCallKey(call);
    updatedListeners[chainId][callKey] =
      (updatedListeners[chainId][callKey] ?? 0) + 1;
  });

  dispatch({
    payload: updatedListeners,
    type: MULTICALL_ADD_LISTENERS,
  });
};

export const multicallRemoveListeners = ({ chainId, calls }) => (
  dispatch,
  getState
) => {
  const { listeners: existingListeners } = getState().multicall;
  let updatedListeners = {
    ...existingListeners,
  };

  if (!updatedListeners[chainId]) return;

  forEach(calls, call => {
    const callKey = toCallKey(call);
    if (!updatedListeners[chainId][callKey]) return;
    if (updatedListeners[chainId][callKey] === 1) {
      updatedListeners = omit(updatedListeners, `[${chainId}][${callKey}]`);
    } else {
      updatedListeners[chainId][callKey]--;
    }
  });
  dispatch({
    payload: updatedListeners,
    type: MULTICALL_REMOVE_LISTENERS,
  });
};

export const multicallUpdateResults = ({ chainId, results, blockNumber }) => (
  dispatch,
  getState
) => {
  const { results: existingResults } = getState().multicall;
  const updatedResults = {
    ...existingResults,
  };
  updatedResults[chainId] = updatedResults[chainId] ?? {};

  forEach(keys(results), callKey => {
    const current = get(results, `[${chainId}][${callKey}]`);
    if ((current?.blockNumber ?? 0) > blockNumber) return;
    updatedResults[chainId][callKey] = { blockNumber, data: results[callKey] };
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
export function outdatedListeningKeys(
  callResults,
  listeningKeys: string[],
  chainId: number | undefined,
  latestBlockNumber: number | undefined
): string[] {
  if (!chainId || !latestBlockNumber) return [];
  const results = callResults[chainId];
  // no results at all, load everything
  if (!results) return listeningKeys;

  return listeningKeys.filter(callKey => {
    const data = callResults[chainId][callKey];
    // no data, must fetch
    if (!data) return true;

    // already fetching it for a recent enough block, don't refetch it
    if (
      data.fetchingBlockNumber &&
      data.fetchingBlockNumber >= latestBlockNumber
    )
      return false;

    // if data is newer than latestBlockNumber, don't fetch it
    return !(data.blockNumber && data.blockNumber >= latestBlockNumber);
  });
}

export function activeListeningKeys(allListeners, chainId?: number): string[] {
  if (!allListeners || !chainId) return {};
  const listeners = allListeners[chainId];
  if (!listeners) return {};
  return keys(listeners);
}

export const multicallUpdateOutdatedListeners = (latestBlockNumber?) => (
  dispatch,
  getState
) => {
  const { chainId } = getState().settings;
  const { listeners, results } = getState().multicall;
  const listeningKeys: string[] = activeListeningKeys(listeners, chainId);
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
    web3ProviderV4
  );

  forEach(chunkedCalls, (chunk, chunkIndex) => {
    multicallContract
      .aggregate(
        map(chunk, obj => {
          return [obj.address, obj.callData];
        })
      )
      .then(([resultsBlockNumber, returnData]) => {
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
export const INITIAL_MULTICALL_STATE = {
  listeners: {},
  results: {},
};

export default (state = INITIAL_MULTICALL_STATE, action) => {
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
