import { useRoute } from '@/navigation/Navigation';
import { useListen } from '@/state/internal/hooks/useListen';
import { useNavigationStore } from '@/state/navigation/navigationStore';

/**
 * A lightweight hook that fires a callback when the route
 * it is mounted on is departed. Uses `useListen` internally.
 *
 * @param onLeaveRoute - Callback to fire when the route is departed.
 */
export function useOnLeaveRoute(onLeaveRoute: () => void): void {
  const route = useRoute().name;
  useListen(
    useNavigationStore,
    state => state.isRouteActive(route),
    isActiveRoute => {
      if (!isActiveRoute) onLeaveRoute();
    }
  );
}
