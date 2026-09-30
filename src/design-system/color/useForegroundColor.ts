import { useContext } from 'react';

import { type SharedValue } from 'react-native-reanimated';

import { AccentColorContext } from './AccentColorContext';
import { ColorModeContext } from './ColorMode';
import {
  getDefaultAccentColorForColorMode,
  getValueForColorMode,
  palettes,
  type BackgroundColorValue,
  type ColorMode,
  type ContextualColorValue,
  type ForegroundColor,
  type TextColor,
} from './palettes';

/** A literal color, optionally varied by color mode. */
export type CustomColor<Value extends string = string> = {
  custom: Value | ContextualColorValue<Value>;
};

/** Foreground palettes by color mode. Keeps background palettes out of worklet closures. */
const foregroundColorsByMode: Record<ColorMode, Partial<Record<string, string>>> = {
  dark: palettes.dark.foregroundColors,
  darkTinted: palettes.darkTinted.foregroundColors,
  light: palettes.light.foregroundColors,
  lightTinted: palettes.lightTinted.foregroundColors,
};

/**
 * Resolves foreground colors for the current color mode.
 */
export function useForegroundColors(
  colors: (ForegroundColor | 'accent' | ContextualColorValue<ForegroundColor | 'accent'> | CustomColor)[]
): string[] {
  const { colorMode, foregroundColors } = useContext(ColorModeContext);
  const accentColor = useContext(AccentColorContext);

  const resolvedColors: string[] = [];
  for (let i = 0; i < colors.length; i++) {
    let color = colors[i];
    if (typeof color === 'object' && !('custom' in color)) color = getValueForColorMode(color, colorMode);

    resolvedColors[i] =
      typeof color === 'string' && color !== 'accent' ? foregroundColors[color] : getColorForTheme(color, colorMode, accentColor);
  }

  return resolvedColors;
}

/**
 * Resolves a foreground color for the current color mode.
 */
export function useForegroundColor(color: ForegroundColor | 'accent' | CustomColor): string {
  return getColorForTheme(color, useContext(ColorModeContext).colorMode, useContext(AccentColorContext));
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
  let colorValue = color;

  if (typeof colorValue === 'object') {
    if ('custom' in colorValue) {
      const custom = colorValue.custom;
      return typeof custom === 'string' ? custom : getValueForColorMode(custom, colorMode);
    }
    colorValue = colorValue.value;
  }

  if (colorValue === 'accent') return accentColor?.color ?? getDefaultAccentColorForColorMode(colorMode).color;

  return foregroundColorsByMode[colorMode][colorValue] ?? colorValue;
}
