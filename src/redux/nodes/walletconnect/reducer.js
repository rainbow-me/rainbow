import { WALLETCONNECT_NEW_SESSION } from './actions';

const INITIAL_STATE = {
  walletConnectors: {},
};

export default (state = INITIAL_STATE, action) => {
  const { payload, type } = action;

  switch (type) {
    case WALLETCONNECT_NEW_SESSION:
      return {
        ...state,
        walletConnectors: payload,
      };
    default:
      return state;
  }
};
