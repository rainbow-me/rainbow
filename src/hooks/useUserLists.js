import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  userListsClearList,
  userListsSetSelectedList,
  userListsUpdateList,
} from '../redux/userLists';

const userListsSelector = state => state.userLists.lists;
const userListsReadySelector = state => state.userLists.ready;
const userListsSelectedListSelector = state => state.userLists.selectedList;
const uniswapFavoritesSelector = state => state.uniswap.favorites;

export default function useUserLists() {
  const dispatch = useDispatch();
  const lists = useSelector(userListsSelector);
  const ready = useSelector(userListsReadySelector);
  const selectedList = useSelector(userListsSelectedListSelector);
  const favorites = useSelector(uniswapFavoritesSelector);

  const updateList = useCallback(
    (...data) => dispatch(userListsUpdateList(...data)),
    [dispatch]
  );
  const clearList = useCallback(
    listId => dispatch(userListsClearList(listId)),
    [dispatch]
  );
  const setSelectedList = useCallback(
    listId => dispatch(userListsSetSelectedList(listId)),
    [dispatch]
  );

  return {
    clearList,
    favorites,
    lists,
    ready,
    selectedList,
    setSelectedList,
    updateList,
  };
}
