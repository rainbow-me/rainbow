import {
  NavigationHelpersContext,
  StackActions,
  StackNavigationState,
} from '@react-navigation/native';
import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Screen, ScreenContainer } from 'react-native-screens';
import type {
  BottomSheetDescriptorMap,
  BottomSheetNavigationConfig,
  BottomSheetNavigationHelpers,
} from '../types';
import BottomSheetRoute from './BottomSheetRoute';
import { useForceUpdate } from '@rainbow-me/hooks';

type Props = BottomSheetNavigationConfig & {
  state: StackNavigationState;
  navigation: BottomSheetNavigationHelpers;
  descriptors: BottomSheetDescriptorMap;
};

const BottomSheetNavigatorView = ({
  descriptors,
  state,
  navigation,
}: Props) => {
  //#region hooks
  const forceUpdate = useForceUpdate();
  //#endregion

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
  const handleOnDismiss = useCallback((key: string, removed: boolean) => {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete descriptorsCache.current[key];

    /**
     * if sheet was dismissed by navigation state, we only force re-render the view.
     * but if it was dismissed by user interaction, we dispatch pop action to navigation state.
     */
    if (removed) {
      forceUpdate();
    } else {
      navigation?.dispatch?.({
        ...StackActions.pop(),
        source: key,
        target: state.key,
      });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //#endregion
  return (
    <NavigationHelpersContext.Provider value={navigation}>
      <ScreenContainer style={{ flex: 1 }}>
        <Screen active={1}>{descriptors[firstKey].render()}</Screen>

        {Object.keys(descriptorsCache.current).map(key => (
          <Screen active={1} key={key}>
            <BottomSheetRoute
              descriptor={descriptorsCache.current[key]}
              key={key}
              onDismiss={handleOnDismiss}
              removing={descriptorsCache.current[key].removing}
              routeKey={key}
            />
          </Screen>
        ))}
      </ScreenContainer>
    </NavigationHelpersContext.Provider>
  );
};

export default BottomSheetNavigatorView;
