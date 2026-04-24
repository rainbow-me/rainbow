import { useMemo } from 'react';

import { useNavigationState } from '@react-navigation/native';

export default function useRouteExistsInNavigationState(routeName: string) {
  const routes = useNavigationState(state => state.routes);
  return useMemo(() => routes.find(route => route.name === routeName), [routeName, routes]);
}
