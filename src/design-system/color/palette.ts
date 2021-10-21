/* eslint-disable sort-keys-fix/sort-keys-fix */
import { mapValues } from 'lodash';

export const basePalette = {
  appleBlue: '#0A84FF',
  black: '#000000',
  greyDark: '#25292E',
  grey: 'rgb(60, 66, 66)',
  grey80: 'rgba(60, 66, 66, 0.8)',
  grey70: 'rgba(60, 66, 66, 0.7)',
  grey60: 'rgba(60, 66, 66, 0.6)',
  grey50: 'rgba(60, 66, 66, 0.5)',
  grey40: 'rgba(60, 66, 66, 0.4)',
  grey30: 'rgba(60, 66, 66, 0.3)',
  sky: 'rgb(224, 232, 255)',
  sky80: 'rgba(224, 232, 255, 0.8)',
  sky70: 'rgba(224, 232, 255, 0.7)',
  sky60: 'rgba(224, 232, 255, 0.6)',
  sky50: 'rgba(224, 232, 255, 0.5)',
  sky40: 'rgba(224, 232, 255, 0.4)',
  sky30: 'rgba(224, 232, 255, 0.3)',
  white: '#FFFFFF',
  white80: 'rgba(255, 255, 255, 0.8)',
  white70: 'rgba(255, 255, 255, 0.7)',
  white60: 'rgba(255, 255, 255, 0.6)',
  white50: 'rgba(255, 255, 255, 0.5)',
  white40: 'rgba(255, 255, 255, 0.4)',
  white30: 'rgba(255, 255, 255, 0.3)',
} as const;

export type ColorMode = 'light' | 'dark' | 'darkTinted';

export type ColorDefinition =
  | string
  | {
      light: string;
      dark: string;
      darkTinted?: string;
    };

export type ForegroundColor =
  | 'neutral'
  | 'primary'
  | 'secondary'
  | 'secondary80'
  | 'secondary70'
  | 'secondary60'
  | 'secondary50'
  | 'secondary40'
  | 'secondary30'
  | 'action';

const foregroundColors: Record<ForegroundColor, ColorDefinition> = {
  neutral: {
    light: basePalette.black,
    dark: basePalette.white,
  },
  primary: {
    light: basePalette.grey,
    dark: basePalette.sky,
    darkTinted: basePalette.white,
  },
  secondary: {
    light: basePalette.grey,
    dark: basePalette.sky,
    darkTinted: basePalette.white,
  },
  secondary80: {
    light: basePalette.grey80,
    dark: basePalette.sky80,
    darkTinted: basePalette.white80,
  },
  secondary70: {
    light: basePalette.grey70,
    dark: basePalette.sky70,
    darkTinted: basePalette.white70,
  },
  secondary60: {
    light: basePalette.grey60,
    dark: basePalette.sky60,
    darkTinted: basePalette.white60,
  },
  secondary50: {
    light: basePalette.grey50,
    dark: basePalette.sky50,
    darkTinted: basePalette.white50,
  },
  secondary40: {
    light: basePalette.grey40,
    dark: basePalette.sky40,
    darkTinted: basePalette.white40,
  },
  secondary30: {
    light: basePalette.grey30,
    dark: basePalette.sky30,
    darkTinted: basePalette.white30,
  },
  action: basePalette.appleBlue,
};

export function selectColor(
  value: ColorDefinition,
  colorMode: ColorMode
): string {
  if (typeof value === 'object') {
    return colorMode === 'darkTinted'
      ? value.darkTinted ?? value.dark
      : value[colorMode];
  }

  return value;
}

export type ContextualPalette = {
  foreground: Record<ForegroundColor, string>;
};

function createContextualPalette(colorMode: ColorMode): ContextualPalette {
  return {
    foreground: mapValues(foregroundColors, value =>
      selectColor(value, colorMode)
    ),
  };
}

export const contextualPalettes: Record<ColorMode, ContextualPalette> = {
  dark: createContextualPalette('dark'),
  darkTinted: createContextualPalette('darkTinted'),
  light: createContextualPalette('light'),
};
