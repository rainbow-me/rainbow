// -- Constants --------------------------------------- //
const UPDATE_SELECTED_ID = 'selected/UPDATE_SELECTED_ID';
const UPDATE_VELOCITY = 'selected/UPDATE_VELOCITY';
const UPDATE_ACTION_TYPE = 'selected/UPDATE_ACTION_TYPE';

export const updateSelectedID = (selectedId) => (dispatch) => {
  dispatch({ selectedId, type: UPDATE_SELECTED_ID });
};

export const setScrollingVelocity = (scrollingVelocity) => (dispatch) => {
  dispatch({ scrollingVelocity, type: UPDATE_VELOCITY });
};

export const setActionType = (actionType) => (dispatch) => {
  console.log(actionType)
  dispatch({ actionType, type: UPDATE_ACTION_TYPE });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  actionType: null,
  scrollingVelocity: 0,
  selectedId: -1,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
  case UPDATE_ACTION_TYPE:
    return {
      ...state,
      actionType: action.actionType,
    };
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
