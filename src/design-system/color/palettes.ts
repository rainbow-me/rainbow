import { mapValues } from 'lodash';

export const globalColors = {
  green10: '#EAFCE8',
  green20: '#CDFACD',
  green30: '#A6F5AC',
  green40: '#74E082',
  green50: '#4BD166',
  green60: '#1DB847',
  green70: '#189943',
  green80: '#09752D',
  green90: '#005723',
  green100: '#003816',

  blue10: '#EDF9FF',
  blue20: '#D1EDFF',
  blue30: '#A3D7FF',
  blue40: '#6BBFFF',
  blue50: '#3898FF',
  blue60: '#0E76FD',
  blue70: '#1761E0',
  blue80: '#0B4AB8',
  blue90: '#053085',
  blue100: '#001E59',

  purple10: '#F7F5FF',
  purple20: '#E7E0FF',
  purple30: '#C6B8FF',
  purple40: '#9E8FFF',
  purple50: '#7A70FF',
  purple60: '#5F5AFA',
  purple70: '#5248E0',
  purple80: '#4936C2',
  purple90: '#38228F',
  purple100: '#2C0D6B',

  pink10: '#FFF0FA',
  pink20: '#FFD6F1',
  pink30: '#FFB8E2',
  pink40: '#FF99CF',
  pink50: '#FF7AB8',
  pink60: '#FF5CA0',
  pink70: '#E04887',
  pink80: '#CC3976',
  pink90: '#851B53',
  pink100: '#570040',

  red10: '#FFF0F0',
  red20: '#FFD4D1',
  red30: '#FFACA3',
  red40: '#FF887A',
  red50: '#FF6257',
  red60: '#FA423C',
  red70: '#D13732',
  red80: '#B22824',
  red90: '#7A1714',
  red100: '#520907',

  orange10: '#FFF6EB',
  orange20: '#FFE7CC',
  orange30: '#FFCF99',
  orange40: '#FFB266',
  orange50: '#FF983D',
  orange60: '#FF801F',
  orange70: '#E06E16',
  orange80: '#AD530E',
  orange90: '#703B12',
  orange100: '#3D1E0A',

  yellow10: '#FFFBE0',
  yellow20: '#FFF5C2',
  yellow30: '#FFEE99',
  yellow40: '#FFE566',
  yellow50: '#FFDF3D',
  yellow60: '#FFD014',
  yellow70: '#EBAF09',
  yellow80: '#B88700',
  yellow90: '#7A600A',
  yellow100: '#42320B',

  grey10: '#F7F7F7',
  grey20: 'rgba(9, 17, 31, 0.05)',
  grey30: 'rgba(16, 21, 31, 0.1)',
  grey40: 'rgba(16, 21, 31, 0.16)',
  grey50: 'rgba(22, 25, 31, 0.24)',
  grey60: 'rgba(26, 28, 31, 0.36)',
  grey70: 'rgba(27, 29, 31, 0.5)',
  grey80: 'rgba(27, 29, 31, 0.7)',
  grey90: 'rgba(27, 29, 31, 0.88)',
  grey100: '#000',

  white10: '#1B1C1E',
  white20: 'rgba(245, 248, 255, 0.12)',
  white30: 'rgba(245, 248, 255, 0.16)',
  white40: 'rgba(245, 248, 255, 0.2)',
  white50: 'rgba(245, 248, 255, 0.28)',
  white60: 'rgba(245, 248, 255, 0.4)',
  white70: 'rgba(245, 248, 255, 0.56)',
  white80: 'rgba(245, 248, 255, 0.76)',
  white90: 'rgba(247, 250, 255, 0.92)',
  white100: '#FFFFFF',

  blueGrey10: '#F5F5F7',
  blueGrey20: '#E6E9F0',
  blueGrey30: '#DADEE5',
  blueGrey40: '#CAD0D9',
  blueGrey50: '#AFB9C7',
  blueGrey60: '#929EAD',
  blueGrey70: '#78828F',
  blueGrey80: '#5F6670',
  blueGrey90: '#3C4047',
  blueGrey100: '#242529',

  darkGrey: '#9CA6B1',
};

