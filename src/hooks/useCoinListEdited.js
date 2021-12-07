import { atom, useAtom } from 'jotai';

const countAtom = atom(false);

export default function useCoinListEdited() {
  const [isCoinListEdited, setIsCoinListEdited] = useAtom(countAtom);

  return {
    isCoinListEdited,
    setIsCoinListEdited,
  };
}
