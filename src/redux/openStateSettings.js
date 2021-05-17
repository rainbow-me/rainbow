import produce from 'immer';
import {
  getOpenFamilies,
  getOpenInvestmentCards,
  getSavingsToggle,
  saveOpenFamilies,
  saveOpenInvestmentCards,
  saveSavingsToggle,
} from '../handlers/localstorage/accountLocal';

// -- Constants ------------------------------------------------------------- //
const OPEN_STATE_SETTINGS_LOAD_SUCCESS =
  'openStateSettings/OPEN_STATE_SETTINGS_LOAD_SUCCESS';
const OPEN_STATE_SETTINGS_LOAD_FAILURE =
  'openStateSettings/OPEN_STATE_SETTINGS_LOAD_FAILURE';
const CLEAR_OPEN_STATE_SETTINGS = 'openStateSettings/CLEAR_OPEN_STATE_SETTINGS';
const PUSH_OPEN_FAMILY_TAB = 'openStateSettings/PUSH_OPEN_FAMILY_TAB';
const SET_OPEN_FAMILY_TABS = 'openStateSettings/SET_OPEN_FAMILY_TABS';
const SET_OPEN_SAVINGS = 'openStateSettings/SET_OPEN_SAVINGS';
const SET_OPEN_SMALL_BALANCES = 'openStateSettings/SET_OPEN_SMALL_BALANCES';
const REMOVE_SHOWCASE = 'openStateSettings/REMOVE_SHOWCASE';
const SET_OPEN_INVESTMENT_CARDS = 'openStateSettings/SET_OPEN_INVESTMENT_CARDS';

// -- Actions --------------------------------------------------------------- //
export const openStateSettingsLoadState = () => async (dispatch, getState) => {
  try {
    const { accountAddress, network } = getState().settings;
    const openInvestmentCards = await getOpenInvestmentCards(
      accountAddress,
      network
    );
    const openFamilyTabs = await getOpenFamilies(accountAddress, network);
    const openSavings = await getSavingsToggle(accountAddress, network);
    dispatch({
      payload: {
        openFamilyTabs,
        openInvestmentCards,
        openSavings,
      },
      type: OPEN_STATE_SETTINGS_LOAD_SUCCESS,
    });
  } catch (error) {
    dispatch({ type: OPEN_STATE_SETTINGS_LOAD_FAILURE });
  }
};

export const setOpenSavings = payload => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  saveSavingsToggle(payload, accountAddress, network);
  dispatch({
    payload,
    type: SET_OPEN_SAVINGS,
  });
};

export const setOpenSmallBalances = payload => dispatch =>
  dispatch({
    payload,
    type: SET_OPEN_SMALL_BALANCES,
  });

export const removeShowcase = dispatch =>
  dispatch({
    type: REMOVE_SHOWCASE,
  });

export const pushOpenFamilyTab = payload => dispatch =>
  dispatch({
    payload,
    type: PUSH_OPEN_FAMILY_TAB,
  });

export const setOpenFamilyTabs = payload => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  const { openFamilyTabs } = getState().openStateSettings;
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

export const setOpenInvestmentCards = payload => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  saveOpenInvestmentCards(payload, accountAddress, network);
  dispatch({
    payload,
    type: SET_OPEN_INVESTMENT_CARDS,
  });
};

export const resetOpenStateSettings = () => dispatch =>
  dispatch({
    type: CLEAR_OPEN_STATE_SETTINGS,
  });

// -- Reducer --------------------------------------------------------------- //
export const INITIAL_STATE = {
  openFamilyTabs: {},
  openInvestmentCards: {},
  openSavings: false,
  openSmallBalances: false,
};

function removeShowcaseFromDictionary(input) {
  return Object.keys(input).reduce((acc, curr) => {
    if (!curr.endsWith('-showcase')) {
      acc[curr] = input[curr];
    }
    return acc;
  }, {});
}

export default (state = INITIAL_STATE, action) =>
  produce(state, draft => {
    if (action.type === OPEN_STATE_SETTINGS_LOAD_SUCCESS) {
      draft.openFamilyTabs = action.payload.openFamilyTabs;
      draft.openInvestmentCards = action.payload.openInvestmentCards;
      draft.openSavings = action.payload.openSavings;
    } else if (action.type === SET_OPEN_FAMILY_TABS) {
      draft.openFamilyTabs = action.payload;
    } else if (action.type === REMOVE_SHOWCASE) {
      draft.openFamilyTabs = removeShowcaseFromDictionary(draft.openFamilyTabs);
    } else if (action.type === PUSH_OPEN_FAMILY_TAB) {
      draft.openFamilyTabs = action.payload;
    } else if (action.type === SET_OPEN_INVESTMENT_CARDS) {
      draft.openInvestmentCards = action.payload;
    } else if (action.type === SET_OPEN_SAVINGS) {
      draft.openSavings = action.payload;
    } else if (action.type === SET_OPEN_SMALL_BALANCES) {
      draft.openSmallBalances = action.payload;
    } else if (action.type === CLEAR_OPEN_STATE_SETTINGS) {
      return INITIAL_STATE;
    }
  });
