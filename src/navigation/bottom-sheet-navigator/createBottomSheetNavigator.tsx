import React, { useMemo, useRef } from 'react';
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
import { BottomSheetNavigatorContext } from './context/BottomSheetNavigatorContext';
import { useForceUpdate } from '@/hooks';

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
  const forceUpdate = useForceUpdate();
  const descriptorsCache = useRef<Record<string, any>>({});
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

  const sheetRouteKeys = useMemo(
    () => state.routes.map(r => r.key).filter(k => k !== rootKey),
    [state, rootKey]
  );

  // Cache all the descriptor routes
  sheetRouteKeys.forEach(key => {
    descriptorsCache.current[key] = descriptors[key];
  });

  // Mark descriptors for removal
  Object.keys(descriptorsCache.current)
    .filter(key => !sheetRouteKeys.includes(key))
    .forEach(removedKey => {
      descriptorsCache.current[removedKey].removing = true;
    });

  console.log('Current cached routes');
  console.log(Object.keys(descriptorsCache.current));
  console.log('Route state');
  console.log(sheetRouteKeys);

  // Force refresh after the closing animation has ended
  const getOnCloseHandler = (key: string) => () => {
    delete descriptorsCache.current[key];
    forceUpdate();
  };

  return (
    <NavigationContent>
      {descriptors[rootKey].render()}
      {Object.keys(descriptorsCache.current).map(key => (
        <BottomSheetNavigatorContext.Provider
          value={{
            onClose: getOnCloseHandler(key),
            removing: descriptorsCache.current[key].removing,
          }}
          key={key}
        >
          {descriptorsCache.current[key].render()}
        </BottomSheetNavigatorContext.Provider>
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
