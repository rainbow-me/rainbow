import { mapValues } from 'lodash';

export const colors = {
  appleBlue: '#0E76FD',
  black: '#000000',
  grey: 'rgb(60, 66, 66)',
  grey10: 'rgba(60, 66, 66, 0.1)',
  grey20: 'rgba(60, 66, 66, 0.2)',
  grey30: 'rgba(60, 66, 66, 0.3)',
  grey40: 'rgba(60, 66, 66, 0.4)',
  grey50: 'rgba(60, 66, 66, 0.5)',
  grey60: 'rgba(60, 66, 66, 0.6)',
  grey70: 'rgba(60, 66, 66, 0.7)',
  grey80: 'rgba(60, 66, 66, 0.8)',
  greyDark: '#25292E',
  paleBlue: '#579DFF',
  sky: 'rgb(224, 232, 255)',
  sky10: 'rgba(224, 232, 255, 0.1)',
  sky20: 'rgba(224, 232, 255, 0.2)',
  sky30: 'rgba(224, 232, 255, 0.3)',
  sky40: 'rgba(224, 232, 255, 0.4)',
  sky50: 'rgba(224, 232, 255, 0.5)',
  sky60: 'rgba(224, 232, 255, 0.6)',
  sky70: 'rgba(224, 232, 255, 0.7)',
  sky80: 'rgba(224, 232, 255, 0.8)',
  swapPurple: '#575CFF',
  white: '#FFFFFF',
  white10: 'rgba(255, 255, 255, 0.1)',
  white20: 'rgba(255, 255, 255, 0.2)',
  white30: 'rgba(255, 255, 255, 0.3)',
  white40: 'rgba(255, 255, 255, 0.4)',
  white50: 'rgba(255, 255, 255, 0.5)',
  white60: 'rgba(255, 255, 255, 0.6)',
  white70: 'rgba(255, 255, 255, 0.7)',
  white80: 'rgba(255, 255, 255, 0.8)',
  white90: 'rgba(255, 255, 255, 0.9)',
} as const;

export type ColorMode = 'light' | 'lightTinted' | 'dark' | 'darkTinted';

export type ContextualColorValue<Value> = {
  light: Value;
  lightTinted?: Value;
  dark: Value;
  darkTinted?: Value;
};

export type BackgroundColor = 'body' | 'action' | 'swap';

export type BackgroundColorValue = {
  color: string;
  mode: ColorMode;
};

export const defaultAccentColor: BackgroundColorValue = {
  color: colors.paleBlue,
  mode: 'darkTinted',
};

export const backgroundColors: Record<
  BackgroundColor,
  BackgroundColorValue | ContextualColorValue<BackgroundColorValue>
> = {
  action: {
    color: colors.appleBlue,
    mode: 'darkTinted',
  },
  body: {
    dark: {
      color: '#12131a',
      mode: 'dark',
    },
    light: {
      color: colors.white,
      mode: 'light',
    },
  },
  swap: {
    color: colors.swapPurple,
    mode: 'darkTinted',
  },
};

export type ForegroundColor =
  | 'action'
  | 'primary'
  | 'secondary'
  | 'secondary10'
  | 'secondary20'
  | 'secondary30'
  | 'secondary40'
  | 'secondary50'
  | 'secondary60'
  | 'secondary70'
  | 'secondary80';

export const foregroundColors: Record<
  ForegroundColor,
  string | ContextualColorValue<string>
> = {
  action: colors.appleBlue,
  primary: {
    dark: colors.sky,
    darkTinted: colors.white,
    light: colors.grey,
    lightTinted: colors.greyDark,
  },
  secondary: {
    dark: colors.sky,
    darkTinted: colors.white90,
    light: colors.grey,
  },
  secondary10: {
    dark: colors.sky10,
    darkTinted: colors.white10,
    light: colors.grey10,
  },
  secondary20: {
    dark: colors.sky20,
    darkTinted: colors.white20,
    light: colors.grey20,
  },
  secondary30: {
    dark: colors.sky30,
    darkTinted: colors.white30,
    light: colors.grey30,
  },
  secondary40: {
    dark: colors.sky40,
    darkTinted: colors.white40,
    light: colors.grey40,
  },
  secondary50: {
    dark: colors.sky50,
    darkTinted: colors.white50,
    light: colors.grey50,
  },
  secondary60: {
    dark: colors.sky60,
    darkTinted: colors.white60,
    light: colors.grey60,
  },
  secondary70: {
    dark: colors.sky70,
    darkTinted: colors.white70,
    light: colors.grey70,
  },
  secondary80: {
    dark: colors.sky80,
    darkTinted: colors.white80,
    light: colors.grey80,
  },
};

/**
 * @description Accepts an object with values defined for each color mode and
 * resolves the value based on the requested color mode. This is useful because
 * some color modes can inherit from others, e.g. `"dark"` and `"darkTinted"`.
 */
export function getValueForColorMode<Value>(
  value: Value | ContextualColorValue<Value>,
  colorMode: ColorMode
): Value {
  if (typeof value === 'object' && 'light' in value) {
    if (colorMode === 'darkTinted') {
      return value.darkTinted ?? value.dark;
    }

    if (colorMode === 'lightTinted') {
      return value.lightTinted ?? value.light;
    }

    return value[colorMode];
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

      if (colorMode === 'darkTinted') {
        return value.darkTinted ?? value.dark;
      }

      if (colorMode === 'lightTinted') {
        return value.lightTinted ?? value.light;
      }

      return value[colorMode];
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
  lightTinted: createPalette('lightTinted'),
};
