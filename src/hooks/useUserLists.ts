import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  userListsClearList,
  userListsSetSelectedList,
  userListsUpdateList,
} from '../redux/userLists';

const userListsSelector = (state: any) => state.userLists.lists;
const userListsReadySelector = (state: any) => state.userLists.ready;
const userListsSelectedListSelector = (state: any) =>
  state.userLists.selectedList;
const uniswapFavoritesSelector = (state: any) => state.uniswap.favorites;

export default function useUserLists() {
  const dispatch = useDispatch();
  const lists = useSelector(userListsSelector);
  const ready = useSelector(userListsReadySelector);
  const selectedList = useSelector(userListsSelectedListSelector);
  const favorites = useSelector(uniswapFavoritesSelector);

  const updateList = useCallback(
    // @ts-expect-error ts-migrate(2556) FIXME: Expected 2-3 arguments, but got 0 or more.
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
