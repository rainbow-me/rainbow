import debounce from 'lodash/debounce';
import { Dispatch } from 'redux';
import { DataUpdateGenericAssetsAction } from '../data';

let payload: DataUpdateGenericAssetsAction['payload'] = {};

// we debounce the dispatching of the action in order to "batch" the events
// since we receive data from websockets
// so we might receive lots of events in a small period of time
// each dispatch will basically trigger random rerenders
// so in order to not rerender everything and have all the data
// we store the previous data inside `payload` and dispatch all the data
// from all the events at once
const debounced = debounce(
  (
    action: DataUpdateGenericAssetsAction,
    dispatch: Dispatch<DataUpdateGenericAssetsAction>
  ) => {
    dispatch({
      payload: payload,
      type: action.type,
    });

    payload = {};
  },
  500,
  {
    // failsafe if zerion decides to bomb us with events
    maxWait: 5000,
  }
);

export const cancelDebouncedUpdateGenericAssets = () => {
  debounced.cancel();
};

export const debouncedUpdateGenericAssets = (
  action: DataUpdateGenericAssetsAction,
  dispatch: Dispatch<DataUpdateGenericAssetsAction>
) => {
  payload = {
    ...payload,
    ...action.payload,
  };

  debounced(action, dispatch);
};
