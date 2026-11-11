import React from 'react';

import {
  createNavigatorFactory,
  useNavigationBuilder,
  type ParamListBase,
  type StackActionHelpers,
  type StackRouterOptions,
} from '@react-navigation/native';

import { createNativeStackRouter } from './createNativeStackRouter';
import NativeStackView from './NativeStackView';
import { type NativeStackEvents, type NativeStackNavigatorProps, type NativeStackOptions, type NativeStackState } from './types';

function NativeStackNavigator({
  children,
  id,
  initialRouteName,
  onPresentationApplied,
  screenListeners,
  screenOptions,
}: NativeStackNavigatorProps) {
  const { descriptors, navigation, NavigationContent, state } = useNavigationBuilder<
    NativeStackState,
    StackRouterOptions,
    StackActionHelpers<ParamListBase>,
    NativeStackOptions,
    NativeStackEvents
  >(createNativeStackRouter, { children, id, initialRouteName, screenListeners, screenOptions });

  return (
    <NavigationContent>
      <NativeStackView descriptors={descriptors} navigation={navigation} onPresentationApplied={onPresentationApplied} state={state} />
    </NavigationContent>
  );
}

export default createNavigatorFactory<NativeStackState, NativeStackOptions, NativeStackEvents, typeof NativeStackNavigator>(
  NativeStackNavigator
);
