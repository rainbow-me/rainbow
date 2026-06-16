import React from 'react';

import { createStackNavigator } from '@react-navigation/stack';

import { stackNavigationConfig } from '@/navigation/config';
import { overlayExpandedPreset, sheetPreset } from '@/navigation/effects';
import Routes from '@/navigation/routesNames';
import ModalScreen from '@/screens/ModalScreen';

import SendSheet from '../screens/SendSheet';

const Stack = createStackNavigator();

export function SendFlowNavigator() {
  return (
    <Stack.Navigator {...stackNavigationConfig} initialRouteName={Routes.SEND_SHEET}>
      <Stack.Screen component={ModalScreen} name={Routes.MODAL_SCREEN} options={overlayExpandedPreset} />
      <Stack.Screen component={SendSheet} name={Routes.SEND_SHEET} options={sheetPreset} />
    </Stack.Navigator>
  );
}
