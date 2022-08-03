import { debounce } from 'lodash';
import { AnyAction, Dispatch } from 'redux';
import {
  DATA_LOAD_ACCOUNT_ASSETS_DATA_FINALIZED,
  DATA_LOAD_ACCOUNT_ASSETS_DATA_RECEIVED,
  DATA_LOAD_ACCOUNT_ASSETS_DATA_REQUEST,
  DataLoadAccountAssetsDataFinalizedAction,
} from '../data';

const FETCHING_TIMEOUT = 10000;
const WAIT_FOR_WEBSOCKET_DATA_TIMEOUT = 3000;

/**
 * Waits until data has finished streaming from the websockets. When finished,
 * the assets loading state will be marked as finalized.
 */
export function loadingAssetsMiddleware({
  dispatch,
}: {
  dispatch: Dispatch<DataLoadAccountAssetsDataFinalizedAction>;
}) {
  let accountAssetsDataFetchingTimeout: NodeJS.Timeout;

  const setLoadingFinished = () => {
    clearTimeout(accountAssetsDataFetchingTimeout);
    dispatch({ type: DATA_LOAD_ACCOUNT_ASSETS_DATA_FINALIZED });
  };
  const debouncedSetLoadingFinished = debounce(
    setLoadingFinished,
    WAIT_FOR_WEBSOCKET_DATA_TIMEOUT
  );

  return (next: Dispatch<AnyAction>) => (action: any) => {
    // If we have received data from the websockets, we want to debounce
    // the finalize state as there could be another event streaming in
    // shortly after.
    if (action.type === DATA_LOAD_ACCOUNT_ASSETS_DATA_RECEIVED) {
      debouncedSetLoadingFinished();
    }

    // On the rare occasion that we can't receive any events from the
    // websocket, we want to set the loading states back to falsy
    // after the timeout has elapsed.
    if (action.type === DATA_LOAD_ACCOUNT_ASSETS_DATA_REQUEST) {
      accountAssetsDataFetchingTimeout = setTimeout(() => {
        setLoadingFinished();
      }, FETCHING_TIMEOUT);
    }

    return next(action);
  };
}
