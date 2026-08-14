import * as React from 'react';

import {
  createNavigatorFactory,
  StackRouter as OldStackRouter,
  useNavigationBuilder,
  type DefaultNavigatorOptions,
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
