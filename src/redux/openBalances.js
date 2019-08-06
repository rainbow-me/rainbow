import produce from 'immer';
import { saveSmallBalanceToggle } from '../handlers/commonStorage';

// -- Constants --------------------------------------- //
const SET_OPEN_SMALL_BALANCES = 'openBalances/SET_OPEN_SMALL_BALANCES';

export const setOpenSmallBalances = payload => dispatch => dispatch({
  payload,
  type: SET_OPEN_SMALL_BALANCES,
});

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  openSmallBalances: false,
};

export default (state = INITIAL_STATE, action) => (
  produce(state, draft => {
    if (action.type === SET_OPEN_SMALL_BALANCES) {
      saveSmallBalanceToggle(action.payload);
      draft.openSmallBalances = action.payload;
    }
  })
);
