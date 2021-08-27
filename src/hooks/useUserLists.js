import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  userListsClearList,
  userListsSetSelectedList,
  userListsUpdateList,
} from '../redux/userLists';

const userListsSelector = state => state.userLists.lists;
const userListsReadySelector = state => state.userLists.ready;
const userListsSelectedListSelector = state => state.userLists.selectedList;

export default function useUserLists() {
  const dispatch = useDispatch();
  const lists = useSelector(userListsSelector);
  const ready = useSelector(userListsReadySelector);
  const selectedList = useSelector(userListsSelectedListSelector);
  const { favorites, allTokens } = useSelector(({ uniswap }) => uniswap);

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

  const sortedFavorites = useMemo(() => {
    const sorted = favorites
      .map(address => allTokens[address])
      .sort((a, b) => (a.name > b.name ? 1 : -1))
      .map(token => token?.address || null);
    return sorted;
  }, [favorites, allTokens]);

  return {
    clearList,
    favorites: sortedFavorites,
    lists,
    ready,
    selectedList,
    setSelectedList,
    updateList,
  };
}
