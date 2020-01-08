import produce from 'immer';

// -- Constants --------------------------------------- //
const SET_IS_ACTION_SHEET_OPEN = 'actionSheetManager/SET_IS_ACTION_SHEET_OPEN';

export const setIsActionSheetOpen = payload => dispatch =>
  dispatch({
    payload,
    type: SET_IS_ACTION_SHEET_OPEN,
  });

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  isActionSheetOpen: false,
};

export default (state = INITIAL_STATE, action) =>
  produce(state, draft => {
    if (action.type === SET_IS_ACTION_SHEET_OPEN) {
      draft.isActionSheetOpen = action.payload;
    }
  });
