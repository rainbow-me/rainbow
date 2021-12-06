import { useNavigation } from '@rainbow-me/navigation';

export function useRemoveNextToLast() {
  const { dispatch } = useNavigation();
  return () =>
    dispatch({
      type: '@RAINBOW/REMOVE_NEXT_TO_LAST',
    });
}
