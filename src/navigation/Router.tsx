import React from 'react';
import {
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { onNavigationStateChange } from './onNavigationStateChange';
import { RootStackParamList } from './types';
import { StyleSheet } from 'react-native';
import { Routes } from './Routes';

type Props = {
  onReady: () => void;
};

const AppRouterContainer = React.forwardRef<
  NavigationContainerRef<RootStackParamList>,
  Props
>(({ onReady }, ref) => (
  <GestureHandlerRootView style={styles.rootView}>
    <NavigationContainer
      onReady={onReady}
      onStateChange={onNavigationStateChange}
      ref={ref}
    >
      <Routes />
    </NavigationContainer>
  </GestureHandlerRootView>
));

AppRouterContainer.displayName = 'AppRouterContainer';

export { AppRouterContainer };

const styles = StyleSheet.create({
  rootView: {
    flex: 1,
  },
});
