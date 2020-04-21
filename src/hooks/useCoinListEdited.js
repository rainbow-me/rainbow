import { useSelector } from 'react-redux';

export default function useCoinListEditOptions() {
  return useSelector(({ editOptions: { isCoinListEdited } }) => ({
    isCoinListEdited,
  }));
}
