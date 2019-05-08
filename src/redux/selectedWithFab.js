// -- Constants --------------------------------------- //
const UPDATE_SELECTED_ID = 'selected/UPDATE_SELECTED_ID';
const UPDATE_VELOCITY = 'selected/UPDATE_VELOCITY';

export const updateSelectedID = (selectedId) => (dispatch) => {
  dispatch({ selectedId, type: UPDATE_SELECTED_ID });
};

export const setScrollingVelocity = (scrollingVelocity) => (dispatch) => {
  dispatch({ scrollingVelocity, type: UPDATE_VELOCITY });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  scrollingVelocity: 0,
  selectedId: -1,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
  case UPDATE_SELECTED_ID:
    return {
      ...state,
      selectedId: action.selectedId,
    };
  case UPDATE_VELOCITY:
    return {
      ...state,
      scrollingVelocity: action.scrollingVelocity,
    };
  default:
    return state;
  }
};
