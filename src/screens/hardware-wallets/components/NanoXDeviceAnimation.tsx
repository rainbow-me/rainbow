import { BlurMask, Canvas, Circle, mix } from '@shopify/react-native-skia';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Source } from 'react-native-fast-image';
import Animated, {
  Easing,
  SharedValue,
  interpolateColor,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import gridDotsDark from '@/assets/dot-grid-dark.png';
import gridDotsLight from '@/assets/dot-grid-light.png';
import ledgerNano from '@/assets/ledger-nano.png';
import { ImgixImage } from '@/components/images';
import { useColorMode } from '@/design-system';
import { useTheme } from '@/theme';
import { deviceUtils } from '@/utils';
import { DEVICE_HEIGHT, DEVICE_WIDTH } from '@/utils/deviceUtils';

const SCALE_FACTOR = deviceUtils.isSmallPhone ? 0.9 : 1;

export const GRID_DOTS_SIZE = DEVICE_WIDTH * SCALE_FACTOR;
export const LEDGER_NANO_HEIGHT = 292 * SCALE_FACTOR;
export const LEDGER_NANO_WIDTH = 216 * SCALE_FACTOR;

const CIRCLES_HEIGHT = DEVICE_WIDTH * 1.5 * SCALE_FACTOR;
const CIRCLES_WIDTH = DEVICE_WIDTH * SCALE_FACTOR;
const CONTAINER_HEIGHT = DEVICE_HEIGHT - 100;

const CIRCLE_COLORS = [
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

type Props = {
  state: 'idle' | 'loading';
  isConnected?: boolean;
};

export function NanoXDeviceAnimation({ state, isConnected }: Props) {
  const { colorMode } = useColorMode();

  // //////////////////////////////////////////////////////////////////
  // Ledger Nano X Image

  const animatedLedgerNanoWrapperStyle = useAnimatedStyle(() => ({
    opacity: withTiming(1),
  }));

  // //////////////////////////////////////////////////////////////////
  // Grid Dots Image

  const animatedGridDotsWrapperStyle = useAnimatedStyle(() => ({
    opacity: withTiming(state === 'loading' ? 1 : 0, { duration: 200 }),
  }));

  // //////////////////////////////////////////////////////////////////
  // Circles Wrapper

  const animatedCirclesWrapperStyle = useAnimatedStyle(() => ({
    opacity: withTiming(state === 'loading' ? 1 : 0, { duration: 200 }),
  }));

  // //////////////////////////////////////////////////////////////////
  // Circle

  const xOrigin = useSharedValue(CIRCLES_WIDTH / 2);
  const yOrigin = useSharedValue(CIRCLES_HEIGHT / 2);

  // //////////////////////////////////////////////////////////////////

  return (
    <>
      <Animated.View style={[animatedGridDotsWrapperStyle, styles.gridDotsWrapper]}>
        <ImgixImage
          size={GRID_DOTS_SIZE}
          source={(colorMode === 'light' ? gridDotsLight : gridDotsDark) as Source}
          style={[styles.gridDotsImage, { opacity: colorMode === 'dark' ? 0.5 : 1 }]}
        />
      </Animated.View>
      <Animated.View style={[animatedCirclesWrapperStyle, styles.circlesWrapper]}>
        <Canvas style={styles.circlesCanvas}>
          {CIRCLE_COLORS.map((color, index) => (
            <AnimatedCircle color={color} isConnected={isConnected} key={index} xOrigin={xOrigin} yOrigin={yOrigin} />
          ))}
        </Canvas>
      </Animated.View>
      <Animated.View style={[animatedLedgerNanoWrapperStyle, styles.ledgerNanoWrapper]}>
        <ImgixImage size={LEDGER_NANO_HEIGHT} source={ledgerNano as Source} style={styles.ledgerNanoImage} />
      </Animated.View>
    </>
  );
}

// ///////////////////////////////////////////////////////////////////

const getRandom = (min: number, max: number) => Math.random() * (max - min) + min;

function AnimatedCircle({
  color,
  xOrigin,
  yOrigin,
  isConnected,
}: {
  color: string;
  xOrigin: SharedValue<number>;
  yOrigin: SharedValue<number>;
  isConnected?: boolean;
}) {
  const isConnectedValue = useSharedValue(isConnected ? 1 : 0);
  const circleRadius = 48;

  const progressOffset = getRandom(0, 2 * Math.PI);
  const progress = useSharedValue(progressOffset);

  const { colors } = useTheme();
  const colorValue = useSharedValue(color);

  const x = useSharedValue(0);
  const xOffset = useSharedValue(circleRadius * getRandom(-1, 1));

  const y = useSharedValue(0);
  const yOffset = useSharedValue(circleRadius * getRandom(-1, 1));

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(progressOffset + (getRandom(-1, 1) > 0 ? 1 : -1) * (2 * Math.PI), { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // logic for connected animation
    isConnectedValue.value = withTiming(isConnected ? 1 : 0, {
      duration: 3000,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [isConnected, isConnectedValue]);

  useAnimatedReaction(
    () => ({
      isConnectedValue: isConnectedValue.value,
      progress: progress.value,
    }),
    ({ isConnectedValue, progress }) => {
      // position animation
      const scalar = 0.5 - 0.4 * isConnectedValue;
      x.value = xOrigin.value + mix(Math.cos(progress), scalar * -circleRadius, scalar * circleRadius) + xOffset.value;
      y.value = yOrigin.value + mix(Math.sin(progress), scalar * -circleRadius, scalar * circleRadius) + yOffset.value;

      // color animation
      colorValue.value = interpolateColor(isConnectedValue, [0, 1], [color, colors.green]);
    }
  );

  return (
    <Circle r={circleRadius} cx={x} cy={y} color={colorValue} opacity={0.3}>
      <BlurMask blur={36} style="normal" />
    </Circle>
  );
}

const styles = StyleSheet.create({
  circlesCanvas: {
    height: CIRCLES_HEIGHT,
    width: CIRCLES_WIDTH,
  },
  circlesWrapper: {
    alignItems: 'center',
    height: CIRCLES_HEIGHT,
    justifyContent: 'center',
    left: (DEVICE_WIDTH - CIRCLES_WIDTH) / 2,
    pointerEvents: 'none',
    position: 'absolute',
    top: (CONTAINER_HEIGHT - CIRCLES_HEIGHT) / 2,
    width: CIRCLES_WIDTH,
  },
  gridDotsImage: {
    height: GRID_DOTS_SIZE,
    width: GRID_DOTS_SIZE,
  },
  gridDotsWrapper: {
    left: (DEVICE_WIDTH - GRID_DOTS_SIZE) / 2,
    position: 'absolute',
    top: (CONTAINER_HEIGHT - GRID_DOTS_SIZE) / 2,
  },
  ledgerNanoImage: {
    height: LEDGER_NANO_HEIGHT,
    width: LEDGER_NANO_WIDTH,
  },
  ledgerNanoWrapper: {
    left: (DEVICE_WIDTH - LEDGER_NANO_WIDTH) / 2,
    position: 'absolute',
    top: (CONTAINER_HEIGHT - LEDGER_NANO_HEIGHT) / 2,
  },
});
