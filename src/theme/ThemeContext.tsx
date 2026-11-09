import React, { createContext, useContext, useEffect, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';

import { SystemBars } from 'react-native-edge-to-edge';
import { ThemeProvider } from 'styled-components';

import { DesignSystemProvider } from '@/design-system';
import { StyleThingThemeProvider } from '@/framework/ui/styled-thing';
import { onHandleStatusBar } from '@/navigation/onNavigationStateChange';

import { useThemeStore, type ThemeState } from './themeStore';

export type ThemeContextProps = ThemeState;

export const ThemeContext = createContext<ThemeContextProps>(useThemeStore.getState());

export const MainThemeProvider = (props: PropsWithChildren) => {
  const theme = useThemeStore();

  useEffect(() => {
    if (Platform.OS === 'android') SystemBars.setStyle(theme.isDarkMode ? 'light' : 'dark');
    onHandleStatusBar();
  }, [theme.isDarkMode]);

  return (
    <StyleThingThemeProvider value={theme}>
      <ThemeProvider theme={theme}>
        <ThemeContext.Provider value={theme}>
          <DesignSystemProvider colorMode={theme.colorMode}>{props.children}</DesignSystemProvider>
        </ThemeContext.Provider>
      </ThemeProvider>
    </StyleThingThemeProvider>
  );
};

/**
 * Custom hook to get the theme object
 */
export const useTheme = () => useContext(ThemeContext);

export function withThemeContext<P extends object>(Component: React.ComponentType<P>) {
  return function WrapperComponent(props: Omit<P, keyof ThemeContextProps>) {
    return <ThemeContext.Consumer>{state => <Component {...(props as P)} {...state} />}</ThemeContext.Consumer>;
  };
}
