import './shim';
import { AppRegistry, StyleSheet } from 'react-native';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Playground } from './src/design-system/playground/Playground';
import { MainThemeProvider } from './src/theme/ThemeContext';

const sx = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
});

function PlaygroundApp() {
  return (
    <MainThemeProvider>
      <GestureHandlerRootView style={sx.container}>
        <Playground />
      </GestureHandlerRootView>
    </MainThemeProvider>
  );
}

AppRegistry.registerComponent('Rainbow', () => PlaygroundApp);
