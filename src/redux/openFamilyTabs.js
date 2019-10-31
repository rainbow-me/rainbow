import produce from 'immer';
import { saveOpenFamilies } from '../handlers/localstorage/accountLocal';

// -- Constants --------------------------------------- //
const CLEAR_OPEN_FAMILY_TAB = 'openFamilyTabs/CLEAR_OPEN_FAMILY_TAB';
const PUSH_OPEN_FAMILY_TAB = 'openFamilyTabs/PUSH_OPEN_FAMILY_TAB';
const SET_OPEN_FAMILY_TABS = 'openFamilyTabs/SET_OPEN_FAMILY_TABS';

export const clearOpenFamilyTab = () => dispatch =>
  dispatch({
    type: CLEAR_OPEN_FAMILY_TAB,
  });

export const pushOpenFamilyTab = payload => dispatch =>
  dispatch({
    payload,
    type: PUSH_OPEN_FAMILY_TAB,
  });

export const setOpenFamilyTabs = payload => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  const { openFamilyTabs } = getState().openFamilyTabs;
  const updatedFamilyTabs = {
    ...openFamilyTabs,
    [payload.index]: payload.state,
  };
  saveOpenFamilies(updatedFamilyTabs, accountAddress, network);
  dispatch({
    payload: updatedFamilyTabs,
    type: SET_OPEN_FAMILY_TABS,
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  openFamilyTabs: {},
};

export default (state = INITIAL_STATE, action) =>
  produce(state, draft => {
    if (action.type === SET_OPEN_FAMILY_TABS) {
      draft.openFamilyTabs = action.payload;
    } else if (action.type === PUSH_OPEN_FAMILY_TAB) {
      draft.openFamilyTabs = action.payload;
    } else if (action.type === CLEAR_OPEN_FAMILY_TAB) {
      return INITIAL_STATE;
    }
  });
