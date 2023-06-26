import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  userListsClearList,
  userListsSetSelectedList,
  userListsUpdateList,
} from '../redux/userLists';
import { AppState } from '@/redux/store';

const userListsSelector = (state: AppState) => state.userLists.lists;
const userListsReadySelector = (state: AppState) => state.userLists.ready;
const userListsSelectedListSelector = (state: AppState) =>
  state.userLists.selectedList;
const uniswapFavoritesSelector = (state: AppState) => state.uniswap.favorites;

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
    (listId: string) => dispatch(userListsClearList(listId)),
    [dispatch]
  );
  const setSelectedList = useCallback(
    (listId: string) => dispatch(userListsSetSelectedList(listId)),
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
