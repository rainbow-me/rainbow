import { useContext } from 'react';
import { AccentColorContext } from './AccentColorContext';
import { ColorModeContext } from './ColorMode';
import {
  ContextualColorValue,
  ForegroundColor,
  getValueForColorMode,
} from './palettes';

export type CustomColor = {
  custom: string | ContextualColorValue<string>;
};

/**
 * @description Resolves the foreground color for the current color mode.
 */
export function useForegroundColor(
  color: ForegroundColor | 'accent' | CustomColor
): string {
  const { colorMode, foregroundColors } = useContext(ColorModeContext);
  const accentColor = useContext(AccentColorContext);

  if (color === 'accent') {
    return accentColor.color;
  }

  if (typeof color === 'object') {
    return getValueForColorMode(color.custom, colorMode);
  }

  return foregroundColors[color];
}
