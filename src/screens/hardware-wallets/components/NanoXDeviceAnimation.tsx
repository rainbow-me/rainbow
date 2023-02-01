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
import { deviceUtils } from '@/utils';
import { useDimensions } from '@/hooks';
import { useTheme } from '@/theme';

const SCALE_FACTOR = deviceUtils.isSmallPhone ? 0.9 : 1;
const CIRCLES_SIZE = deviceUtils.dimensions.width * SCALE_FACTOR;
export const GRID_DOTS_SIZE = deviceUtils.dimensions.width * SCALE_FACTOR;
export const LEDGER_NANO_HEIGHT = 292 * SCALE_FACTOR;
export const LEDGER_NANO_WIDTH = 216 * SCALE_FACTOR;

type Props = {
  state: 'idle' | 'loading';
  isConnected?: boolean;
};

export function NanoXDeviceAnimation({ state, isConnected }: Props) {
  const { colorMode } = useColorMode();
  const { colors } = useTheme();
  const { width, height } = useDimensions();

  // //////////////////////////////////////////////////////////////////
  // Ledger Nano X Image

  const animatedLedgerNanoWrapperStyle = useAnimatedStyle(() => ({
    opacity: withTiming(1),
    position: 'absolute',
    top: (height - LEDGER_NANO_HEIGHT) / 2,
    left: (width - LEDGER_NANO_WIDTH) / 2,
  }));

  // //////////////////////////////////////////////////////////////////
  // Grid Dots Image

  const animatedGridDotsWrapperStyle = useAnimatedStyle(() => ({
    opacity: withTiming(state === 'loading' ? 1 : 0, { duration: 200 }),
    position: 'absolute',
    top: (height - GRID_DOTS_SIZE) / 2,
    left: (width - GRID_DOTS_SIZE) / 2,
  }));

  // //////////////////////////////////////////////////////////////////
  // Circles Wrapper

  const animatedCirclesWrapperStyle = useAnimatedStyle(() => ({
    opacity: withTiming(state === 'loading' ? 1 : 0, { duration: 200 }),
    position: 'absolute',
    top: (height - CIRCLES_SIZE) / 2,
    left: (width - CIRCLES_SIZE) / 2,
  }));

  // //////////////////////////////////////////////////////////////////
  // Circle

  const circleColors = [
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

  if (isConnected) {
    circleColors.push(
      ...[colors.green, colors.green, colors.green, colors.green]
    );
  }

  const xOrigin = useValue(CIRCLES_SIZE / 2);
  const yOrigin = useValue(CIRCLES_SIZE / 2);

  // //////////////////////////////////////////////////////////////////

  return (
    <>
      <Animated.View style={animatedGridDotsWrapperStyle}>
        <ImgixImage
          source={
            (colorMode === 'light' ? gridDotsLight : gridDotsDark) as Source
          }
          style={{
            width: GRID_DOTS_SIZE,
            height: GRID_DOTS_SIZE,
            opacity: colorMode === 'dark' ? 0.5 : 1,
          }}
          size={GRID_DOTS_SIZE}
        />
      </Animated.View>
      <Animated.View style={animatedCirclesWrapperStyle}>
        <Canvas style={{ width: CIRCLES_SIZE, height: CIRCLES_SIZE }}>
          {circleColors.map((color, index) => (
            <AnimatedCircle
              key={index}
              color={isConnected ? colors.green : color}
              xOrigin={xOrigin}
              yOrigin={yOrigin}
              isConnected={isConnected}
            />
          ))}
        </Canvas>
      </Animated.View>
      <Animated.View style={animatedLedgerNanoWrapperStyle}>
        <ImgixImage
          source={ledgerNano as Source}
          style={{ width: LEDGER_NANO_WIDTH, height: LEDGER_NANO_HEIGHT }}
          size={LEDGER_NANO_HEIGHT}
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
  isConnected,
}: {
  color: string;
  xOrigin: SkiaMutableValue<number>;
  yOrigin: SkiaMutableValue<number>;
  isConnected?: boolean;
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
    const scalar = isConnected ? 0.2 : 0.5;
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
