import { map } from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { toCallKey } from '../redux/multicall';

const INVALID_RESULT = {
  blockNumber: undefined,
  data: undefined,
  valid: false,
};

const INVALID_CALL_STATE = {
  error: false,
  loading: false,
  result: undefined,
  syncing: false,
  valid: false,
};

const LOADING_CALL_STATE = {
  error: false,
  loading: true,
  result: undefined,
  syncing: true,
  valid: true,
};

export default function useMulticall(
  calls,
  contractInterface,
  fragment,
  latestBlockNumber
) {
  const { chainId, results } = useSelector(
    ({ multicall: { results }, settings: { chainId } }) => ({
      chainId,
      results,
    })
  );

  const callResults = useMemo(
    () =>
      map(calls, call => {
        if (!call) return INVALID_RESULT;
        const result = results[chainId]?.[toCallKey(call)];
        let data;
        if (result?.data && result?.data !== '0x') {
          data = result.data;
        }

        return { blockNumber: result?.blockNumber, data, valid: true };
      }),
    [calls, chainId, results]
  );

  const multicallResults = useMemo(
    () =>
      map(callResults, callResult => {
        if (!callResult) return INVALID_CALL_STATE;
        const { blockNumber, data, valid } = callResult;
        if (!valid) return INVALID_CALL_STATE;
        if (valid && !blockNumber) return LOADING_CALL_STATE;
        const success = data && data.length > 2;
        return {
          error: !success,
          loading: false,
          result:
            success && data
              ? contractInterface.decodeFunctionResult(fragment, data)
              : undefined,
          syncing: (blockNumber ?? 0) < latestBlockNumber,
          valid: true,
        };
      }),
    [callResults, contractInterface, fragment, latestBlockNumber]
  );

  return { multicallResults };
}
