import React, { useCallback } from 'react';
import { Canvas, Image, Shadow, RoundedRect, Group, processTransform3d, rrect, rect } from '@shopify/react-native-skia';
import { useSharedValue, withRepeat, withTiming, Easing, cancelAnimation, useDerivedValue } from 'react-native-reanimated';
import { useTokenLauncherContext } from '../context/TokenLauncherContext';

const SIZE = 112;
const ROTATION_DURATION = 3000;
const SHADOW_COLOR = 'rgba(0, 0, 0, 0.4)';

export function CreatingAnimatedTokenLogo() {
  const { tokenSkiaImage: image } = useTokenLauncherContext();
  const rotation = useSharedValue(0);

  const startAnimation = useCallback(() => {
    'worklet';
    cancelAnimation(rotation);
    rotation.value = withRepeat(
      withTiming(360, {
        duration: ROTATION_DURATION,
        easing: Easing.linear,
      }),
      -1
    );
  }, [rotation]);

  React.useEffect(() => {
    startAnimation();
  }, [startAnimation]);

  const coinTransform = useDerivedValue(() => {
    const radians = (rotation.value * Math.PI) / 180;
    return processTransform3d([{ perspective: 500 }, { rotateY: radians }]);
  });

  // const edgeTransform = useDerivedValue(() => {
  //   const radians = (rotation.value * Math.PI) / 180;
  //   const cosAngle = Math.cos(radians);

  //   return processTransform3d([{ perspective: 500 }, { scaleX: Math.abs(cosAngle) }]);
  // });

  if (!image) return null;

  return (
    <Canvas style={{ width: SIZE, height: SIZE, borderRadius: SIZE / 2 }}>
      {/* Coin Edge */}
      {/* <Group matrix={edgeTransform} origin={{ x: SIZE / 2, y: SIZE / 2 }}>
        <RoundedRect x={0} y={0} width={SIZE} height={SIZE} r={SIZE / 2} color={'black'} />
      </Group> */}

      {/* Coin face */}
      <Group matrix={coinTransform} origin={{ x: SIZE / 2, y: SIZE / 2 }}>
        <Group clip={rrect(rect(0, 0, SIZE, SIZE), SIZE / 2, SIZE / 2)}>
          <Image x={0} y={0} width={SIZE} height={SIZE} image={image} fit="cover" />
        </Group>
        <RoundedRect x={0} y={0} width={SIZE} height={SIZE} r={SIZE / 2}>
          <Shadow dx={0} dy={-2} blur={4} color={SHADOW_COLOR} inner shadowOnly />
        </RoundedRect>
      </Group>
    </Canvas>
  );
}
