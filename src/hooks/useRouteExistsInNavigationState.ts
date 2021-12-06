import { useNavigationState } from '@react-navigation/native';
import { find, matchesProperty } from 'lodash';
import { useMemo } from 'react';

export default function useRouteExistsInNavigationState(routeName) {
  const routes = useNavigationState(state => state.routes);
  return useMemo(() => find(routes, matchesProperty('name', routeName)), [
    routeName,
    routes,
  ]);
}
