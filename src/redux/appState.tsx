// -- Constants --------------------------------------- //
const APP_STATE_UPDATE = 'contacts/APP_STATE_UPDATE';
// -- Actions ---------------------------------------- //

export const appStateUpdate = stateToUpdate => dispatch => {
  dispatch({
    payload: stateToUpdate,
    type: APP_STATE_UPDATE,
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  walletReady: false,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case APP_STATE_UPDATE:
      return { ...state, ...action.payload };
    default:
      return state;
  }
};
