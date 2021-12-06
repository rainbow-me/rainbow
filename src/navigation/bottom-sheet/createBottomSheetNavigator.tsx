import {
  createNavigatorFactory,
  DefaultNavigatorOptions,
  EventArg,
  NavigationHelpersContext,
  StackActions,
  StackNavigationState,
  StackRouterOptions,
  useNavigationBuilder,
} from '@react-navigation/native';
import React from 'react';
import { router } from './router';
import type {
  BottomSheetNavigationConfig,
  BottomSheetNavigationEventMap,
  BottomSheetNavigationOptions,
} from './types';
// @ts-expect-error ts-migrate(6142) FIXME: Module './views/BottomSheetNavigatorView' was reso... Remove this comment to see the full error message
import BottomSheetNavigatorView from './views/BottomSheetNavigatorView';

type Props = DefaultNavigatorOptions<BottomSheetNavigationOptions> &
  StackRouterOptions &
  BottomSheetNavigationConfig;

const BottomSheetNavigator = ({
  initialRouteName,
  children,
  screenOptions,
  ...rest
}: Props) => {
  const { state, descriptors, navigation } = useNavigationBuilder<
    StackNavigationState,
    StackRouterOptions,
    BottomSheetNavigationOptions,
    BottomSheetNavigationEventMap
  >(router, {
    children,
    initialRouteName,
    screenOptions,
  });

  React.useEffect(
    () =>
      navigation.addListener?.('tabPress', e => {
        const isFocused = navigation.isFocused();

        // Run the operation in the next frame so we're sure all listeners have been run
        // This is necessary to know if preventDefault() has been called
        requestAnimationFrame(() => {
          if (
            state.index > 0 &&
            isFocused &&
            !(e as EventArg<'tabPress', true>).defaultPrevented
          ) {
            // When user taps on already focused tab and we're inside the tab,
            // reset the stack to replicate native behaviour
            navigation.dispatch({
              ...StackActions.popToTop(),
              target: state.key,
            });
          }
        });
      }),
    [navigation, state.index, state.key]
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <NavigationHelpersContext.Provider value={navigation}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <BottomSheetNavigatorView
        {...rest}
        descriptors={descriptors}
        navigation={navigation}
        state={state}
      />
    </NavigationHelpersContext.Provider>
  );
};

export const createBottomSheetNavigator = createNavigatorFactory<
  StackNavigationState,
  BottomSheetNavigationOptions,
  BottomSheetNavigationEventMap,
  typeof BottomSheetNavigator
>(BottomSheetNavigator);
