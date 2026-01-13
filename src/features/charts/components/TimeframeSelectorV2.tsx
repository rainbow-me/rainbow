import React, { memo, RefObject, useCallback, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { AnimatedStyle, SharedValue, runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { globalColors } from '@/design-system/color/palettes';
import { useColorMode } from '@/design-system/color/ColorMode';
import { IS_IOS } from '@/env';
import { useStableValue } from '@/hooks/useStableValue';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { opacity } from '@/framework/ui/utils/opacity';
import { getSolidColorEquivalent } from '@/worklets/colors';
import { GREEN_CANDLE_COLOR, RED_CANDLE_COLOR } from '../candlestick/constants';
import { CANDLE_RESOLUTIONS, LINE_CHART_TIME_PERIODS } from '../constants';
import { chartsActions, useChartsStore, useChartType } from '../stores/chartsStore';
import { CandleResolution, ChartType, LineChartTimePeriod } from '../types';
import { BASE_HORIZONTAL_INSET, PILL, TimeframeSelectorCore } from './TimeframeSelectorCore';

// ============ Constants ====================================================== //

const CHART_TOGGLE_LEFT_MARGIN = 12;
const CHART_TOGGLE_SIZE = PILL.height;
const RIGHT_INSET = BASE_HORIZONTAL_INSET + CHART_TOGGLE_SIZE + CHART_TOGGLE_LEFT_MARGIN;

// ============ Derived Options ================================================ //

const CANDLESTICK_OPTIONS = Object.values(CANDLE_RESOLUTIONS).map(r => ({
  label: r.label,
  value: r.resolution,
}));

const LINE_CHART_OPTIONS = Object.values(LINE_CHART_TIME_PERIODS).map(p => ({
  label: p.label,
  value: p.timePeriod,
}));

// ============ TimeframeSelector ============================================== //

const { setCandleResolution, setLineChartTimePeriod } = chartsActions;

export const TimeframeSelectorV2 = memo(function TimeframeSelectorV2({
  backgroundColor,
  color,
  hideChartTypeToggle,
}: {
  backgroundColor: string;
  color: string;
  hideChartTypeToggle?: boolean;
}) {
  const chartType = useChartType();
  const scrollViewRef = useRef<ScrollView>(null);

  const initialState = useStableValue(() => getInitialState(chartType));
  const selectedIndex = useSharedValue(initialState.initialIndex);

  const options = chartType === ChartType.Candlestick ? CANDLESTICK_OPTIONS : LINE_CHART_OPTIONS;
  const layout = chartType === ChartType.Candlestick ? 'scrollable' : 'fill';

  const onSelectWorklet = useCallback(
    (value: string, index: number) => {
      'worklet';
      selectedIndex.value = index;
      if (chartType === ChartType.Candlestick) {
        runOnJS(setCandleResolution)(value as CandleResolution);
      } else {
        runOnJS(setLineChartTimePeriod)(value as LineChartTimePeriod);
      }
    },
    [chartType, selectedIndex]
  );

  const toggleChartType = useCallback(() => {
    toggleChartTypeAndScroll(scrollViewRef, selectedIndex);
  }, [selectedIndex]);

  return (
    <TimeframeSelectorCore
      backgroundColor={backgroundColor}
      color={color}
      initialScrollIndex={initialState.initialIndex}
      layout={layout}
      onSelectWorklet={onSelectWorklet}
      options={options}
      rightAccessory={
        hideChartTypeToggle ? undefined : (
          <ChartTypeToggle
            backgroundColor={backgroundColor}
            color={color}
            initialChartType={initialState.initialChartType}
            onToggle={toggleChartType}
          />
        )
      }
      rightInset={hideChartTypeToggle ? BASE_HORIZONTAL_INSET : RIGHT_INSET}
      scrollViewRef={scrollViewRef}
      selectedIndex={selectedIndex}
    />
  );
});

// ============ Chart Type Toggle ============================================== //

const ChartTypeToggle = memo(function ChartTypeToggle({
  backgroundColor,
  color,
  initialChartType,
  onToggle,
}: {
  backgroundColor: string;
  color: string;
  initialChartType: ChartType;
  onToggle: () => void;
}) {
  const selectedChartType = useSharedValue(initialChartType);

  const { isDarkMode } = useColorMode();
  const borderColor = opacity(color, isDarkMode ? 0.08 : 0.04);
  const greenCandleBorder = opacity(globalColors[isDarkMode ? 'white100' : 'grey100'], isDarkMode ? 0.28 : 0.02);
  const redCandleBorder = opacity(globalColors[isDarkMode ? 'white100' : 'grey100'], isDarkMode ? 0.2 : 0.02);

  const mixedBackgroundColors = {
    highlighted: getSolidColorEquivalent({ background: backgroundColor, foreground: color, opacity: 0.08 }),
    darkened: isDarkMode
      ? getSolidColorEquivalent({ background: backgroundColor, foreground: globalColors.grey100, opacity: 0.08 })
      : globalColors.white100,
  };

  const buttonBackgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: withSpring(
      mixedBackgroundColors[selectedChartType.value === ChartType.Candlestick ? 'highlighted' : 'darkened'],
      SPRING_CONFIGS.snappyMediumSpringConfig
    ),
  }));

  const onPress = useCallback(() => {
    'worklet';
    selectedChartType.value = selectedChartType.value === ChartType.Candlestick ? ChartType.Line : ChartType.Candlestick;
    runOnJS(onToggle)();
  }, [onToggle, selectedChartType]);

  return (
    <GestureHandlerButton
      hapticTrigger="tap-end"
      hapticType="soft"
      hitSlop={{ bottom: 12, left: 8, right: 12, top: 12 }}
      onPressWorklet={onPress}
      scaleTo={0.75}
      style={[styles.chartTypeToggle, { borderColor }, buttonBackgroundStyle]}
    >
      <Animated.View style={styles.candlesWrapper}>
        <Candle
          backgroundColorStyle={buttonBackgroundStyle}
          borderColor={redCandleBorder}
          candleHeight={8}
          color="red"
          wickBottomOffset={3}
          wickTopOffset={4}
        />
        <Candle
          backgroundColorStyle={buttonBackgroundStyle}
          borderColor={greenCandleBorder}
          candleHeight={10}
          color="green"
          wickBottomOffset={3}
          wickTopOffset={3}
        />
      </Animated.View>
    </GestureHandlerButton>
  );
});

