import { useSelector } from 'react-redux';

export default function useCoinListEdited() {
  return useSelector(({ editOptions: { isCoinListEdited } }) => ({
    isCoinListEdited,
  }));
}
