import produce from 'immer';
import { concat, isArray, uniq, without } from 'lodash';
import { InteractionManager } from 'react-native';
import {
  getSelectedUserList,
  getUserLists,
  saveSelectedUserList,
  saveUserLists,
} from '../handlers/localstorage/userLists';
import { DefaultTokenLists } from '../references';
import { emitAssetRequest } from './explorer';
import { uniswapUpdateFavorites } from './uniswap';

// -- Constants ------------------------------------------------------------- //
const USER_LISTS_READY = 'userLists/USER_LISTS_READY';
const USER_LISTS_LOAD_REQUEST = 'userLists/USER_LISTS_LOAD_REQUEST';
const USER_LISTS_LOAD_SUCCESS = 'userLists/USER_LISTS_LOAD_SUCCESS';
const USER_LISTS_LOAD_FAILURE = 'userLists/USER_LISTS_LOAD_FAILURE';

const USER_LISTS_UPDATE_LISTS = 'userLists/USER_LISTS_UPDATE_LISTS';
const USER_LISTS_CLEAR_STATE = 'userLists/USER_LISTS_CLEAR_STATE';
const USER_LISTS_SET_SELECTED_LIST = 'userLists/USER_LISTS_SET_SELECTED_LIST';
const FAVORITES_LIST_ID = 'favorites';
// -- Actions --------------------------------------------------------------- //
export const userListsLoadState = () => async (dispatch, getState) => {
  const { network } = getState().settings;

  dispatch({ type: USER_LISTS_LOAD_REQUEST });
  try {
    const defaultLists = DefaultTokenLists[network] || [];
    const userLists = await getUserLists(network);
    const lists = userLists?.length ? userLists : defaultLists;
    let allAddresses = [];
    lists.forEach(list => {
      allAddresses = [...allAddresses, ...list.tokens];
    });

    dispatch({
      payload: { lists },
      type: USER_LISTS_LOAD_SUCCESS,
    });
    const selectedUserList = (await getSelectedUserList()) || FAVORITES_LIST_ID;
    dispatch(userListsSetSelectedList(selectedUserList, false));

    // Wait until the socket is ready
    setTimeout(() => {
      dispatch(emitAssetRequest(allAddresses));
      dispatch({
        payload: true,
        type: USER_LISTS_READY,
      });
    }, 3000);
  } catch (error) {
    dispatch({ type: USER_LISTS_LOAD_FAILURE });
  }
};

export const userListsSetSelectedList = (listId, save = true) => dispatch => {
  dispatch({
    payload: listId,
    type: USER_LISTS_SET_SELECTED_LIST,
  });
  if (save) {
    InteractionManager.runAfterInteractions(() => {
      saveSelectedUserList(listId);
    });
  }
};

export const userListsClearList = listId => (dispatch, getState) => {
  const { lists } = getState().userLists;
  const allNewLists = [...lists];

  // Find the list index
  let listIndex = null;
  allNewLists.find((list, index) => {
    if (list?.id === listId) {
      listIndex = index;
      return true;
    }
    return false;
  });

  // update the list
  const newList = { ...allNewLists[listIndex] };
  newList.tokens = [];
  allNewLists[listIndex] = newList;

  dispatch({
    payload: allNewLists,
    type: USER_LISTS_UPDATE_LISTS,
  });
  saveUserLists(allNewLists);
};

export const userListsUpdateList = (assetAddress, listId, add = true) => (
  dispatch,
  getState
) => {
  if (listId === FAVORITES_LIST_ID) {
    dispatch(uniswapUpdateFavorites(assetAddress, add));
  } else {
    const { lists } = getState().userLists;
    const allNewLists = [...lists];

    // Find the list index
    let listIndex = null;
    allNewLists.find((list, index) => {
      if (list?.id === listId) {
        listIndex = index;
        return true;
      }
      return false;
    });

    // add or remove
    const updatedListTokens = add
      ? uniq(concat(allNewLists[listIndex].tokens, assetAddress))
      : isArray(assetAddress)
      ? without(allNewLists[listIndex].tokens, ...assetAddress)
      : without(allNewLists[listIndex].tokens, assetAddress);
    if (add) {
      dispatch(emitAssetRequest(assetAddress));
    }

    // update the list
    const newList = { ...allNewLists[listIndex] };
    newList.tokens = updatedListTokens;
    allNewLists[listIndex] = newList;

    dispatch({
      payload: allNewLists,
      type: USER_LISTS_UPDATE_LISTS,
    });
    saveUserLists(allNewLists);
  }
};

// -- Reducer --------------------------------------------------------------- //
export const INITIAL_USER_LISTS_STATE = {
  lists: [],
  loadingUserLists: false,
  ready: false,
  selectedList: null,
};

export default (state = INITIAL_USER_LISTS_STATE, action) =>
  produce(state, draft => {
    switch (action.type) {
      case USER_LISTS_LOAD_REQUEST:
        draft.loadingUserLists = true;
        break;
      case USER_LISTS_LOAD_SUCCESS:
        draft.lists = action.payload.lists;
        draft.loadingUserLists = false;
        break;
      case USER_LISTS_SET_SELECTED_LIST:
        draft.selectedList = action.payload;
        break;
      case USER_LISTS_UPDATE_LISTS:
        draft.lists = action.payload;
        break;
      case USER_LISTS_LOAD_FAILURE:
        draft.loadingUserLists = false;
        break;
      case USER_LISTS_READY:
        draft.ready = true;
        break;
      case USER_LISTS_CLEAR_STATE:
        return INITIAL_USER_LISTS_STATE;
      default:
        break;
    }
  });
