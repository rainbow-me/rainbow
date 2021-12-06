import { useContext } from 'react';
// @ts-expect-error ts-migrate(6142) FIXME: Module './AccentColorContext' was resolved to '/Us... Remove this comment to see the full error message
import { AccentColorContext } from './AccentColorContext';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ColorMode' was resolved to '/Users/nickb... Remove this comment to see the full error message
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
    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
    return accentColor.color;
  }

  if (typeof color === 'object') {
    return getValueForColorMode(color.custom, colorMode);
  }

  return foregroundColors[color];
}
