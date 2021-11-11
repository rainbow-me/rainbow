import React, { useContext, useMemo } from 'react';
import { ColorModeContext, ColorModeProvider } from '../../color/ColorMode';
import { BackgroundColor } from '../../color/palettes';

export type BackgroundProviderProps = {
  color: BackgroundColor;
  children: (style: { backgroundColor: string }) => JSX.Element;
};

/**
 * @description Allows third-party elements to be rendered with a standard
 * background color via a render prop, while also setting up the
 * `ColorModeProvider` so that nested elements can correctly infer whether
 * they are in a dark or light context. The `style` object containing the
 * `backgroundColor` value is memoized and passed to the render function.
 */
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
