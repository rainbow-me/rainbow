import {
  NavigationHelpersContext,
  StackActions,
  StackNavigationState,
} from '@react-navigation/native';
import React, { useCallback, useMemo, useRef } from 'react';
import type {
  BottomSheetDescriptorMap,
  BottomSheetNavigationConfig,
  BottomSheetNavigationHelpers,
  // eslint-disable-next-line import/no-unresolved
} from '../types';
import BottomSheetRoute from './BottomSheetRoute';

type Props = BottomSheetNavigationConfig & {
  state: StackNavigationState;
  navigation: BottomSheetNavigationHelpers;
  descriptors: BottomSheetDescriptorMap;
};

const BottomSheetView = ({ descriptors, state, navigation }: Props) => {
  //#region variables
  const descriptorsCache = useRef<BottomSheetDescriptorMap>({});
  const [firstKey, ...restKeys] = useMemo(
    () => state.routes.map(route => route.key),
    [state.routes]
  );

  /**
   * we cache all presented routes descriptor
   */
  restKeys.forEach(key => {
    descriptorsCache.current[key] = descriptors[key];
  });

  /**
   * we flag removed routes in our cache
   */
  Object.keys(descriptorsCache.current)
    .filter(key => !restKeys.includes(key))
    .forEach(key => {
      descriptorsCache.current[key].removing = true;
    });
  //#endregion

  //#region callbacks
  const handleOnDismiss = useCallback((key: string) => {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete descriptorsCache.current[key];
    navigation?.dispatch?.({
      ...StackActions.pop(),
      source: key,
      target: state.key,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  //#endregion
  return (
    <NavigationHelpersContext.Provider value={navigation}>
      {descriptors[firstKey].render()}

      {Object.keys(descriptorsCache.current).map(key => (
        <BottomSheetRoute
          descriptor={descriptorsCache.current[key]}
          key={key}
          onDismiss={handleOnDismiss}
          removing={descriptorsCache.current[key].removing}
          routeKey={key}
        />
      ))}
    </NavigationHelpersContext.Provider>
  );
};

export default BottomSheetView;
