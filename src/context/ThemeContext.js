import React, { createContext, useContext, useEffect, useState } from 'react';
import { getTheme, saveTheme } from '../handlers/localstorage/theme';
import { colors } from '@rainbow-me/styles';

const THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
};

export const ThemeContext = createContext({
  colors: colors.lightModeThemeColors,
  isDarkMode: false,
  setTheme: () => {},
});

export const MainThemeProvider = props => {
  const [colorScheme, setColorScheme] = useState();

  const [isDarkMode, setIsDarkMode] = useState(colorScheme === THEMES.DARK);

  // Override default with user preferences
  useEffect(() => {
    const loadUserPref = async () => {
      const userPref = (await getTheme()) || THEMES.LIGHT;
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

  const currentTheme = {
    // Chaning color schemes according to theme
    colors: isDarkMode
      ? colors.darkModeThemeColors
      : colors.lightModeThemeColors,
    isDarkMode,
    // Overrides the isDarkMode value will cause re-render inside the context.
    setTheme: scheme => setColorScheme(scheme),
  };

  return (
    <ThemeContext.Provider value={currentTheme}>
      {props.children}
    </ThemeContext.Provider>
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
