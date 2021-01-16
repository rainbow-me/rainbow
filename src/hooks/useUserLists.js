import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { userListsClearList, userListsUpdateList } from '../redux/userLists';
import useUniswapAssets from './useUniswapAssets';

const userListsSelector = state => state.userLists.lists;

export default function useUSerLists() {
  const dispatch = useDispatch();
  const lists = useSelector(userListsSelector);

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
    updateList,
  };
}
