import { useContext } from 'react';
import { AccentColorContext } from './AccentColorContext';
import { ColorModeContext } from './ColorMode';
import { BackgroundColor } from './palettes';

/**
 * @description Resolves the background color for the current color mode.
 */
export function useBackgroundColor(color: BackgroundColor | 'accent'): string {
  const { backgroundColors } = useContext(ColorModeContext);
  const accentColor = useContext(AccentColorContext);
  const background = color === 'accent' ? accentColor : backgroundColors[color];
  return background.color;
}
