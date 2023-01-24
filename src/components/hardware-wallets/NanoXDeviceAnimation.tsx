import React, { useEffect } from 'react';
import { Source } from 'react-native-fast-image';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {
  BlurMask,
  Canvas,
  Circle,
  mix,
  SkiaMutableValue,
  useSharedValueEffect,
  useValue,
} from '@shopify/react-native-skia';
import ledgerNano from '@/assets/ledger-nano.png';
import gridDotsLight from '@/assets/dot-grid-light.png';
import gridDotsDark from '@/assets/dot-grid-dark.png';
import { ImgixImage } from '@/components/images';
import { useColorMode } from '@/design-system';
import { useDimensions } from '@/hooks';

export function NanoXDeviceAnimation({
  height,
  state,
  width,
}: {
  height: number;
  state: 'idle' | 'loading';
  width: number;
}) {
  const { colorMode } = useColorMode();
  const { isSmallPhone } = useDimensions();

  // //////////////////////////////////////////////////////////////////
  // Ledger Nano X Image

  const scaleFactor = isSmallPhone ? 0.9 : 1;

  const ledgerNanoHeight = 292 * scaleFactor;
  const ledgerNanoWidth = 216 * scaleFactor;

  const animatedLedgerNanoWrapperStyle = useAnimatedStyle(() => ({
    opacity: withTiming(1),
    position: 'absolute',
    top: (height - ledgerNanoHeight) / 2,
    left: (width - ledgerNanoWidth) / 2,
  }));

  // //////////////////////////////////////////////////////////////////
  // Grid Dots Image

  const gridDotsWidth = width * scaleFactor;
  const gridDotsHeight = gridDotsWidth;

  const animatedGridDotsWrapperStyle = useAnimatedStyle(() => ({
    opacity: withTiming(state === 'loading' ? 1 : 0, { duration: 200 }),
    position: 'absolute',
    top: (height - gridDotsHeight) / 2,
    left: (width - gridDotsWidth) / 2,
  }));

  // //////////////////////////////////////////////////////////////////
  // Circles Wrapper

  const circlesWidth = width * scaleFactor;
  const circlesHeight = circlesWidth;

  const animatedCirclesWrapperStyle = useAnimatedStyle(() => ({
    opacity: withTiming(state === 'loading' ? 1 : 0, { duration: 200 }),
    position: 'absolute',
    top: (height - circlesHeight) / 2,
    left: (width - circlesWidth) / 2,
  }));

  // //////////////////////////////////////////////////////////////////
  // Circle

  const colors = [
    // red
    'rgb(255, 0, 0)',
    // green
    'rgb(0, 255, 0)',
    // blue
    'rgb(0, 0, 255)',
    // cyan
    'rgb(0, 255, 255)',
    // magenta
    'rgb(255, 0, 255)',
    // yellow
    'rgb(255, 255, 0)',
    // purple
    'rgb(160, 32, 240)',
  ];

  const xOrigin = useValue(circlesWidth / 2);
  const yOrigin = useValue(circlesHeight / 2);

  // //////////////////////////////////////////////////////////////////

  return (
    <>
      <Animated.View style={animatedGridDotsWrapperStyle}>
        <ImgixImage
          source={
            (colorMode === 'light' ? gridDotsLight : gridDotsDark) as Source
          }
          style={{
            width: gridDotsWidth,
            height: gridDotsHeight,
            opacity: colorMode === 'dark' ? 0.5 : 1,
          }}
          size={gridDotsHeight}
        />
      </Animated.View>
      <Animated.View style={animatedCirclesWrapperStyle}>
        <Canvas style={{ width: circlesWidth, height: circlesHeight }}>
          {colors.map((color, index) => (
            <AnimatedCircle
              key={index}
              color={color}
              xOrigin={xOrigin}
              yOrigin={yOrigin}
            />
          ))}
        </Canvas>
      </Animated.View>
      <Animated.View style={animatedLedgerNanoWrapperStyle}>
        <ImgixImage
          source={ledgerNano as Source}
          style={{ width: ledgerNanoWidth, height: ledgerNanoHeight }}
          size={ledgerNanoHeight}
        />
      </Animated.View>
    </>
  );
}

// ///////////////////////////////////////////////////////////////////

const getRandom = (min: number, max: number) =>
  Math.random() * (max - min) + min;

function AnimatedCircle({
  color,
  xOrigin,
  yOrigin,
}: {
  color: string;
  xOrigin: SkiaMutableValue<number>;
  yOrigin: SkiaMutableValue<number>;
}) {
  const circleRadius = 48;

  const progressOffset = getRandom(0, 2 * Math.PI);
  const progress = useSharedValue(progressOffset);

  const x = useValue(0);
  const xOffset = useValue(circleRadius * getRandom(-1, 1));

  const y = useValue(0);
  const yOffset = useValue(circleRadius * getRandom(-1, 1));

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(
        progressOffset + (getRandom(-1, 1) > 0 ? 1 : -1) * (2 * Math.PI),
        { duration: 3000, easing: Easing.linear }
      ),
      -1,
      false
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useSharedValueEffect(() => {
    const scalar = 0.2;
    x.current =
      xOrigin.current -
      mix(
        Math.cos(progress.value),
        scalar * -circleRadius,
        scalar * circleRadius
      ) +
      xOffset.current;
    y.current =
      yOrigin.current -
      mix(
        Math.sin(progress.value),
        scalar * -circleRadius,
        scalar * circleRadius
      ) +
      yOffset.current;
  }, progress);

  return (
    <Circle r={circleRadius} cx={x} cy={y} color={color} opacity={0.3}>
      <BlurMask blur={32} style="normal" />
    </Circle>
  );
}
