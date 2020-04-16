import { useSelector } from 'react-redux';
import {
  pushSelectedCoin,
  removeSelectedCoin,
  setHiddenCoins,
  setIsCoinListEdited,
  setPinnedCoins,
} from '../redux/editOptions';

export default function useCoinListEditOptions() {
  const editData = useSelector(
    ({
      editOptions: {
        currentAction,
        hiddenCoins,
        isCoinListEdited,
        pinnedCoins,
      },
    }) => ({
      currentAction,
      hiddenCoins,
      isCoinListEdited,
      pinnedCoins,
    })
  );

  return {
    pushSelectedCoin,
    removeSelectedCoin,
    setHiddenCoins,
    setIsCoinListEdited,
    setPinnedCoins,
    ...editData,
  };
}
