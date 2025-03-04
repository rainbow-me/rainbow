import React from 'react';

import { Canvas, Image, Fill, Blur } from '@shopify/react-native-skia';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';

export function JumboBlurredImageBackground({ width, height }: { width: number; height: number }) {
  const { tokenBackgroundImage } = useTokenLauncherContext();

  return (
    <Canvas style={{ width, height }}>
      <Image x={0} y={0} width={width} height={height} image={tokenBackgroundImage} fit="cover">
        <Blur blur={127.5} mode="clamp" />
      </Image>
      <Fill color="rgba(26, 26, 26, 0.97)" />
    </Canvas>
  );
}