export const deprecatedColors = {
  appleBlue: '#0E76FD',
  appleBlueLight: '#1F87FF',
  black: '#000000',
  blackTint: '#12131a',
  dark: '#1E2028',
  darker: '#12131A',
  grey: 'rgb(60, 66, 82)',
  grey06: 'rgba(60, 66, 82, 0.06)',
  grey10: 'rgba(60, 66, 82, 0.1)',
  grey15: 'rgba(60, 66, 82, 0.15)',
  grey20: 'rgba(60, 66, 82, 0.2)',
  grey25: 'rgba(60, 66, 82, 0.25)',
  grey30: 'rgba(60, 66, 82, 0.3)',
  grey40: 'rgba(60, 66, 82, 0.4)',
  grey50: 'rgba(60, 66, 82, 0.5)',
  grey60: 'rgba(60, 66, 82, 0.6)',
  grey70: 'rgba(60, 66, 82, 0.7)',
  grey80: 'rgba(60, 66, 82, 0.8)',
  greyDark: '#25292E',
  offwhite: '#F5F5F7',
  paleBlue: '#579DFF',
  sky: '#E0E8FF',
  sky06: 'rgba(224, 232, 255, 0.06)',
  sky10: 'rgba(224, 232, 255, 0.1)',
  sky15: 'rgba(224, 232, 255, 0.15)',
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
  white15: 'rgba(255, 255, 255, 0.15)',
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

export type BackgroundColor =
  | 'surfacePrimary'
  | 'surfacePrimaryElevated'
  | 'surfaceSecondary'
  | 'surfaceSecondaryElevated'
  | 'fill'
  | 'fillSecondary'
  | 'fillTertiary'
  | 'fillQuaternary'
  | 'blue'
  | 'green'
  | 'red'
  | 'purple'
  | 'pink'
  | 'orange'
  | 'yellow'
  | 'body (Deprecated)'
  | 'action (Deprecated)'
  | 'swap (Deprecated)'
  | 'card (Deprecated)'
  | 'cardBackdrop (Deprecated)';

export type BackgroundColorValue = {
  color: string;
  mode: ColorMode;
};

export const backgroundColors: Record<BackgroundColor, ContextualColorValue<BackgroundColorValue>> = {
  'surfacePrimary': {
    light: {
      color: globalColors.white100,
      mode: 'light',
    },
    dark: {
      color: deprecatedColors.darker,
      mode: 'dark',
    },
  },
  'surfacePrimaryElevated': {
    light: {
      color: globalColors.white100,
      mode: 'light',
    },
    dark: {
      color: deprecatedColors.darker,
      mode: 'dark',
    },
  },
  'surfaceSecondary': {
    light: {
      color: globalColors.blueGrey10,
      mode: 'light',
    },
    dark: {
      color: deprecatedColors.darker,
      mode: 'dark',
    },
  },
  'surfaceSecondaryElevated': {
    light: {
      color: globalColors.white100,
      mode: 'light',
    },
    dark: {
      color: deprecatedColors.dark,
      mode: 'dark',
    },
  },
  'fill': {
    light: {
      color: globalColors.grey30,
      mode: 'light',
    },
    dark: {
      color: globalColors.white30,
      mode: 'dark',
    },
  },
  'fillSecondary': {
    light: {
      color: globalColors.grey20,
      mode: 'light',
    },
    dark: {
      color: globalColors.white20,
      mode: 'dark',
    },
  },
  'fillTertiary': {
    light: {
      color: globalColors.grey20,
      mode: 'light',
    },
    dark: {
      color: 'rgba(245, 248, 255, 0.08)',
      mode: 'dark',
    },
  },
  'fillQuaternary': {
    light: {
      color: globalColors.grey10,
      mode: 'light',
    },
    dark: {
      color: 'rgba(245, 248, 255, 0.04)',
      mode: 'dark',
    },
  },
  'blue': {
    light: {
      color: globalColors.blue60,
      mode: 'dark',
    },
    dark: {
      color: globalColors.blue50,
      mode: 'dark',
    },
  },
  'green': {
    light: {
      color: globalColors.green60,
      mode: 'dark',
    },
    dark: {
      color: globalColors.green50,
      mode: 'dark',
    },
  },
  'red': {
    light: {
      color: globalColors.red60,
      mode: 'dark',
    },
    dark: {
      color: globalColors.red50,
      mode: 'dark',
    },
  },
  'purple': {
    light: {
      color: globalColors.purple60,
      mode: 'dark',
    },
    dark: {
      color: globalColors.purple50,
      mode: 'dark',
    },
  },
  'pink': {
    light: {
      color: globalColors.pink60,
      mode: 'dark',
    },
    dark: {
      color: globalColors.pink50,
      mode: 'dark',
    },
  },
  'orange': {
    light: {
      color: globalColors.orange60,
      mode: 'dark',
    },
    dark: {
      color: globalColors.orange50,
      mode: 'dark',
    },
  },
  'yellow': {
    light: {
      color: globalColors.yellow60,
      mode: 'light',
    },
    dark: {
      color: globalColors.yellow50,
      mode: 'light',
    },
  },
  'action (Deprecated)': {
    dark: {
      color: deprecatedColors.appleBlueLight,
      mode: 'darkTinted',
    },
    light: {
      color: deprecatedColors.appleBlue,
      mode: 'darkTinted',
    },
  },
  'body (Deprecated)': {
    dark: {
      color: deprecatedColors.blackTint,
      mode: 'dark',
    },
    darkTinted: {
      color: deprecatedColors.blackTint,
      mode: 'darkTinted',
    },
    light: {
      color: deprecatedColors.white,
      mode: 'light',
    },
    lightTinted: {
      color: deprecatedColors.white,
      mode: 'lightTinted',
    },
  },
  'card (Deprecated)': {
    dark: {
      color: deprecatedColors.dark,
      mode: 'dark',
    },
    light: {
      color: deprecatedColors.white,
      mode: 'light',
    },
  },
  'cardBackdrop (Deprecated)': {
    dark: {
      color: deprecatedColors.darker,
      mode: 'dark',
    },
    light: {
      color: deprecatedColors.offwhite,
      mode: 'light',
    },
  },
  'swap (Deprecated)': {
    dark: {
      color: deprecatedColors.swapPurple,
      mode: 'darkTinted',
    },
    light: {
      color: deprecatedColors.swapPurple,
      mode: 'darkTinted',
    },
  },
};

export type ForegroundColor =
  | 'label'
  | 'labelSecondary'
  | 'labelTertiary'
  | 'labelQuaternary'
  | 'blue'
  | 'green'
  | 'red'
  | 'purple'
  | 'pink'
  | 'orange'
  | 'yellow'
  | 'fill'
  | 'fillSecondary'
  | 'fillTertiary'
  | 'fillQuaternary'
  | 'scrim'
  | 'scrimSecondary'
  | 'scrimTertiary'
  | 'separator'
  | 'separatorSecondary'
  | 'separatorTertiary'
  | 'buttonStroke'
  | 'buttonStrokeSecondary'
  | 'shadowNear'
  | 'shadowFar'
  | 'action (Deprecated)'
  | 'divider20 (Deprecated)'
  | 'divider40 (Deprecated)'
  | 'divider60 (Deprecated)'
  | 'divider80 (Deprecated)'
  | 'divider100 (Deprecated)'
  | 'primary (Deprecated)'
  | 'secondary (Deprecated)'
  | 'secondary06 (Deprecated)'
  | 'secondary10 (Deprecated)'
  | 'secondary15 (Deprecated)'
  | 'secondary20 (Deprecated)'
  | 'secondary25 (Deprecated)'
  | 'secondary30 (Deprecated)'
  | 'secondary40 (Deprecated)'
  | 'secondary50 (Deprecated)'
  | 'secondary60 (Deprecated)'
  | 'secondary70 (Deprecated)'
  | 'secondary80 (Deprecated)'
  | 'swap (Deprecated)'
  | 'mainnet'
  | 'arbitrum'
  | 'optimism'
  | 'polygon'
  | 'base'
  | 'zora'
  | 'bsc'
  | 'avalanche'
  | 'blast'
  | 'degen';

function selectBackgroundAsForeground(backgroundName: BackgroundColor): ContextualColorValue<string> {
  const bg = backgroundColors[backgroundName];

  return {
    dark: bg.dark.color,
    light: bg.light.color,
    ...(bg.lightTinted && { lightTinted: bg.lightTinted.color }),
    ...(bg.darkTinted && { darkTinted: bg.darkTinted.color }),
  };
}

export const foregroundColors: Record<ForegroundColor, ContextualColorValue<string>> = {
  'label': {
    light: globalColors.grey100,
    dark: globalColors.white100,
  },
  'labelSecondary': {
    light: globalColors.grey80,
    dark: globalColors.white80,
  },
  'labelTertiary': {
    light: globalColors.grey70,
    dark: globalColors.white70,
  },
  'labelQuaternary': {
    light: globalColors.grey60,
    dark: globalColors.white60,
  },
  'blue': selectBackgroundAsForeground('blue'),
  'green': selectBackgroundAsForeground('green'),
  'red': selectBackgroundAsForeground('red'),
  'purple': selectBackgroundAsForeground('purple'),
  'pink': selectBackgroundAsForeground('pink'),
  'orange': selectBackgroundAsForeground('orange'),
  'yellow': selectBackgroundAsForeground('yellow'),
  'fill': selectBackgroundAsForeground('fill'),
  'fillSecondary': selectBackgroundAsForeground('fillSecondary'),
  'fillTertiary': selectBackgroundAsForeground('fillTertiary'),
  'fillQuaternary': selectBackgroundAsForeground('fillQuaternary'),
  'scrim': {
    light: 'rgba(0, 0, 0, 0.2)',
    dark: 'rgba(0, 0, 0, 0.4)',
  },
  'scrimSecondary': {
    light: 'rgba(0, 0, 0, 0.4)',
    dark: 'rgba(0, 0, 0, 0.6)',
  },
  'scrimTertiary': {
    light: 'rgba(0, 0, 0, 0.6)',
    dark: 'rgba(0, 0, 0, 0.8)',
  },
  'separator': {
    light: globalColors.grey20,
    dark: globalColors.white20,
  },
  'separatorSecondary': {
    light: globalColors.grey20,
    dark: 'rgba(245, 248, 255, 0.06)',
  },
  'separatorTertiary': {
    light: 'rgba(9, 17, 31, 0.02)',
    dark: 'rgba(245, 248, 255, 0.02)',
  },
  'buttonStroke': {
    light: 'rgba(0, 0, 0, 0.05)',
    dark: 'rgba(255, 255, 255, 0.03)',
  },
  'buttonStrokeSecondary': {
    light: globalColors.white20,
    dark: globalColors.grey20,
  },
  'action (Deprecated)': {
    dark: deprecatedColors.appleBlueLight,
    light: deprecatedColors.appleBlue,
  },
  'divider100 (Deprecated)': {
    dark: 'rgba(60, 66, 82, 0.6)',
    darkTinted: 'rgba(255, 255, 255, 0.15)',
    light: 'rgba(60, 66, 82, 0.12)',
  },
  'divider20 (Deprecated)': {
    dark: 'rgba(60, 66, 82, 0.025)',
    darkTinted: 'rgba(255, 255, 255, 0.01)',
    light: 'rgba(60, 66, 82, 0.01)',
  },
  'divider40 (Deprecated)': {
    dark: 'rgba(60, 66, 82, 0.0375)',
    darkTinted: 'rgba(255, 255, 255, 0.0375)',
    light: 'rgba(60, 66, 82, 0.015)',
  },
  'divider60 (Deprecated)': {
    dark: 'rgba(60, 66, 82, 0.05)',
    darkTinted: 'rgba(255, 255, 255, 0.05)',
    light: 'rgba(60, 66, 82, 0.02)',
  },
  'divider80 (Deprecated)': {
    dark: 'rgba(60, 66, 82, 0.075)',
    darkTinted: 'rgba(255, 255, 255, 0.075)',
    light: 'rgba(60, 66, 82, 0.03)',
  },
  'primary (Deprecated)': {
    dark: deprecatedColors.sky,
    darkTinted: deprecatedColors.white,
    light: deprecatedColors.greyDark,
    lightTinted: deprecatedColors.greyDark,
  },
  'secondary (Deprecated)': {
    dark: deprecatedColors.sky,
    darkTinted: deprecatedColors.white90,
    light: deprecatedColors.grey,
  },
  'secondary06 (Deprecated)': {
    dark: deprecatedColors.sky06,
    darkTinted: deprecatedColors.white06,
    light: deprecatedColors.grey06,
  },
  'secondary10 (Deprecated)': {
    dark: deprecatedColors.sky10,
    darkTinted: deprecatedColors.white10,
    light: deprecatedColors.grey10,
  },
  'secondary15 (Deprecated)': {
    dark: deprecatedColors.sky15,
    darkTinted: deprecatedColors.white15,
    light: deprecatedColors.grey15,
  },
  'secondary20 (Deprecated)': {
    dark: deprecatedColors.sky20,
    darkTinted: deprecatedColors.white20,
    light: deprecatedColors.grey20,
  },
  'secondary25 (Deprecated)': {
    dark: deprecatedColors.sky25,
    darkTinted: deprecatedColors.white25,
    light: deprecatedColors.grey25,
  },
  'secondary30 (Deprecated)': {
    dark: deprecatedColors.sky30,
    darkTinted: deprecatedColors.white30,
    light: deprecatedColors.grey30,
  },
  'secondary40 (Deprecated)': {
    dark: deprecatedColors.sky40,
    darkTinted: deprecatedColors.white40,
    light: deprecatedColors.grey40,
  },
  'secondary50 (Deprecated)': {
    dark: deprecatedColors.sky50,
    darkTinted: deprecatedColors.white50,
    light: deprecatedColors.grey50,
  },
  'secondary60 (Deprecated)': {
    dark: deprecatedColors.sky60,
    darkTinted: deprecatedColors.white60,
    light: deprecatedColors.grey60,
  },
  'secondary70 (Deprecated)': {
    dark: deprecatedColors.sky70,
    darkTinted: deprecatedColors.white70,
    light: deprecatedColors.grey70,
  },
  'secondary80 (Deprecated)': {
    dark: deprecatedColors.sky80,
    darkTinted: deprecatedColors.white80,
    light: deprecatedColors.grey80,
  },
  'shadowNear': {
    light: globalColors.grey100,
    dark: globalColors.grey100,
  },
  'shadowFar': {
    dark: globalColors.grey100,
    light: '#25292E',
  },
  'swap (Deprecated)': {
    light: deprecatedColors.swapPurple,
    dark: deprecatedColors.swapPurple,
  },
  'mainnet': {
    light: '#6D6D6D',
    dark: '#999BA1',
  },
  'arbitrum': {
    light: '#1690E4',
    dark: '#52B8FF',
  },
  'optimism': {
    light: '#FF4040',
    dark: '#FF8A8A',
  },
  'polygon': {
    light: '#8247E5',
    dark: '#BE97FF',
  },
  'base': {
    light: '#0052FF',
    dark: '#3979FF',
  },
  'zora': {
    light: '#2B5DF0',
    dark: '#6183F0',
  },
  'bsc': {
    light: '#EBAF09',
    dark: '#FFDA66',
  },
  'avalanche': {
    light: '#EBAF09',
    dark: '#FF5D5E',
  },
  'blast': {
    light: '#FCFC06',
    dark: '#FCFC06',
  },
  'degen': {
    light: '#A36EFD',
    dark: '#A36EFD',
  },
};

/**
 * @description Accepts an object with values defined for each color mode and
 * resolves the value based on the requested color mode. This is useful because
 * some color modes can inherit from others, e.g. `"dark"` and `"darkTinted"`.
 */
export function getValueForColorMode<Value>(value: Value | ContextualColorValue<Value>, colorMode: ColorMode): Value {
  if (typeof value === 'object' && value !== null && 'light' in value) {
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

export function getDefaultAccentColorForColorMode(colorMode: ColorMode) {
  const defaultAccentColor = backgroundColors.blue;

  return getValueForColorMode(defaultAccentColor, colorMode);
}

export type Palette = {
  backgroundColors: Record<BackgroundColor, BackgroundColorValue>;
  foregroundColors: Record<ForegroundColor, string>;
};

function createPalette(colorMode: ColorMode): Palette {
  return {
    backgroundColors: mapValues(backgroundColors, value => {
      if (colorMode === 'darkTinted') {
        return value.darkTinted ?? value.dark;
      }

      if (colorMode === 'lightTinted') {
        return value.lightTinted ?? value.light;
      }

      return value[colorMode];
    }),
    foregroundColors: mapValues(foregroundColors, value => getValueForColorMode(value, colorMode)),
  };
}

export const palettes: Record<ColorMode, Palette> = {
  dark: createPalette('dark'),
  darkTinted: createPalette('darkTinted'),
  light: createPalette('light'),
  lightTinted: createPalette('lightTinted'),
};

function selectForegroundColors<SelectedColors extends readonly (ForegroundColor | 'accent')[]>(...colors: SelectedColors): SelectedColors {
  return colors;
}

export const textColors = selectForegroundColors(
  'accent',
  'label',
  'labelSecondary',
  'labelTertiary',
  'labelQuaternary',
  'blue',
  'green',
  'red',
  'purple',
  'pink',
  'orange',
  'yellow',
  'action (Deprecated)',
  'primary (Deprecated)',
  'secondary (Deprecated)',
  'secondary10 (Deprecated)',
  'secondary20 (Deprecated)',
  'secondary25 (Deprecated)',
  'secondary30 (Deprecated)',
  'secondary40 (Deprecated)',
  'secondary50 (Deprecated)',
  'secondary60 (Deprecated)',
  'secondary70 (Deprecated)',
  'secondary80 (Deprecated)',
  'mainnet',
  'arbitrum',
  'optimism',
  'polygon',
  'base',
  'zora',
  'bsc',
  'avalanche',
  'blast',
  'degen'
);
export type TextColor = (typeof textColors)[number];

export const shadowColors = selectForegroundColors('accent', 'blue', 'green', 'red', 'purple', 'pink', 'orange', 'yellow');
export type ShadowColor = (typeof shadowColors)[number];

export const separatorColors = selectForegroundColors(
  'separator',
  'separatorSecondary',
  'separatorTertiary',
  'divider20 (Deprecated)',
  'divider40 (Deprecated)',
  'divider60 (Deprecated)',
  'divider80 (Deprecated)',
  'divider100 (Deprecated)'
);
export type SeparatorColor = (typeof separatorColors)[number];