// ============ Candle Icon ==================================================== //

const Candle = ({
  backgroundColorStyle,
  borderColor,
  candleHeight,
  color,
  wickBottomOffset,
  wickTopOffset,
}: {
  backgroundColorStyle: AnimatedStyle;
  borderColor: string;
  candleHeight: number;
  color: 'green' | 'red';
  wickBottomOffset: number;
  wickTopOffset: number;
}) => {
  const candleColor = color === 'green' ? GREEN_CANDLE_COLOR : RED_CANDLE_COLOR;
  return (
    <Animated.View style={[styles.candleContainer, { shadowColor: candleColor }, backgroundColorStyle]}>
      <View
        style={[
          styles.candleWick,
          {
            backgroundColor: candleColor,
            height: candleHeight + wickBottomOffset + wickTopOffset,
            top: -wickTopOffset,
          },
        ]}
      />
      <View style={[styles.candleBody, { backgroundColor: candleColor, borderColor, height: candleHeight }]} />
    </Animated.View>
  );
};

// ============ Utilities ====================================================== //

function getInitialState(chartType: ChartType): {
  initialChartType: ChartType;
  initialIndex: number;
} {
  const initialIndex = getInitialSelectedIndex(chartType);
  return { initialChartType: chartType, initialIndex };
}

function getInitialSelectedIndex(chartType: ChartType): number {
  return chartType === ChartType.Candlestick
    ? CANDLE_RESOLUTIONS[useChartsStore.getState().candleResolution].index
    : LINE_CHART_TIME_PERIODS[useChartsStore.getState().lineChartTimePeriod].index;
}

function toggleChartTypeAndScroll(scrollViewRef: RefObject<ScrollView | null>, selectedIndex: SharedValue<number>): void {
  const newChartType = chartsActions.toggleChartType();
  const newSelectedIndex = getInitialSelectedIndex(newChartType);
  const isLineChart = newChartType === ChartType.Line;
  selectedIndex.value = newSelectedIndex;

  if (IS_IOS && isLineChart) return;

  const scrollTo = () =>
    scrollViewRef.current?.setNativeProps({
      contentOffset: {
        x: isLineChart ? 0 : getInitialScrollPosition(newSelectedIndex),
        y: 0,
      },
    });

  if (IS_IOS || isLineChart) scrollTo();
  else requestAnimationFrame(scrollTo);
}

function getInitialScrollPosition(buttonIndex: number): number {
  const buttonOffset = buttonIndex * (PILL.width + PILL.gap) + BASE_HORIZONTAL_INSET;
  const availableScrollWidth = DEVICE_WIDTH - BASE_HORIZONTAL_INSET * 2;
  const centerOffset = availableScrollWidth / 2;
  return Math.max(0, buttonOffset - centerOffset);
}

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  candleBody: {
    borderCurve: 'continuous',
    borderRadius: 1.8,
    borderWidth: IS_IOS ? 1 : 0,
    overflow: 'hidden',
    position: 'relative',
    width: 5,
  },
  candleContainer: {
    alignItems: 'center',
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 4.5,
    width: 5,
  },
  candleWick: {
    alignSelf: 'center',
    borderCurve: 'continuous',
    borderRadius: 1,
    height: 12,
    marginHorizontal: 2,
    opacity: 0.64,
    position: 'absolute',
    width: 1,
  },
  candlesWrapper: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 2,
  },
  chartTypeToggle: {
    alignItems: 'center',
    borderRadius: PILL.height / 2,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 2,
    height: PILL.height,
    justifyContent: 'center',
    position: 'absolute',
    right: BASE_HORIZONTAL_INSET,
    top: 0,
    width: PILL.height,
  },
});
