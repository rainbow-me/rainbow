import produce from 'immer';

// -- Constants --------------------------------------- //
const UPDATE_ACTION_TYPE = 'selected/UPDATE_ACTION_TYPE';
const UPDATE_SELECTED_ID = 'selected/UPDATE_SELECTED_ID';
const UPDATE_VELOCITY = 'selected/UPDATE_VELOCITY';

export const setActionType = actionType => dispatch => dispatch({
  actionType,
  type: UPDATE_ACTION_TYPE,
});

export const setScrollingVelocity = scrollingVelocity => dispatch => dispatch({
  scrollingVelocity,
  type: UPDATE_VELOCITY,
});

export const updateSelectedID = selectedId => dispatch => dispatch({
  selectedId,
  type: UPDATE_SELECTED_ID,
});

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  actionType: null,
  scrollingVelocity: 0,
  selectedId: -1,
};

export default (state = INITIAL_STATE, action) => (
  produce(state, draft => {
    switch (action.type) {
    case UPDATE_ACTION_TYPE:
      draft.actionType = action.actionType;
      break;
    case UPDATE_SELECTED_ID:
      draft.selectedId = action.selectedId;
      break;
    case UPDATE_VELOCITY:
      draft.scrollingVelocity = action.scrollingVelocity;
      break;
    default:
      break;
    }
  })
);
