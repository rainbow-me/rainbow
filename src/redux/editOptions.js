import produce from 'immer';
import { concat, difference, filter, union, without } from 'lodash';
import { Value } from 'react-native-reanimated';
import {
  getHiddenCoins,
  getPinnedCoins,
  saveHiddenCoins,
  savePinnedCoins,
} from '../handlers/localstorage/accountLocal';
import EditOptions from '../helpers/editOptionTypes';

// -- Constants --------------------------------------- //
const COIN_LIST_OPTIONS_LOAD_SUCCESS =
  'editOptions/COIN_LIST_OPTIONS_LOAD_SUCCESS';
const COIN_LIST_OPTIONS_LOAD_FAILURE =
  'editOptions/COIN_LIST_OPTIONS_LOAD_FAILURE';
const SET_IS_COIN_LIST_EDITED = 'editOptions/SET_IS_COIN_LIST_EDITED';
const SET_PINNED_COINS = 'editOptions/SET_PINNED_COINS';
const SET_HIDDEN_COINS = 'editOptions/SET_HIDDEN_COINS';
const UPDATE_SELECTED_COIN = 'editOptions/UPDATE_SELECTED_COIN';

// -- Actions --------------------------------------------------------------- //
export const coinListLoadState = () => async (dispatch, getState) => {
  try {
    const { accountAddress, network } = getState().settings;
    const hiddenCoins = await getHiddenCoins(accountAddress, network);
    const pinnedCoins = await getPinnedCoins(accountAddress, network);

    dispatch({
      payload: {
        hiddenCoins,
        pinnedCoins,
      },
      type: COIN_LIST_OPTIONS_LOAD_SUCCESS,
    });
  } catch (error) {
    dispatch({ type: COIN_LIST_OPTIONS_LOAD_FAILURE });
  }
};

export const setIsCoinListEdited = newIsCoinListEdited => (
  dispatch,
  getState
) => {
  const { currentAction, selectedCoins } = getState().editOptions;

  dispatch({
    payload: {
      currentAction: !newIsCoinListEdited ? EditOptions.none : currentAction,
      isCoinListEdited: newIsCoinListEdited,
      selectedCoins: !newIsCoinListEdited ? [] : selectedCoins,
    },
    type: SET_IS_COIN_LIST_EDITED,
  });
};

export const clearSelectedCoins = () => dispatch =>
  dispatch(updateCurrentAction([]));

export const pushSelectedCoin = selectedCoin => (dispatch, getState) => {
  const { selectedCoins } = getState().editOptions;
  const updatedSelectedCoins = concat(selectedCoins, selectedCoin);
  dispatch(updateCurrentAction(updatedSelectedCoins));
};

export const removeSelectedCoin = selectedCoin => (dispatch, getState) => {
  const { selectedCoins } = getState().editOptions;
  const updatedSelectedCoins = filter(
    selectedCoins,
    coin => coin !== selectedCoin
  );
  dispatch(updateCurrentAction(updatedSelectedCoins));
};

const updateCurrentAction = newSelectedCoins => (dispatch, getState) => {
  const { currentAction, hiddenCoins, pinnedCoins } = getState().editOptions;
  const newSelectedCoinsLength = newSelectedCoins.length;
  let newCurrentAction = currentAction;

  if (newSelectedCoinsLength === 0) {
    newCurrentAction = EditOptions.none;
  } else if (
    newSelectedCoinsLength > 0 &&
    difference(hiddenCoins, newSelectedCoins).length ===
      hiddenCoins.length - newSelectedCoinsLength
  ) {
    newCurrentAction = EditOptions.unhide;
  } else if (
    newSelectedCoinsLength > 0 &&
    difference(pinnedCoins, newSelectedCoins).length ===
      pinnedCoins.length - newSelectedCoinsLength
  ) {
    newCurrentAction = EditOptions.unpin;
  } else {
    newCurrentAction = EditOptions.standard;
  }
  dispatch({
    payload: {
      currentAction: newCurrentAction,
      selectedCoins: newSelectedCoins,
    },
    type: UPDATE_SELECTED_COIN,
  });
};

