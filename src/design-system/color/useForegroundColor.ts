import { useContext } from 'react';
import { AccentColorContext } from './AccentColorContext';
import { ColorModeContext } from './ColorMode';
import {
  BackgroundColorValue,
  ColorMode,
  ContextualColorValue,
  ForegroundColor,
  TextColor,
  foregroundColors,
  getDefaultAccentColorForColorMode,
  getValueForColorMode,
} from './palettes';

export type CustomColor<Value extends string = string> = {
  custom: Value | ContextualColorValue<Value>;
};

type ForegroundColorOrAccent = ForegroundColor | 'accent';

/**
 * @description Given an array of colors, resolves the foreground color for the current color mode.
 */
export function useForegroundColors(
  colors: (ForegroundColorOrAccent | ContextualColorValue<ForegroundColorOrAccent> | CustomColor)[]
): string[] {
  const { colorMode, foregroundColors } = useContext(ColorModeContext);
  const accentColor = useContext(AccentColorContext);

  return colors.map(color => {
    if (color === 'accent') {
      return accentColor ? accentColor.color : getDefaultAccentColorForColorMode(colorMode).color;
    }

    if (typeof color === 'object') {
      if ('custom' in color) {
        return getValueForColorMode(color.custom, colorMode);
      }

      const colorForColorMode = getValueForColorMode(color, colorMode);

      return colorForColorMode === 'accent'
        ? accentColor?.color ?? getDefaultAccentColorForColorMode(colorMode).color
        : foregroundColors[colorForColorMode];
    }

    return foregroundColors[color];
  });
}

/**
 * @description Resolves the foreground color for the current color mode.
 */
export function useForegroundColor(color: ForegroundColor | 'accent' | CustomColor): string {
  return useForegroundColors([color])[0];
}

export function getColorForTheme(
  color: ForegroundColor | TextColor | CustomColor | 'accent',
  colorMode: ColorMode,
  accentColor?: BackgroundColorValue | null
): string {
  'worklet';
  const binaryColorMode = colorMode === 'dark' || colorMode === 'darkTinted' ? 'dark' : 'light';
  switch (color) {
    case 'accent':
      return accentColor?.color ?? getDefaultAccentColorForColorMode(binaryColorMode).color;
    default:
      if (typeof color === 'object' && 'custom' in color) {
        return typeof color.custom === 'string' ? color.custom : color.custom[binaryColorMode];
      }
      return foregroundColors[color][binaryColorMode];
  }
}
