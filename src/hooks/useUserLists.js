import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { userListsClearList, userListsUpdateList } from '../redux/userLists';
import useUniswapAssets from './useUniswapAssets';

const userListsSelector = state => state.userLists.lists;
const userListsReadySelector = state => state.userLists.ready;

export default function useUSerLists() {
  const dispatch = useDispatch();
  const lists = useSelector(userListsSelector);
  const ready = useSelector(userListsReadySelector);

  const { favorites } = useUniswapAssets();
  const updateList = useCallback(
    (...data) => dispatch(userListsUpdateList(...data)),
    [dispatch]
  );
  const clearList = useCallback(
    listId => dispatch(userListsClearList(listId)),
    [dispatch]
  );

  return {
    clearList,
    favorites,
    lists,
    ready,
    updateList,
  };
}
