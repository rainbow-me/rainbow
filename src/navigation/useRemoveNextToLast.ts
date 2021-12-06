// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';

export function useRemoveNextToLast() {
  const { dispatch } = useNavigation();
  return () =>
    dispatch({
      type: '@RAINBOW/REMOVE_NEXT_TO_LAST',
    });
}
