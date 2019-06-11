// -- Constants --------------------------------------- //
const SET_ASSETS_FETCHED = 'initialFetch/SET_ASSETS_FETCH';
const SET_TRANSACTIONS_FETCHED = 'initialFetch/SET_TRANSACTIONS_FETCHED';
const NOTHING_FETCHED = 0;
const FETCHED_ASSETS = 1;
export const FETCHED_TRANSACTIONS = 2;

export const setTransactionFetched = () => (dispatch, getState) => {
  if (getState().initialFetch.fetchingState === FETCHED_ASSETS) {
    dispatch({ type: SET_TRANSACTIONS_FETCHED });
  }
};

export const setAssetsFetched = () => (dispatch, getState) => {
  if (getState().initialFetch.fetchingState === NOTHING_FETCHED) {
    dispatch({ type: SET_ASSETS_FETCHED });
  }
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = { fetchingState: NOTHING_FETCHED };

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
  case SET_ASSETS_FETCHED:
    return { fetchingState: FETCHED_ASSETS };
  case SET_TRANSACTIONS_FETCHED:
    return { fetchingState: FETCHED_TRANSACTIONS };
  default:
    return state;
  }
};
