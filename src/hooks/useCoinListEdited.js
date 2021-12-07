import { atom, useAtom } from 'jotai';

const isCoinListEditedAtom = atom(false);

export default function useCoinListEdited() {
  const [isCoinListEdited, setIsCoinListEdited] = useAtom(isCoinListEditedAtom);

  return {
    isCoinListEdited,
    setIsCoinListEdited,
  };
}
