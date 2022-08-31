import { useNavigation } from '@/navigation';

export function useRemoveFirst() {
  const { dispatch } = useNavigation();
  return () =>
    dispatch({
      type: '@RAINBOW/REMOVE_FIRST',
    });
}
