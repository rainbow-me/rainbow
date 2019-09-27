import produce from 'immer';

// -- Constants --------------------------------------- //
const SET_KEYBOARD_HEIGHT = 'keyboardHeight/SET_KEYBOARD_HEIGHT';

export const setKeyboardHeight = payload => dispatch => dispatch({
  payload,
  type: SET_KEYBOARD_HEIGHT,
});

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = { keyboardHeight: 0 };

export default (state = INITIAL_STATE, action) => (
  produce(state, draft => {
    if (action.type === SET_KEYBOARD_HEIGHT) {
      draft.keyboardHeight = action.payload;
    }
  })
);
