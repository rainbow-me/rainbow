import React, { ReactNode, useContext, useMemo } from 'react';
import { View } from 'react-native';
import { ColorModeContext, ColorModeProvider } from '../../color/ColorMode';
import { BackgroundColor } from '../../color/palettes';

export type BackgroundProps = {
  color: BackgroundColor;
  children:
    | ReactNode
    | ((renderProps: { style: { backgroundColor: string } }) => ReactNode);
};

export function Background({ color, children }: BackgroundProps) {
  const { colorMode, backgroundColors } = useContext(ColorModeContext);
  const background = backgroundColors[color];
  const style = useMemo(() => ({ backgroundColor: background.color }), [
    background,
  ]);

  const child =
    typeof children === 'function' ? (
      children({ style })
    ) : (
      <View style={style}>{children}</View>
    );

  return background.setColorMode !== colorMode ? (
    <ColorModeProvider value={background.setColorMode}>
      {child}
    </ColorModeProvider>
  ) : (
    child
  );
}
