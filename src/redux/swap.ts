import { AnyAction } from 'redux';
import { AppDispatch } from '@rainbow-me/redux/store';

// -- Constants --------------------------------------- //
const SWAP_CLEAR_STATE = 'swap/SWAP_CLEAR_STATE';

// -- Actions ---------------------------------------- //
export const swapResetState = () => (dispatch: AppDispatch) => {
  dispatch({ type: SWAP_CLEAR_STATE });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {};

export default (state = INITIAL_STATE, action: AnyAction) => {
  switch (action.type) {
    case SWAP_CLEAR_STATE:
      return {
        ...state,
        ...INITIAL_STATE,
      };
    default:
      return state;
  }
};
