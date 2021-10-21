import { useContext } from 'react';
import { ColorModeContext } from './ColorMode';
import { ColorDefinition, ForegroundColor, selectColor } from './palette';

export type CustomColor = {
  custom: ColorDefinition;
};

export function useForegroundColor(
  color: ForegroundColor | CustomColor
): string {
  const { colorMode, contextualPalette } = useContext(ColorModeContext);

  if (typeof color === 'object') {
    return selectColor(color.custom, colorMode);
  }

  return contextualPalette.foreground[color];
}
