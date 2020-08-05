// -- Constants --------------------------------------- //
const APP_STATE_UPDATE = 'contacts/APP_STATE_UPDATE';
// -- Actions ---------------------------------------- //

export const appUpdate = state => (dispatch, getState) => {
  const { app } = getState();
  const updatedState = {
    ...app,
    ...state,
  };
  dispatch({
    payload: updatedState,
    type: APP_STATE_UPDATE,
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  data: {
    walletReady: false,
  },
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case APP_STATE_UPDATE:
      return { ...state, ...action.payload };
    default:
      return state;
  }
};
