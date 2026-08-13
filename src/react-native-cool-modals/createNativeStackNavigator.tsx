import * as React from 'react';

import {
  createNavigatorFactory,
  StackRouter as OldStackRouter,
  StackActions,
  useNavigationBuilder,
  type DefaultNavigatorOptions,
  type EventArg,
  type ParamListBase,
  type StackActionHelpers,
  type StackNavigationState,
  type StackRouterOptions,
} from '@react-navigation/native';

import { logger } from '@/logger';

import NativeStackView, { type CoolModalNavigationEventMap, type CoolModalNavigationOptions } from './NativeStackView';

type NavigatorProps = DefaultNavigatorOptions<
  ParamListBase,
  StackNavigationState<ParamListBase>,
  CoolModalNavigationOptions,
  CoolModalNavigationEventMap
> &
  StackRouterOptions;

const StackRouter = (...args: Parameters<typeof OldStackRouter>): ReturnType<typeof OldStackRouter> => {
  const oldRouter = OldStackRouter(...args);
  return {
    ...oldRouter,
    getStateForAction(state, action, options) {
      if (action.type === 'PUSH') {
        if (state.routes[state.routes.length - 1].name === action.payload.name) {
          logger.debug(`[NativeStackNavigator]: pushing twice the same name is not allowed`);
          return state;
        }
      }
      return oldRouter.getStateForAction(state, action, options);
    },
  };
};

function NativeStackNavigator(props: NavigatorProps) {
  const { children, id, initialRouteName, screenListeners, screenOptions } = props;
  const { descriptors, navigation, NavigationContent, state } = useNavigationBuilder<
    StackNavigationState<ParamListBase>,
    StackRouterOptions,
    StackActionHelpers<ParamListBase>,
    CoolModalNavigationOptions,
    CoolModalNavigationEventMap
  >(StackRouter, {
    children,
    id,
    initialRouteName,
    screenListeners,
    screenOptions,
  });

  React.useEffect(
    () =>
      // @ts-expect-error: the parent tab navigator owns this event.
      navigation.addListener?.('tabPress', (event: EventArg<'tabPress', true>) => {
        const isFocused = navigation.isFocused();

        // Run the operation in the next frame so we're sure all listeners have been run
        // This is necessary to know if preventDefault() has been called
        requestAnimationFrame(() => {
          if (state.index > 0 && isFocused && !event.defaultPrevented) {
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
    <NavigationContent>
      <NativeStackView descriptors={descriptors} navigation={navigation} state={state} />
    </NavigationContent>
  );
}

export default createNavigatorFactory<
  StackNavigationState<ParamListBase>,
  CoolModalNavigationOptions,
  CoolModalNavigationEventMap,
  typeof NativeStackNavigator
>(NativeStackNavigator);
