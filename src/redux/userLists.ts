import produce from 'immer';
import { concat, isArray, uniq, without } from 'lodash';
import { InteractionManager } from 'react-native';
import {
  getSelectedUserList,
  getUserLists,
  saveSelectedUserList,
  saveUserLists,
} from '../handlers/localstorage/userLists';
import { Network } from '../helpers/networkTypes';
import { DefaultTokenLists } from '../references';
import { emitAssetRequest } from './explorer';
import { AppDispatch, AppState } from './store';
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

/**
 * A single user list, based on the data found in `DefaultTokenLists`.
 */
export interface UserList {
  emoji: string;
  id: string;
  name: string;
  tokens: string[];
}

/**
 * The current `userLists` state.
 */
interface UserListsState {
  lists: UserList[];
  loadingUserLists: boolean;
  ready: boolean;
  selectedList: string | null;
}

/**
 * A `userLists` Redux action.
 */
type UserListsAction =
  | UserListsLoadRequestAction
  | UserListsLoadSuccessAction
  | UserListsSetSelectedListAction
  | UserListsUpdateListsAction
  | UserListsFailureAction
  | UserListsReadyAction
  | UserListsClearStateAction;

interface UserListsLoadRequestAction {
  type: typeof USER_LISTS_LOAD_REQUEST;
}

interface UserListsLoadSuccessAction {
  type: typeof USER_LISTS_LOAD_SUCCESS;
  payload: {
    lists: UserList[];
  };
}

interface UserListsSetSelectedListAction {
  type: typeof USER_LISTS_SET_SELECTED_LIST;
  payload: string;
}

interface UserListsUpdateListsAction {
  type: typeof USER_LISTS_UPDATE_LISTS;
  payload: UserList[];
}

interface UserListsFailureAction {
  type: typeof USER_LISTS_LOAD_FAILURE;
}

interface UserListsReadyAction {
  type: typeof USER_LISTS_READY;
}

interface UserListsClearStateAction {
  type: typeof USER_LISTS_CLEAR_STATE;
}

export const userListsLoadState = () => async (
  dispatch: AppDispatch,
  getState: () => AppState
) => {
  const { network } = getState().settings;

  dispatch({ type: USER_LISTS_LOAD_REQUEST });
  try {
    const defaultLists =
      (DefaultTokenLists as Record<
        Network,
        typeof DefaultTokenLists[keyof typeof DefaultTokenLists]
      >)[network] || [];
    const userLists: UserList[] = await getUserLists();
    const lists = userLists?.length ? userLists : defaultLists;
    let allAddresses: string[] = [];
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

export const userListsSetSelectedList = (
  listId: string,
  save: boolean = true
) => (dispatch: AppDispatch) => {
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

export const userListsClearList = (listId: string) => (
  dispatch: AppDispatch,
  getState: () => AppState
) => {
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
  if (listIndex) {
    const newList = { ...allNewLists[listIndex] };
    newList.tokens = [];
    allNewLists[listIndex] = newList;
  }

  dispatch({
    payload: allNewLists,
    type: USER_LISTS_UPDATE_LISTS,
  });
  saveUserLists(allNewLists);
};

export const userListsUpdateList = (
  assetAddress: string,
  listId: string,
  add = true
) => (dispatch: AppDispatch, getState: () => AppState) => {
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
    if (listIndex) {
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
    }

    dispatch({
      payload: allNewLists,
      type: USER_LISTS_UPDATE_LISTS,
    });
    saveUserLists(allNewLists);
  }
};

// -- Reducer --------------------------------------------------------------- //
export const INITIAL_USER_LISTS_STATE: UserListsState = {
  lists: [],
  loadingUserLists: false,
  ready: false,
  selectedList: null,
};

export default (state = INITIAL_USER_LISTS_STATE, action: UserListsAction) =>
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
