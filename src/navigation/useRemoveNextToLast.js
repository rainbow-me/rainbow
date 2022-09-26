import { useNavigation } from '@/navigation';

export function useRemoveNextToLast() {
  const { dispatch } = useNavigation();
  return () =>
    dispatch({
      type: '@RAINBOW/REMOVE_NEXT_TO_LAST',
    });
}
