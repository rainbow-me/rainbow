import produce from 'immer';

// -- Constants --------------------------------------- //
const CLEAR_KEYBOARD_FOCUS_HISTORY = 'keyboardFocusHistory/CLEAR_KEYBOARD_FOCUS_HISTORY';
const PUSH_KEYBOARD_FOCUS_HISTORY = 'keyboardFocusHistory/PUSH_KEYBOARD_FOCUS_HISTORY';

export const clearKeyboardFocusHistory = () => dispatch => dispatch({
  type: CLEAR_KEYBOARD_FOCUS_HISTORY,
});

export const pushKeyboardFocusHistory = payload => dispatch => dispatch({
  payload,
  type: PUSH_KEYBOARD_FOCUS_HISTORY,
});


// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  keyboardFocusHistory: [],
};

export default (state = INITIAL_STATE, action) => (
  produce(state, draft => {
    if (action.type === PUSH_KEYBOARD_FOCUS_HISTORY) {
      draft.keyboardFocusHistory.push(action.payload)
    } else if (action.type === CLEAR_KEYBOARD_FOCUS_HISTORY) {
      return INITIAL_STATE;
    }
  })
);
