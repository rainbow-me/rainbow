/* eslint-disable sort-keys-fix/sort-keys-fix */
import { mapValues } from 'lodash';

const colors = {
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
  swapPurple: '#575CFF',
} as const;

export type ColorMode = 'light' | 'dark' | 'darkTinted';

export type ContextualColorValue<Value> = {
  light: Value;
  dark: Value;
  darkTinted?: Value;
};

export type BackgroundColor = 'body' | 'action' | 'swap';

type BackgroundColorValue = {
  color: string;
  mode: ColorMode;
};

export const backgroundColors: Record<
  BackgroundColor,
  BackgroundColorValue | ContextualColorValue<BackgroundColorValue>
> = {
  body: {
    light: {
      color: colors.white,
      mode: 'light',
    },
    dark: {
      color: '#12131a',
      mode: 'dark',
    },
  },
  action: {
    color: colors.appleBlue,
    mode: 'dark',
  },
  swap: {
    color: colors.swapPurple,
    mode: 'dark',
  },
};

export type ForegroundColor =
  | 'primary'
  | 'secondary'
  | 'secondary80'
  | 'secondary70'
  | 'secondary60'
  | 'secondary50'
  | 'secondary40'
  | 'secondary30'
  | 'inverted'
  | 'action';

export const foregroundColors: Record<
  ForegroundColor,
  string | ContextualColorValue<string>
> = {
  inverted: {
    light: colors.black,
    dark: colors.white,
  },
  primary: {
    light: colors.grey,
    dark: colors.sky,
    darkTinted: colors.white,
  },
  secondary: {
    light: colors.grey,
    dark: colors.sky,
    darkTinted: colors.white,
  },
  secondary80: {
    light: colors.grey80,
    dark: colors.sky80,
    darkTinted: colors.white80,
  },
  secondary70: {
    light: colors.grey70,
    dark: colors.sky70,
    darkTinted: colors.white70,
  },
  secondary60: {
    light: colors.grey60,
    dark: colors.sky60,
    darkTinted: colors.white60,
  },
  secondary50: {
    light: colors.grey50,
    dark: colors.sky50,
    darkTinted: colors.white50,
  },
  secondary40: {
    light: colors.grey40,
    dark: colors.sky40,
    darkTinted: colors.white40,
  },
  secondary30: {
    light: colors.grey30,
    dark: colors.sky30,
    darkTinted: colors.white30,
  },
  action: colors.appleBlue,
};

export function getValueForColorMode<Value>(
  value: Value | ContextualColorValue<Value>,
  colorMode: ColorMode
): Value {
  if (typeof value === 'object' && 'light' in value) {
    return colorMode === 'darkTinted'
      ? value.darkTinted ?? value.dark
      : value[colorMode];
  }

  return value;
}

export type Palette = {
  backgroundColors: Record<BackgroundColor, BackgroundColorValue>;
  foregroundColors: Record<ForegroundColor, string>;
};

function createPalette(colorMode: ColorMode): Palette {
  return {
    backgroundColors: mapValues(backgroundColors, value => {
      if ('color' in value) {
        return value;
      }

      return colorMode === 'darkTinted'
        ? value.darkTinted ?? value.dark
        : value[colorMode];
    }),
    foregroundColors: mapValues(foregroundColors, value =>
      getValueForColorMode(value, colorMode)
    ),
  };
}

export const palettes: Record<ColorMode, Palette> = {
  dark: createPalette('dark'),
  darkTinted: createPalette('darkTinted'),
  light: createPalette('light'),
};
