import { useSelector } from 'react-redux';

export default function useCoinListEdited() {
  return useSelector(({ editOptions: { isCoinListEdited } }) => ({
    isCoinListEdited,
  }));
}

export function useCoinListEditedValue() {
  return useSelector(
    ({ editOptions: { isCoinListEditedValue } }) => isCoinListEditedValue
  );
}
