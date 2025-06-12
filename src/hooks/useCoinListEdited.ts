import { useCoinListEditStore, setIsCoinListEdited as setIsCoinListEditedAction } from '@/state/coinListEdit/coinListEdit';

export default function useCoinListEdited() {
  const isCoinListEdited = useCoinListEditStore(state => state.isCoinListEdited);

  return {
    isCoinListEdited,
    setIsCoinListEdited: setIsCoinListEditedAction,
  };
}
