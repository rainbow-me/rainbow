import React, { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { runOnJS, SharedValue, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { useChartsStore } from '@/components/candlestick-charts/candlestickStore';
import { CandleResolution } from '@/components/candlestick-charts/types';
import { AnimatedText, useForegroundColor } from '@/design-system';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { opacity } from '@/__swaps__/utils/swaps';

const BUTTON_GAP = 8;
const PILL_HEIGHT = 34;
const PILL_WIDTH = 56;

export function setCandleResolution(resolution: CandleResolution): void {
  useChartsStore.setState({ candleResolution: resolution });
}

export const CandleSelector = memo(function CandleSelector({ color }: { color: string }) {
  const selectedIndex = useSharedValue(candleResolutionToIndex(useChartsStore.getState().candleResolution));

  const onPress = useCallback(
    (index: number) => {
      'worklet';
      selectedIndex.value = index;
      runOnJS(setCandleResolution)(indexToCandleResolution(index));
    },
    [selectedIndex]
  );

  return (
    <View style={styles.container}>
      <SelectedHighlight color={color} selectedIndex={selectedIndex} />
      <Button color={color} index={0} label="1M" onPress={onPress} selectedIndex={selectedIndex} />
      <Button color={color} index={1} label="15M" onPress={onPress} selectedIndex={selectedIndex} />
      <Button color={color} index={2} label="4H" onPress={onPress} selectedIndex={selectedIndex} />
      <Button color={color} index={3} label="12H" onPress={onPress} selectedIndex={selectedIndex} />
      <Button color={color} index={4} label="1D" onPress={onPress} selectedIndex={selectedIndex} />
    </View>
  );
});

const SelectedHighlight = memo(function SelectedHighlight({ color, selectedIndex }: { color: string; selectedIndex: SharedValue<number> }) {
  const backgroundColor = opacity(color, 0.06);
  const style = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withSpring(
          selectedIndex.value * PILL_WIDTH + selectedIndex.value * BUTTON_GAP,
          SPRING_CONFIGS.snappyMediumSpringConfig
        ),
      },
    ],
  }));

  return <Animated.View style={[styles.selectedHighlight, { backgroundColor }, style]} />;
});

const Button = ({
  color,
  index,
  label,
  selectedIndex,
  onPress,
}: {
  color: string;
  index: number;
  label: string;
  selectedIndex: SharedValue<number>;
  onPress: (index: number) => void;
}) => {
  const labelQuaternary = useForegroundColor('labelQuaternary');

  const textStyle = useAnimatedStyle(() => ({
    color: selectedIndex.value === index ? color : labelQuaternary,
    fontWeight: selectedIndex.value === index ? '800' : '700',
  }));

  return (
    <GestureHandlerButton
      hapticTrigger="tap-end"
      hapticType="soft"
      onPressWorklet={() => {
        'worklet';
        onPress(index);
      }}
      style={styles.button}
    >
      <AnimatedText align="center" color="labelQuaternary" size="15pt" style={textStyle} weight="bold">
        {label}
      </AnimatedText>
    </GestureHandlerButton>
  );
};

function candleResolutionToIndex(resolution: CandleResolution): number {
  'worklet';
  switch (resolution) {
    case CandleResolution.M1:
      return 0;
    case CandleResolution.M15:
      return 1;
    case CandleResolution.H4:
      return 2;
    case CandleResolution.H12:
      return 3;
    case CandleResolution.D1:
      return 4;
    default:
      return 0;
  }
}

function indexToCandleResolution(index: number): CandleResolution {
  'worklet';
  switch (index) {
    case 0:
      return CandleResolution.M1;
    case 1:
      return CandleResolution.M15;
    case 2:
      return CandleResolution.H4;
    case 3:
      return CandleResolution.H12;
    case 4:
      return CandleResolution.D1;
    default:
      return CandleResolution.M1;
  }
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    height: PILL_HEIGHT,
    justifyContent: 'center',
    width: PILL_WIDTH,
  },
  container: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: BUTTON_GAP,
    position: 'relative',
  },
  selectedHighlight: {
    borderCurve: 'continuous',
    borderRadius: PILL_HEIGHT / 2,
    height: PILL_HEIGHT,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    width: PILL_WIDTH,
  },
});
