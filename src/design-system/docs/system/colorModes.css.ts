import { createTheme } from '@vanilla-extract/css';

import { backgroundColors, foregroundColors } from './tokens.css';

export const [light, colorModeVars] = createTheme({
  backgroundColors: pickColorModeValues(backgroundColors, 'light'),
  foregroundColors: pickColorModeValues(foregroundColors, 'light'),
});

export const dark = createTheme(colorModeVars, {
  backgroundColors: pickColorModeValues(backgroundColors, 'dark'),
  foregroundColors: pickColorModeValues(foregroundColors, 'dark'),
});

// //////////////////////////////////////////////////////////////////

function pickColorModeValues<T extends object>(tokens: T, colorMode: 'light' | 'dark') {
  return Object.entries(tokens).reduce((newTokens, [key, value]) => {
    return {
      ...newTokens,
      [key]: value[colorMode] || value,
    };
  }, {}) as Record<keyof T, string>;
}
