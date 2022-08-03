import { useNavigation } from '@rainbow-me/navigation';

export function useRemoveFirst() {
  const { dispatch } = useNavigation();
  return () =>
    dispatch({
      type: '@RAINBOW/REMOVE_FIRST',
    });
}
