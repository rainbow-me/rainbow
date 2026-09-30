import { useContext } from 'react';

import { type SharedValue } from 'react-native-reanimated';

import { AccentColorContext } from './AccentColorContext';
import { ColorModeContext } from './ColorMode';
import {
  foregroundColors,
  getDefaultAccentColorForColorMode,
  getValueForColorMode,
  type BackgroundColorValue,
  type ColorMode,
  type ContextualColorValue,
  type ForegroundColor,
  type TextColor,
} from './palettes';

/** A custom color, optionally varied by color mode. */
export type CustomColor<Value extends string = string> = {
  custom: Value | ContextualColorValue<Value>;
};

type ForegroundColorOrAccent = ForegroundColor | 'accent';

/**
 * Resolves foreground colors for the current color mode.
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
        ? (accentColor?.color ?? getDefaultAccentColorForColorMode(colorMode).color)
        : foregroundColors[colorForColorMode];
    }

    return foregroundColors[color];
  });
}

/**
 * Resolves a foreground color for the current color mode.
 */
export function useForegroundColor(color: ForegroundColor | 'accent' | CustomColor): string {
  return useForegroundColors([color])[0];
}

function isForegroundColor(color: string): color is ForegroundColor {
  'worklet';
  return color in foregroundColors;
}

/**
 * Resolves a color for the given color mode.
 */
export function getColorForTheme(
  color: string | CustomColor | SharedValue<TextColor> | SharedValue<string>,
  colorMode: ColorMode,
  accentColor?: BackgroundColorValue | null
): string {
  'worklet';
  const colorValue = typeof color === 'object' && 'value' in color ? color.value : color;

  if (colorValue === 'accent') return accentColor?.color ?? getDefaultAccentColorForColorMode(colorMode).color;
  if (typeof colorValue === 'object') return getValueForColorMode(colorValue.custom, colorMode);
  return isForegroundColor(colorValue) ? getValueForColorMode(foregroundColors[colorValue], colorMode) : colorValue;
}
