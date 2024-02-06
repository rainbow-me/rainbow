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
import type { BottomSheetNavigationConfig, BottomSheetNavigationEventMap, BottomSheetNavigationOptions } from './types';
import BottomSheetNavigatorView from './views/BottomSheetNavigatorView';
import { RootStackParamList } from '@/navigation/types';

type Props = DefaultNavigatorOptions<
  RootStackParamList,
  StackNavigationState<RootStackParamList>,
  BottomSheetNavigationOptions,
  BottomSheetNavigationEventMap
> &
  StackRouterOptions &
  BottomSheetNavigationConfig;

const BottomSheetNavigator = ({ initialRouteName, children, screenOptions, ...rest }: Props) => {
  const { state, descriptors, navigation } = useNavigationBuilder<
    StackNavigationState<RootStackParamList>,
    StackRouterOptions,
    Record<string, () => void>,
    BottomSheetNavigationOptions,
    BottomSheetNavigationEventMap
  >(router, {
    children,
    initialRouteName,
    // @ts-expect-error doesn't like the typing of RootStackParamList
    screenOptions,
  });

  React.useEffect(
    () =>
      // @ts-expect-error we're missing this event handler in our custom
      // bottom-sheet types
      navigation.addListener?.('tabPress', e => {
        const isFocused = navigation.isFocused();

        // Run the operation in the next frame so we're sure all listeners have been run
        // This is necessary to know if preventDefault() has been called
        requestAnimationFrame(() => {
          if (state.index > 0 && isFocused && !(e as EventArg<'tabPress', true>).defaultPrevented) {
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
    <NavigationHelpersContext.Provider value={navigation}>
      <BottomSheetNavigatorView
        {...rest}
        // @ts-ignore type mismatch
        descriptors={descriptors}
        navigation={navigation}
        state={state}
      />
    </NavigationHelpersContext.Provider>
  );
};

export const createBottomSheetNavigator = createNavigatorFactory<
  StackNavigationState<RootStackParamList>,
  BottomSheetNavigationOptions,
  BottomSheetNavigationEventMap,
  typeof BottomSheetNavigator
>(BottomSheetNavigator);
