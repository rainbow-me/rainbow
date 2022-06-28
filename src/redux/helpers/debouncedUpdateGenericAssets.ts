import { Dispatch } from 'redux';
import { DataUpdateGenericAssetsAction } from '../data';

let timeout: undefined | NodeJS.Timeout;
let payload: DataUpdateGenericAssetsAction['payload'] = {};

// we debounce the dispatching of the action since we receive data from websockets
// so we might receive lots of events in a small period of time
// each dispatch will basically trigger random rerenders
// so in order to not rerender everything and have all the data
// we store the previous data inside `payload` and dispatch all the data
// from all the events at once
export const debouncedUpdateGenericAssets = (
  action: DataUpdateGenericAssetsAction,
  dispatch: Dispatch<DataUpdateGenericAssetsAction>
) => {
  // this is just a debounce
  // but since we need some extra params it was easier
  // to implement debounce with timeouts
  clearTimeout(timeout!);

  payload = {
    ...payload,
    ...action.payload,
  };

  timeout = setTimeout(() => {
    dispatch({
      payload: payload,
      type: action.type,
    });

    payload = {};
  }, 500);
};
