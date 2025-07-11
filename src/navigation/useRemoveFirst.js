import { Navigation } from '@/navigation';

export function useRemoveFirst() {
  return () =>
    Navigation.dispatch({
      type: '@RAINBOW/REMOVE_FIRST',
    });
}