export const setPinnedCoins = () => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  const {
    currentAction,
    hiddenCoins,
    pinnedCoins,
    recentlyPinnedCount,
    selectedCoins,
  } = getState().editOptions;
  let updatedHiddenCoins = hiddenCoins;
  let updatedPinnedCoins = pinnedCoins;

  if (
    currentAction === EditOptions.standard ||
    currentAction === EditOptions.unhide
  ) {
    updatedHiddenCoins = without(hiddenCoins, ...selectedCoins);
    saveHiddenCoins(updatedHiddenCoins, accountAddress, network);
    updatedPinnedCoins = union(selectedCoins, pinnedCoins);
  } else if (currentAction === EditOptions.unpin) {
    updatedPinnedCoins = without(pinnedCoins, ...selectedCoins);
  }
  savePinnedCoins(updatedPinnedCoins, accountAddress, network);

  dispatch({
    payload: {
      currentAction: EditOptions.none,
      hiddenCoins: updatedHiddenCoins,
      pinnedCoins: updatedPinnedCoins,
      recentlyPinnedCount: recentlyPinnedCount + 1,
      selectedCoins: [],
    },
    type: SET_PINNED_COINS,
  });
};

export const setHiddenCoins = () => (dispatch, getState) => {
  const { accountAddress, network } = getState().settings;
  const {
    currentAction,
    hiddenCoins,
    pinnedCoins,
    recentlyPinnedCount,
    selectedCoins,
  } = getState().editOptions;
  let updatedPinnedCoins = pinnedCoins;
  let updatedHiddenCoins = hiddenCoins;
  if (
    currentAction === EditOptions.standard ||
    currentAction === EditOptions.unpin
  ) {
    updatedPinnedCoins = without(pinnedCoins, ...selectedCoins);
    savePinnedCoins(updatedPinnedCoins, accountAddress, network);
    updatedHiddenCoins = union(selectedCoins, hiddenCoins);
  } else if (currentAction === EditOptions.unhide) {
    updatedHiddenCoins = without(hiddenCoins, ...selectedCoins);
  }
  saveHiddenCoins(updatedHiddenCoins, accountAddress, network);
  dispatch({
    payload: {
      currentAction: EditOptions.none,
      hiddenCoins: updatedHiddenCoins,
      pinnedCoins: updatedPinnedCoins,
      recentlyPinnedCount: recentlyPinnedCount + 1,
      selectedCoins: [],
    },
    type: SET_HIDDEN_COINS,
  });
};

// -- Reducer ----------------------------------------- //
const INITIAL_STATE = {
  currentAction: EditOptions.none,
  hiddenCoins: [],
  isCoinListEdited: false,
  isCoinListEditedValue: new Value(0),
  pinnedCoins: ['eth'],
  recentlyPinnedCount: 0,
  selectedCoins: [],
};

export default (state = INITIAL_STATE, action) =>
  produce(state, draft => {
    if (action.type === COIN_LIST_OPTIONS_LOAD_SUCCESS) {
      draft.pinnedCoins = action.payload.pinnedCoins;
      draft.hiddenCoins = action.payload.hiddenCoins;
    } else if (action.type === SET_IS_COIN_LIST_EDITED) {
      draft.currentAction = action.payload.currentAction;
      draft.isCoinListEdited = action.payload.isCoinListEdited;
      draft.isCoinListEditedValue.setValue(
        action.payload.isCoinListEdited ? 1 : 0
      );
      draft.selectedCoins = action.payload.selectedCoins;
    } else if (action.type === UPDATE_SELECTED_COIN) {
      draft.selectedCoins = action.payload.selectedCoins;
      draft.currentAction = action.payload.currentAction;
    } else if (action.type === SET_PINNED_COINS) {
      draft.currentAction = action.payload.currentAction;
      draft.hiddenCoins = action.payload.hiddenCoins;
      draft.pinnedCoins = action.payload.pinnedCoins;
      draft.recentlyPinnedCount = action.payload.recentlyPinnedCount;
      draft.selectedCoins = action.payload.selectedCoins;
    } else if (action.type === SET_HIDDEN_COINS) {
      draft.currentAction = action.payload.currentAction;
      draft.hiddenCoins = action.payload.hiddenCoins;
      draft.pinnedCoins = action.payload.pinnedCoins;
      draft.recentlyPinnedCount = action.payload.recentlyPinnedCount;
      draft.selectedCoins = action.payload.selectedCoins;
    }
  });
