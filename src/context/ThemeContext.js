import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { LayoutAnimation, NativeModules, StatusBar } from 'react-native';

import { ThemeProvider } from 'styled-components';
import { getTheme, saveTheme } from '../handlers/localstorage/theme';
import { darkModeThemeColors, lightModeThemeColors } from '../styles/colors';
import currentColors from './currentColors';

const THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
};

export const ThemeContext = createContext({
  colors: lightModeThemeColors,
  isDarkMode: false,
  setTheme: () => {},
});

export const MainThemeProvider = props => {
  const [colorScheme, setColorScheme] = useState();
  useEffect(() => {
    setTimeout(() => NativeModules.RNThemeModule?.setMode(colorScheme), 400);
  }, [colorScheme]);

  const [isDarkMode, setIsDarkMode] = useState(colorScheme === THEMES.DARK);

  // Override default with user preferences
  useEffect(() => {
    const loadUserPref = async () => {
      const userPref = (await getTheme()) || THEMES.LIGHT;
      StatusBar.setBarStyle(
        userPref === THEMES.DARK ? 'light-content' : 'dark-content',
        true
      );
      currentColors.theme = userPref;
      currentColors.themedColors =
        userPref === THEMES.DARK ? darkModeThemeColors : lightModeThemeColors;
      setColorScheme(userPref);
    };
    loadUserPref();
  }, []);

  // Listening to changes of device appearance while in run-time
  useEffect(() => {
    if (colorScheme) {
      setIsDarkMode(colorScheme === THEMES.DARK);
      saveTheme(colorScheme);
    }
  }, [colorScheme]);

  const currentTheme = useMemo(
    () => ({
      // Chaning color schemes according to theme
      colors: isDarkMode ? darkModeThemeColors : lightModeThemeColors,
      darkScheme: darkModeThemeColors,
      isDarkMode,
      lightScheme: lightModeThemeColors,
      // Overrides the isDarkMode value will cause re-render inside the context.
      setTheme: scheme => {
        currentColors.theme = scheme;
        StatusBar.setBarStyle(
          scheme === THEMES.DARK ? 'light-content' : 'dark-content',
          true
        );
        currentColors.themedColors =
          scheme === THEMES.DARK ? darkModeThemeColors : lightModeThemeColors;
        setColorScheme(scheme);
        LayoutAnimation.configureNext(
          LayoutAnimation.create(1000, 'easeInEaseOut', 'opacity')
        );
      },
    }),
    [isDarkMode]
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
