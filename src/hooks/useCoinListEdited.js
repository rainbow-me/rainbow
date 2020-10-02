import { useSelector } from '@rainbow-me/react-redux';

export default function useCoinListEdited() {
  return useSelector(({ editOptions: { isCoinListEdited } }) => ({
    isCoinListEdited,
  }));
}
