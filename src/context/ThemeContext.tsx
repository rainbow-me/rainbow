import React, {
  createContext,
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
import { getTheme, saveTheme } from '../handlers/localstorage/theme';
import { darkModeThemeColors, lightModeThemeColors } from '../styles/colors';
import currentColors from './currentColors';

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
      StatusBar.setBarStyle(
        userPrefSystemAdjusted === THEMES.DARK
          ? 'light-content'
          : 'dark-content',
        true
      );
      currentColors.theme = userPrefSystemAdjusted;
      currentColors.themedColors =
        userPrefSystemAdjusted === THEMES.DARK
          ? darkModeThemeColors
          : lightModeThemeColors;
      setColorScheme(userPref);
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
        StatusBar.setBarStyle(
          schemeSystemAdjusted === THEMES.DARK
            ? 'light-content'
            : 'dark-content',
          true
        );
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

  return (
    <ThemeProvider theme={currentTheme}>
      <ThemeContext.Provider value={currentTheme}>
        {props.children}
      </ThemeContext.Provider>
    </ThemeProvider>
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
