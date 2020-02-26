import produce from 'immer';

// -- Constants --------------------------------------- //
const SET_IS_COIN_LIST_EDITED = 'editOptions/SET_IS_COIN_LIST_EDITED';

export const setIsCoinListEdited = payload => dispatch => {
  dispatch({
    payload,
    type: SET_IS_COIN_LIST_EDITED,
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  isCoinListEdited: false,
};

export default (state = INITIAL_STATE, action) =>
  produce(state, draft => {
    if (action.type === SET_IS_COIN_LIST_EDITED) {
      draft.isCoinListEdited = action.payload;
    }
  });
