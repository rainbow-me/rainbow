import produce from 'immer';

// -- Constants --------------------------------------- //
const SET_OPEN_FAMILY_TABS = 'openFamilyTabs/SET_OPEN_FAMILY_TABS';
const PUSH_OPEN_FAMILY_TAB = 'openFamilyTabs/PUSH_OPEN_FAMILY_TAB';

export const setOpenFamilyTabs = payload => dispatch => dispatch({
  payload,
  type: SET_OPEN_FAMILY_TABS,
});

export const pushOpenFamilyTab = payload => dispatch => dispatch({
  payload,
  type: PUSH_OPEN_FAMILY_TAB,
});

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  openFamilyTabs: [true, true, true, true, true],
};

export default (state = INITIAL_STATE, action) => (
  produce(state, draft => {
    if (action.type === SET_OPEN_FAMILY_TABS) {
      draft.openFamilyTabs[action.payload.index] = action.payload.state;
    } else if (action.type === PUSH_OPEN_FAMILY_TAB) {
      draft.openFamilyTabs = state.openFamilyTabs.concat(true);
    }
  })
);