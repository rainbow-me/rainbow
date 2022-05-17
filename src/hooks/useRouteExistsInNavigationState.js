import { useNavigationState } from '@react-navigation/native';
import { useMemo } from 'react';

export default function useRouteExistsInNavigationState(routeName) {
  const routes = useNavigationState(state => state.routes);
  return useMemo(() => routes.find(i => i.name === routeName), [
    routeName,
    routes,
  ]);
}
