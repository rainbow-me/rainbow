import produce from 'immer';

// -- Constants --------------------------------------- //
const SET_SELECTED_INPUT_ID = 'selectedInput/SET_SELECTED_INPUT_ID';

export const setSelectedInputId = payload => dispatch => {
  dispatch({
    payload,
    type: SET_SELECTED_INPUT_ID,
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  selectedInputId: null,
};

export default (state = INITIAL_STATE, action) =>
  produce(state, draft => {
    if (action.type === SET_SELECTED_INPUT_ID) {
      draft.selectedInputId = action.payload;
    }
  });
