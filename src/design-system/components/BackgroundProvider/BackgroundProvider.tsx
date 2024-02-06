import React, { useContext, useMemo } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { AccentColorContext } from '../../color/AccentColorContext';
import { ColorModeContext, ColorModeProvider } from '../../color/ColorMode';
import { BackgroundColor, getDefaultAccentColorForColorMode } from '../../color/palettes';

export type BackgroundProviderProps = {
  color: BackgroundColor | 'accent';
  children: ({
    backgroundColor,
    backgroundStyle,
  }: {
    backgroundColor: ViewStyle['backgroundColor'];
    backgroundStyle: StyleProp<ViewStyle>;
  }) => JSX.Element;
  style?: StyleProp<ViewStyle>;
};

/**
 * @description Allows third-party elements to be rendered with a standard
 * background color via a render prop, while also setting up the
 * `ColorModeProvider` so that nested elements can correctly infer whether
 * they are in a dark or light context. The `style` object containing the
 * `backgroundColor` value is memoized and passed to the render function.
 */
export function BackgroundProvider({ color, children, style: styleProp }: BackgroundProviderProps) {
  const { backgroundColors, colorMode } = useContext(ColorModeContext);
  const accentColorContextValue = useContext(AccentColorContext);
  const accentColor = accentColorContextValue ?? getDefaultAccentColorForColorMode(colorMode);
  const background = color === 'accent' ? accentColor : backgroundColors[color];
  const style = useMemo(
    () => [{ backgroundColor: background.color }, ...(Array.isArray(styleProp) ? styleProp : [styleProp])],
    [background, styleProp]
  );

  const child = children({
    backgroundColor: background.color,
    backgroundStyle: style,
  });

  return <ColorModeProvider value={background.mode}>{child}</ColorModeProvider>;
}

export function useBackgroundColor(color: BackgroundColor) {
  const { backgroundColors } = useContext(ColorModeContext);
  return backgroundColors[color].color;
}
