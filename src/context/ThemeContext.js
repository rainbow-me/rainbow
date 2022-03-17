import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { LayoutAnimation, NativeModules, useColorScheme } from 'react-native';
import { StatusBar } from 'react-native-bars';
import { useDarkMode } from 'react-native-dark-mode';
import { ThemeProvider } from 'styled-components';
import { getTheme, saveTheme } from '../handlers/localstorage/theme';
import { getActiveRoute } from '../navigation/Navigation';
import { darkModeThemeColors, lightModeThemeColors } from '../styles/colors';
import currentColors from './currentColors';
import { DesignSystemProvider } from '@rainbow-me/design-system';
import { onNavigationStateChange } from '@rainbow-me/navigation/onNavigationStateChange';
import { StyleThingThemeProvider } from '@rainbow-me/styled-components';

export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
  SYSTEM: 'system',
};

export const ThemeContext = createContext({
  colors: lightModeThemeColors,
  isDarkMode: false,
  setTheme: () => {},
});

const { RNThemeModule } = NativeModules;

export const MainThemeProvider = props => {
  const [colorScheme, setColorScheme] = useState();

  // looks like one works on Android and another one on iOS. good.
  const isSystemDarkModeIOS = useDarkMode();
  const isSystemDarkModeAndroid = useColorScheme() === 'dark';
  const isSystemDarkMode = ios ? isSystemDarkModeIOS : isSystemDarkModeAndroid;
  const currentRoute = getActiveRoute()?.name;
  const colorSchemeSystemAdjusted =
    colorScheme === THEMES.SYSTEM
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
      const userPref = (await getTheme()) || THEMES.LIGHT;
      const userPrefSystemAdjusted =
        userPref === THEMES.SYSTEM
          ? isSystemDarkMode
            ? 'dark'
            : 'light'
          : userPref;

      currentColors.theme = userPrefSystemAdjusted;
      currentColors.themedColors =
        userPrefSystemAdjusted === THEMES.DARK
          ? darkModeThemeColors
          : lightModeThemeColors;
      setColorScheme(userPref);

      if (currentRoute) {
        onNavigationStateChange(true);
      }
    };
    loadUserPref();
  }, [isSystemDarkMode]);

  // Listening to changes of device appearance while in run-time
  useEffect(() => {
    if (colorScheme) {
      //setIsDarkMode(colorScheme === THEMES.DARK);
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
      setTheme: scheme => {
        const schemeSystemAdjusted =
          scheme === THEMES.SYSTEM
            ? isSystemDarkMode
              ? 'dark'
              : 'light'
            : scheme;
        currentColors.theme = schemeSystemAdjusted;
        StatusBar.pushStackEntry({
          animated: true,
          barStyle: 'light-content',
        });
        currentColors.themedColors =
          schemeSystemAdjusted === THEMES.DARK
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

// Custom hook to get the theme object returns {isDarkMode, colors, setTheme}
export const useTheme = () => useContext(ThemeContext);

export function withThemeContext(Component) {
  return function WrapperComponent(props) {
    return (
      <ThemeContext.Consumer>
        {state => <Component {...props} {...state} />}
      </ThemeContext.Consumer>
    );
  };
}
