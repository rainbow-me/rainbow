import { useNavigation } from '@/navigation/Navigation';

export function useRemoveFirst() {
  const { dispatch } = useNavigation();
  return () =>
    dispatch({
      type: '@RAINBOW/REMOVE_FIRST',
    });
}
