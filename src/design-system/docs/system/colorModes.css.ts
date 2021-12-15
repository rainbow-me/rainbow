import { createTheme } from '@vanilla-extract/css';

import { backgroundColors, textColors } from './tokens.css';

export const [light, colorModeVars] = createTheme({
  backgroundColors: pickColorModeValues(backgroundColors, 'light'),
  textColors: pickColorModeValues(textColors, 'light'),
});

export const dark = createTheme(colorModeVars, {
  backgroundColors: pickColorModeValues(backgroundColors, 'dark'),
  textColors: pickColorModeValues(textColors, 'dark'),
});

////////////////////////////////////////////////////////////////////

function pickColorModeValues<T>(tokens: T, colorMode: 'light' | 'dark') {
  return Object.entries(tokens).reduce((newTokens, [key, value]) => {
    return {
      ...newTokens,
      [key]: value[colorMode] || value,
    };
  }, {}) as Record<keyof T, string>;
}
