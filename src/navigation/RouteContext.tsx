import { createContext, useContext } from 'react';

import { useRoute as useReactNavigationRoute, type RouteProp } from '@react-navigation/native';

import { type Route } from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';

export type UseRouteHook = {
  <RouteName extends Route = Route>(): RouteProp<RootStackParamList, RouteName>;
  (): RouteProp<RootStackParamList, Route>;
};

const UseRouteContext = createContext<UseRouteHook>(useDefaultUseRoute);

export const UseRouteProvider = UseRouteContext.Provider;

export function useRoute<RouteName extends Route = Route>(): RouteProp<RootStackParamList, RouteName> {
  const useRouteHook = useContext(UseRouteContext);
  return useRouteHook();
}

function useDefaultUseRoute<RouteName extends Route = Route>(): RouteProp<RootStackParamList, RouteName> {
  return useReactNavigationRoute<RouteProp<RootStackParamList, RouteName>>();
}
