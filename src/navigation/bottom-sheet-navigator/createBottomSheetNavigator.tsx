import React, { useMemo } from 'react';
import {
  DefaultNavigatorOptions,
  ParamListBase,
  StackActionHelpers,
  StackNavigationState,
  StackRouter,
  StackRouterOptions,
  createNavigatorFactory,
  useNavigationBuilder,
} from '@react-navigation/native';

export type BottomNavigationOptions = {
  root?: boolean;
};
export type BottomNavigationEventMap = Record<string, never>;

type Props = DefaultNavigatorOptions<
  ParamListBase,
  StackNavigationState<ParamListBase>,
  BottomNavigationOptions,
  BottomNavigationEventMap
>;

function BottomSheetNavigator({
  id,
  initialRouteName,
  children,
  screenListeners,
  screenOptions,
}: Props) {
  const { state, descriptors, NavigationContent } = useNavigationBuilder<
    StackNavigationState<ParamListBase>,
    StackRouterOptions,
    StackActionHelpers<ParamListBase>,
    BottomNavigationOptions,
    BottomNavigationEventMap
  >(StackRouter, {
    id,
    initialRouteName,
    children,
    screenListeners,
    screenOptions,
  });

  const rootKey = useMemo(
    () => Object.keys(descriptors).find(key => descriptors[key].options.root),
    [descriptors]
  );

  if (!rootKey) {
    throw new Error('Bottom Sheet Navigator needs a root screen');
  }

  const sheetRoutes = useMemo(
    () => state.routes.filter(r => r.key !== rootKey),
    [state, rootKey]
  );

  return (
    <NavigationContent>
      {descriptors[rootKey].render()}
      {sheetRoutes.map(route => (
        <React.Fragment key={route.key}>
          {descriptors[route.key].render()}
        </React.Fragment>
      ))}
    </NavigationContent>
  );
}

export const createBottomSheetNavigator = createNavigatorFactory<
  StackNavigationState<ParamListBase>,
  BottomNavigationOptions,
  BottomNavigationEventMap,
  typeof BottomSheetNavigator
>(BottomSheetNavigator);
