import React from 'react';

import {
  createNavigatorFactory,
  useNavigationBuilder,
  type DefaultNavigatorOptions,
  type ParamListBase,
  type StackActionHelpers,
  type StackRouterOptions,
} from '@react-navigation/native';

import { createNativeStackRouter } from './createNativeStackRouter';
import NativeStackView from './NativeStackView';
import { type NativeStackEvents, type NativeStackOptions, type NativeStackState } from './types';

type NavigatorProps = DefaultNavigatorOptions<ParamListBase, NativeStackState, NativeStackOptions, NativeStackEvents> & StackRouterOptions;

function NativeStackNavigator({ children, id, initialRouteName, screenListeners, screenOptions }: NavigatorProps) {
  const { descriptors, navigation, NavigationContent, state } = useNavigationBuilder<
    NativeStackState,
    StackRouterOptions,
    StackActionHelpers<ParamListBase>,
    NativeStackOptions,
    NativeStackEvents
  >(createNativeStackRouter, { children, id, initialRouteName, screenListeners, screenOptions });

  return (
    <NavigationContent>
      <NativeStackView descriptors={descriptors} navigation={navigation} state={state} />
    </NavigationContent>
  );
}

export default createNavigatorFactory<NativeStackState, NativeStackOptions, NativeStackEvents, typeof NativeStackNavigator>(
  NativeStackNavigator
);
