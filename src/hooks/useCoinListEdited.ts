import { useSelector } from 'react-redux';

export default function useCoinListEdited() {
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'editOptions' does not exist on type 'Def... Remove this comment to see the full error message
  return useSelector(({ editOptions: { isCoinListEdited } }) => ({
    isCoinListEdited,
  }));
}

export function useCoinListEditedValue() {
  return useSelector(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'editOptions' does not exist on type 'Def... Remove this comment to see the full error message
    ({ editOptions: { isCoinListEditedValue } }) => isCoinListEditedValue
  );
}
