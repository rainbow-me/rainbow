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
} from '../types';
// @ts-expect-error ts-migrate(6142) FIXME: Module './BottomSheetRoute' was resolved to '/User... Remove this comment to see the full error message
import BottomSheetRoute from './BottomSheetRoute';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <NavigationHelpersContext.Provider value={navigation}>
      {descriptors[firstKey].render()}

      {Object.keys(descriptorsCache.current).map(key => (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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

export default BottomSheetNavigatorView;
