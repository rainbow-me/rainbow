import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { NativeModules } from 'react-native';
import { ThemeProvider as ThemeProviderNative } from 'styled-components/native';
import { ThemeProvider } from 'styled-components/primitives';
import { getTheme, saveTheme } from '../handlers/localstorage/theme';
import colors_NOT_REACTIVE from '../styles/colors';
import currentColors from './currentColors';

const THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
};

export const ThemeContext = createContext({
  colors: colors_NOT_REACTIVE.lightModeThemeColors,
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
      currentColors.themedColors =
        userPref === THEMES.DARK
          ? colors_NOT_REACTIVE.darkModeThemeColors
          : colors_NOT_REACTIVE.lightModeThemeColors;
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
      colors: isDarkMode
        ? colors_NOT_REACTIVE.darkModeThemeColors
        : colors_NOT_REACTIVE.lightModeThemeColors,
      isDarkMode,
      // Overrides the isDarkMode value will cause re-render inside the context.
      setTheme: scheme => {
        currentColors.themedColors =
          scheme === THEMES.DARK
            ? colors_NOT_REACTIVE.darkModeThemeColors
            : colors_NOT_REACTIVE.lightModeThemeColors;
        setColorScheme(scheme);
      },
    }),
    [isDarkMode]
  );

  return (
    <ThemeProvider theme={currentTheme}>
      <ThemeProviderNative theme={currentTheme}>
        <ThemeContext.Provider value={currentTheme}>
          {props.children}
        </ThemeContext.Provider>
      </ThemeProviderNative>
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
