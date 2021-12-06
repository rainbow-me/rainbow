import React, { useContext, useMemo } from 'react';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../color/AccentColorContext' was resolv... Remove this comment to see the full error message
import { AccentColorContext } from '../../color/AccentColorContext';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../color/ColorMode' was resolved to '/U... Remove this comment to see the full error message
import { ColorModeContext, ColorModeProvider } from '../../color/ColorMode';
import { BackgroundColor } from '../../color/palettes';

export type BackgroundProviderProps = {
  color: BackgroundColor | 'accent';
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
  const accentColor = useContext(AccentColorContext);
  const background = color === 'accent' ? accentColor : backgroundColors[color];
  const style = useMemo(() => ({ backgroundColor: background.color }), [
    background,
  ]);

  const child = children(style);

  return background.mode !== colorMode ? (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ColorModeProvider value={background.mode}>{child}</ColorModeProvider>
  ) : (
    child
  );
}
