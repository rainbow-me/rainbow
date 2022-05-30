import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  LayoutAnimation,
  NativeModules,
  StatusBar,
  useColorScheme,
} from 'react-native';
import { useDarkMode } from 'react-native-dark-mode';
import { ThemeProvider } from 'styled-components';
import {
  Colors,
  darkModeThemeColors,
  lightModeThemeColors,
} from '../styles/colors';
import currentColors from './currentColors';
import { DesignSystemProvider } from '@rainbow-me/design-system';
import { getTheme, saveTheme } from '@rainbow-me/handlers/localstorage/theme';
import { StyleThingThemeProvider } from '@rainbow-me/styled-components';

export const Themes = {
  DARK: 'dark',
  LIGHT: 'light',
  SYSTEM: 'system',
} as const;

export type ThemesType = typeof Themes[keyof typeof Themes];

export interface ThemeContextProps {
  colors: Colors;
  darkScheme: Colors;
  lightScheme: Colors;
  colorScheme: ThemesType | null;
  isDarkMode: boolean;
  setTheme: (scheme: ThemesType) => void;
}

export const ThemeContext = createContext<ThemeContextProps>({
  colors: lightModeThemeColors,
  colorScheme: Themes.LIGHT,
  darkScheme: darkModeThemeColors,
  isDarkMode: false,
  lightScheme: lightModeThemeColors,
  setTheme: () => {},
});

const { RNThemeModule } = NativeModules;

export const MainThemeProvider = (props: PropsWithChildren<{}>) => {
  const [colorScheme, setColorScheme] = useState<ThemesType | null>(null);

  // looks like one works on Android and another one on iOS. good.
  const isSystemDarkModeIOS = useDarkMode();
  const isSystemDarkModeAndroid = useColorScheme() === 'dark';
  const isSystemDarkMode = ios ? isSystemDarkModeIOS : isSystemDarkModeAndroid;

  const colorSchemeSystemAdjusted =
    colorScheme === Themes.SYSTEM
      ? isSystemDarkMode
        ? 'dark'
        : 'light'
      : colorScheme;

  useEffect(() => {
    setTimeout(() => RNThemeModule?.setMode(colorSchemeSystemAdjusted), 400);
  }, [colorSchemeSystemAdjusted]);

  // Override default with user preferences
  useEffect(() => {
    const loadUserPref = async () => {
      const userPref = (await getTheme()) ?? Themes.LIGHT;
      const userPrefSystemAdjusted =
        userPref === Themes.SYSTEM
          ? isSystemDarkMode
            ? 'dark'
            : 'light'
          : userPref;
      StatusBar.setBarStyle(
        userPrefSystemAdjusted === Themes.DARK
          ? 'light-content'
          : 'dark-content',
        true
      );
      currentColors.theme = userPrefSystemAdjusted;
      currentColors.themedColors =
        userPrefSystemAdjusted === Themes.DARK
          ? darkModeThemeColors
          : lightModeThemeColors;
      setColorScheme(userPref);
    };
    loadUserPref();
  }, [isSystemDarkMode]);

  // Listening to changes of device appearance while in run-time
  useEffect(() => {
    if (colorScheme) {
      //setIsDarkMode(colorScheme === Themes.DARK);
      saveTheme(colorScheme);
    }
  }, [colorScheme]);

  const currentTheme = useMemo(
    () => ({
      colors:
        colorSchemeSystemAdjusted === 'dark'
          ? darkModeThemeColors
          : lightModeThemeColors,
      colorScheme,
      darkScheme: darkModeThemeColors,
      isDarkMode: colorSchemeSystemAdjusted === 'dark',
      lightScheme: lightModeThemeColors,
      // Overrides the isDarkMode value will cause re-render inside the context.
      setTheme: (scheme: ThemesType) => {
        const schemeSystemAdjusted =
          scheme === Themes.SYSTEM
            ? isSystemDarkMode
              ? 'dark'
              : 'light'
            : scheme;
        currentColors.theme = schemeSystemAdjusted;
        StatusBar.setBarStyle(
          schemeSystemAdjusted === Themes.DARK
            ? 'light-content'
            : 'dark-content',
          true
        );
        currentColors.themedColors =
          schemeSystemAdjusted === Themes.DARK
            ? darkModeThemeColors
            : lightModeThemeColors;
        setColorScheme(scheme);
        LayoutAnimation.configureNext(
          LayoutAnimation.create(1000, 'easeInEaseOut', 'opacity')
        );
      },
    }),
    [colorScheme, colorSchemeSystemAdjusted, isSystemDarkMode]
  );

  if (!colorScheme) {
    return null;
  }

  return (
    <StyleThingThemeProvider value={currentTheme}>
      <ThemeProvider theme={currentTheme}>
        <ThemeContext.Provider value={currentTheme}>
          <DesignSystemProvider
            colorMode={currentTheme.isDarkMode ? 'dark' : 'light'}
          >
            {props.children}
          </DesignSystemProvider>
        </ThemeContext.Provider>
      </ThemeProvider>
    </StyleThingThemeProvider>
  );
};

/**
 * Custom hook to get the theme object
 */
export const useTheme = () => useContext(ThemeContext);

export function withThemeContext<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WrapperComponent(props: Omit<P, keyof ThemeContextProps>) {
    return (
      <ThemeContext.Consumer>
        {state => <Component {...(props as P)} {...state} />}
      </ThemeContext.Consumer>
    );
  };
}
