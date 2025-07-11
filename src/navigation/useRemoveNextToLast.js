import { Navigation } from '@/navigation';

export function useRemoveNextToLast() {
  return () =>
    Navigation.dispatch({
      type: '@RAINBOW/REMOVE_NEXT_TO_LAST',
    });
}
