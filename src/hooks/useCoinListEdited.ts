import { atom, useRecoilState } from 'recoil';

const isCoinListEditedAtom = atom({
  default: false,
  key: 'isCoinListEditedAtom',
});

export default function useCoinListEdited() {
  const [isCoinListEdited, setIsCoinListEdited] = useRecoilState(isCoinListEditedAtom);

  return {
    isCoinListEdited,
    setIsCoinListEdited,
  };
}
