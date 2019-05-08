// -- Constants --------------------------------------- //
const UPDATE_SELECTED_ID = 'selected/UPDATE_SELECTED_ID';

export const updateSelectedID = (selectedId) => (dispatch) => {
  dispatch({ selectedId, type: UPDATE_SELECTED_ID });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  selectedId: -1,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
  case UPDATE_SELECTED_ID:
    return {
      selectedId: action.selectedId,
    };
  default:
    return state;
  }
};
