import { useContext } from 'react';
import { SharedValue } from 'react-native-reanimated';
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

function isForegroundColor(color: string | ForegroundColor): color is ForegroundColor {
  'worklet';
  return color in foregroundColors;
}

export function getColorForTheme(
  color: ForegroundColor | TextColor | CustomColor | string | 'accent' | SharedValue<TextColor> | SharedValue<string>,
  colorMode: ColorMode,
  accentColor?: BackgroundColorValue | null
): string {
  'worklet';
  const binaryColorMode = colorMode === 'dark' || colorMode === 'darkTinted' ? 'dark' : 'light';
  const colorValue = typeof color === 'object' && 'value' in color ? color.value : color;

  switch (colorValue) {
    case 'accent':
      return accentColor?.color ?? getDefaultAccentColorForColorMode(binaryColorMode).color;
    default:
      if (typeof colorValue === 'object' && 'custom' in colorValue) {
        return typeof colorValue.custom === 'string' ? colorValue.custom : colorValue.custom[binaryColorMode];
      }
      if (isForegroundColor(colorValue)) return foregroundColors[colorValue][binaryColorMode];
      return colorValue;
  }
}
