import React, { useContext, useMemo } from 'react';
import { ColorModeContext, ColorModeProvider } from '../../color/ColorMode';
import { BackgroundColor } from '../../color/palettes';

export type BackgroundProviderProps = {
  color: BackgroundColor;
  children: (style: { backgroundColor: string }) => JSX.Element;
};

export function BackgroundProvider({
  color,
  children,
}: BackgroundProviderProps) {
  const { colorMode, backgroundColors } = useContext(ColorModeContext);
  const background = backgroundColors[color];
  const style = useMemo(() => ({ backgroundColor: background.color }), [
    background,
  ]);

  const child = children(style);

  return background.mode !== colorMode ? (
    <ColorModeProvider value={background.mode}>{child}</ColorModeProvider>
  ) : (
    child
  );
}
