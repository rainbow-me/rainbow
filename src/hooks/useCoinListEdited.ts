import { useCoinListEditStore } from '@/state/coinListEdit/coinListEdit';

export default function useCoinListEdited() {
  const isCoinListEdited = useCoinListEditStore(state => state.isCoinListEdited);
  const setIsCoinListEdited = useCoinListEditStore(state => state.setIsCoinListEdited);

  return {
    isCoinListEdited,
    setIsCoinListEdited,
  };
}
