import { mapValues } from 'lodash';

export const colors = {
  appleBlue: '#0E76FD',
  appleBlueLight: '#1F87FF',
  black: '#000000',
  blackTint: '#12131a',
  grey: 'rgb(60, 66, 82)',
  grey06: 'rgba(60, 66, 82, 0.06)',
  grey10: 'rgba(60, 66, 82, 0.1)',
  grey20: 'rgba(60, 66, 82, 0.2)',
  grey25: 'rgba(60, 66, 82, 0.25)',
  grey30: 'rgba(60, 66, 82, 0.3)',
  grey40: 'rgba(60, 66, 82, 0.4)',
  grey50: 'rgba(60, 66, 82, 0.5)',
  grey60: 'rgba(60, 66, 82, 0.6)',
  grey70: 'rgba(60, 66, 82, 0.7)',
  grey80: 'rgba(60, 66, 82, 0.8)',
  greyDark: '#25292E',
  paleBlue: '#579DFF',
  sky: '#E0E8FF',
  sky06: 'rgba(224, 232, 255, 0.06)',
  sky10: 'rgba(224, 232, 255, 0.1)',
  sky20: 'rgba(224, 232, 255, 0.2)',
  sky25: 'rgba(224, 232, 255, 0.25)',
  sky30: 'rgba(224, 232, 255, 0.3)',
  sky40: 'rgba(224, 232, 255, 0.4)',
  sky50: 'rgba(224, 232, 255, 0.5)',
  sky60: 'rgba(224, 232, 255, 0.6)',
  sky70: 'rgba(224, 232, 255, 0.7)',
  sky80: 'rgba(224, 232, 255, 0.8)',
  swapPurple: '#575CFF',
  white: '#FFFFFF',
  white06: 'rgba(255, 255, 255, 0.06)',
  white10: 'rgba(255, 255, 255, 0.1)',
  white20: 'rgba(255, 255, 255, 0.2)',
  white25: 'rgba(255, 255, 255, 0.25)',
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
    dark: {
      color: colors.appleBlueLight,
      mode: 'darkTinted',
    },
    light: {
      color: colors.appleBlue,
      mode: 'darkTinted',
    },
  },
  body: {
    dark: {
      color: colors.blackTint,
      mode: 'dark',
    },
    darkTinted: {
      color: colors.blackTint,
      mode: 'darkTinted',
    },
    light: {
      color: colors.white,
      mode: 'light',
    },
    lightTinted: {
      color: colors.white,
      mode: 'lightTinted',
    },
  },
  swap: {
    color: colors.swapPurple,
    mode: 'darkTinted',
  },
};

export type ForegroundColor =
  | 'action'
  | 'divider20'
  | 'divider40'
  | 'divider60'
  | 'divider80'
  | 'divider100'
  | 'primary'
  | 'secondary'
  | 'secondary06'
  | 'secondary10'
  | 'secondary20'
  | 'secondary25'
  | 'secondary30'
  | 'secondary40'
  | 'secondary50'
  | 'secondary60'
  | 'secondary70'
  | 'secondary80'
  | 'shadow'
  | 'swap';

export const foregroundColors: Record<
  ForegroundColor,
  string | ContextualColorValue<string>
> = {
  action: {
    dark: colors.appleBlueLight,
    light: colors.appleBlue,
  },
  divider100: {
    dark: 'rgba(60, 66, 82, 0.6)',
    darkTinted: 'rgba(255, 255, 255, 0.15)',
    light: 'rgba(60, 66, 82, 0.12)',
  },
  divider20: {
    dark: 'rgba(60, 66, 82, 0.025)',
    darkTinted: 'rgba(255, 255, 255, 0.01)',
    light: 'rgba(60, 66, 82, 0.01)',
  },
  divider40: {
    dark: 'rgba(60, 66, 82, 0.0375)',
    darkTinted: 'rgba(255, 255, 255, 0.0375)',
    light: 'rgba(60, 66, 82, 0.015)',
  },
  divider60: {
    dark: 'rgba(60, 66, 82, 0.05)',
    darkTinted: 'rgba(255, 255, 255, 0.05)',
    light: 'rgba(60, 66, 82, 0.02)',
  },
  divider80: {
    dark: 'rgba(60, 66, 82, 0.075)',
    darkTinted: 'rgba(255, 255, 255, 0.075)',
    light: 'rgba(60, 66, 82, 0.03)',
  },
  primary: {
    dark: colors.sky,
    darkTinted: colors.white,
    light: colors.greyDark,
    lightTinted: colors.greyDark,
  },
  secondary: {
    dark: colors.sky,
    darkTinted: colors.white90,
    light: colors.grey,
  },
  secondary06: {
    dark: colors.sky06,
    darkTinted: colors.white06,
    light: colors.grey06,
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
  secondary25: {
    dark: colors.sky25,
    darkTinted: colors.white25,
    light: colors.grey25,
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
  shadow: {
    dark: colors.black,
    darkTinted: colors.black,
    light: colors.greyDark,
    lightTinted: colors.greyDark,
  },
  swap: colors.swapPurple,
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

function selectForegroundColors<
  SelectedColors extends readonly (ForegroundColor | 'accent')[]
>(...colors: SelectedColors): SelectedColors {
  return colors;
}

export const textColors = selectForegroundColors(
  'accent',
  'action',
  'primary',
  'secondary',
  'secondary30',
  'secondary40',
  'secondary50',
  'secondary60',
  'secondary70',
  'secondary80'
);
export type TextColor = typeof textColors[number];

export const shadowColors = selectForegroundColors(
  'shadow',
  'accent',
  'swap',
  'action'
);
export type ShadowColor = typeof shadowColors[number];

export const dividerColors = selectForegroundColors(
  'divider20',
  'divider40',
  'divider60',
  'divider80',
  'divider100'
);
export type DividerColor = typeof dividerColors[number];
