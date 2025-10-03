import React, { memo, RefObject, useCallback, useMemo, useRef } from 'react';
import { ScrollView, ScrollViewProps, StyleSheet, View } from 'react-native';
import Animated, {
  AnimatedStyle,
  DerivedValue,
  SharedValue,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SPRING_CONFIGS, easing } from '@/components/animations/animationConfigs';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { AnimatedText, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { IS_IOS } from '@/env';
import { useStableValue } from '@/hooks/useStableValue';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { opacity } from '@/__swaps__/utils/swaps';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { getSolidColorEquivalent } from '@/worklets/colors';
import { GREEN_CANDLE_COLOR, RED_CANDLE_COLOR } from '../candlestick/constants';
import { CANDLE_RESOLUTIONS, LINE_CHART_TIME_PERIODS } from '../constants';
import { chartsActions, useChartsStore, useChartType } from '../stores/chartsStore';
import { CandleResolution, ChartType, LineChartTimePeriod } from '../types';

// ============ Constants ====================================================== //

const PILL = Object.freeze({ gap: 3, height: 34, width: 56 });

const BASE_HORIZONTAL_INSET = 28;
const CHART_TOGGLE_LEFT_MARGIN = 12;
const CHART_TOGGLE_SIZE = PILL.height;
const RIGHT_INSET = BASE_HORIZONTAL_INSET + CHART_TOGGLE_SIZE + CHART_TOGGLE_LEFT_MARGIN;

const CANDLE_RESOLUTION_COUNT = Object.keys(CANDLE_RESOLUTIONS).length;
const CANDLESTICK_CONTENT_WIDTH = PILL.width * CANDLE_RESOLUTION_COUNT + PILL.gap * (CANDLE_RESOLUTION_COUNT - 1);
const LINE_CHART_PERIOD_COUNT = Object.keys(LINE_CHART_TIME_PERIODS).length;

// ============ Types ========================================================== //

type CandlestickParams = { candleResolution: CandleResolution; lineChartTimePeriod?: undefined };
type LineChartParams = { candleResolution?: undefined; lineChartTimePeriod: LineChartTimePeriod };
type SetTimeframeParams = CandlestickParams | LineChartParams;

type TimeframeButtonProps = {
  color: string;
  index: number;
  label: string;
  selectedIndex: SharedValue<number>;
} & (
  | (CandlestickParams & {
      onPress: ({ candleResolution }: CandlestickParams) => void;
    })
  | (LineChartParams & {
      onPress: ({ lineChartTimePeriod }: LineChartParams) => void;
    })
);

// ============ Timeframe Components =========================================== //

const { setCandleResolution, setLineChartTimePeriod } = chartsActions;

function setTimeframe(selectedIndex: SharedValue<number>, { candleResolution, lineChartTimePeriod }: SetTimeframeParams): void {
  'worklet';
  const isLineChart = lineChartTimePeriod !== undefined;
  if (isLineChart) {
    selectedIndex.value = LINE_CHART_TIME_PERIODS[lineChartTimePeriod].index;
    runOnJS(setLineChartTimePeriod)(lineChartTimePeriod);
  } else {
    selectedIndex.value = CANDLE_RESOLUTIONS[candleResolution].index;
    runOnJS(setCandleResolution)(candleResolution);
  }
}

export const TimeframeSelector = memo(function TimeframeSelector({
  backgroundColor,
  color,
  hideChartTypeToggle,
}: {
  backgroundColor: string;
  color: string;
  hideChartTypeToggle?: boolean;
}) {
  const chartType = useChartType();
  const initialState = useStableValue(() => getInitialState(chartType));
  const scrollViewRef = useRef<ScrollView>(null);
  const selectedIndex = useSharedValue(initialState.initialIndex);
  const scrollViewProps = useMemo(() => getScrollViewProps(chartType, hideChartTypeToggle), [chartType, hideChartTypeToggle]);

  const buttonWidth = useDerivedValue(() => {
    if (chartType === ChartType.Candlestick) return PILL.width;
    const spaceForPills = DEVICE_WIDTH - BASE_HORIZONTAL_INSET - RIGHT_INSET - PILL.gap * (LINE_CHART_PERIOD_COUNT - 1);
    return spaceForPills / LINE_CHART_PERIOD_COUNT;
  });

  const onPress = useCallback(
    ({ candleResolution, lineChartTimePeriod }: SetTimeframeParams) => {
      'worklet';
      setTimeframe(selectedIndex, candleResolution ? { candleResolution } : { lineChartTimePeriod });
    },
    [selectedIndex]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        centerContent={!IS_IOS || chartType === ChartType.Line || hideChartTypeToggle}
        contentContainerStyle={scrollViewProps.contentContainerStyle}
        contentOffset={initialState.contentOffset}
        horizontal
        maintainVisibleContentPosition={scrollViewProps.maintainVisibleContentPosition}
        ref={scrollViewRef}
        showsHorizontalScrollIndicator={false}
        scrollEnabled={chartType === ChartType.Candlestick}
        style={scrollViewProps.style}
      >
        <SelectedHighlight buttonWidth={buttonWidth} color={color} selectedIndex={selectedIndex} />

        {chartType === ChartType.Candlestick ? (
          <CandlestickButtons color={color} onPress={onPress} selectedIndex={selectedIndex} />
        ) : (
          <LineChartButtons color={color} onPress={onPress} selectedIndex={selectedIndex} />
        )}
      </ScrollView>

      <EasingGradient
        easing={easing.in.sin}
        endColor={backgroundColor}
        endPosition="left"
        startColor={backgroundColor}
        startPosition="right"
        steps={8}
        style={styles.leftFade}
      />

      <EasingGradient
        easing={easing.in.sin}
        endColor={backgroundColor}
        endPosition="right"
        pointerEvents="auto"
        startColor={backgroundColor}
        startPosition="left"
        steps={8}
        style={hideChartTypeToggle ? [styles.rightFade, styles.symmetricalRightFade] : styles.rightFade}
      />

      {hideChartTypeToggle ? null : (
        <ChartTypeToggle
          backgroundColor={backgroundColor}
          color={color}
          initialChartType={initialState.initialChartType}
          scrollViewRef={scrollViewRef}
          selectedIndex={selectedIndex}
        />
      )}
    </View>
  );
});

const SelectedHighlight = memo(function SelectedHighlight({
  buttonWidth,
  color,
  selectedIndex,
}: {
  buttonWidth: DerivedValue<number>;
  color: string;
  selectedIndex: SharedValue<number>;
}) {
  const { isDarkMode } = useColorMode();
  const backgroundColor = opacity(color, 0.06);
  const borderColor = isDarkMode ? backgroundColor : opacity(color, 0.03);

  const translateX = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withSpring(
          selectedIndex.value * (buttonWidth.value + PILL.gap) + BASE_HORIZONTAL_INSET,
          SPRING_CONFIGS.snappyMediumSpringConfig
        ),
      },
    ],
  }));

  const width = useAnimatedStyle(() => ({ width: withSpring(buttonWidth.value, SPRING_CONFIGS.snappyMediumSpringConfig) }));

  return <Animated.View style={[styles.selectedHighlight, { backgroundColor, borderColor }, translateX, width]} />;
});

const TimeframeButton = ({ candleResolution, color, index, label, lineChartTimePeriod, selectedIndex, onPress }: TimeframeButtonProps) => {
  const labelQuaternary = useForegroundColor('labelQuaternary');

  const textStyle = useAnimatedStyle(() => {
    const isSelected = selectedIndex.value === index;
    const textColor = isSelected ? color : labelQuaternary;
    if (!IS_IOS) return { color: textColor };
    return {
      color: textColor,
      fontWeight: isSelected ? '800' : '700',
    };
  });

  return (
    <GestureHandlerButton
      hapticTrigger="tap-end"
      hapticType="soft"
      hitSlop={4}
      onPressWorklet={() => {
        'worklet';
        candleResolution ? onPress({ candleResolution }) : onPress({ lineChartTimePeriod });
      }}
      style={styles.button}
    >
      <AnimatedText align="center" color="labelQuaternary" size="15pt" style={textStyle} weight="bold">
        {label}
      </AnimatedText>
    </GestureHandlerButton>
  );
};

// ============ Mapped Timeframe Buttons ======================================= //

const CandlestickButtons = ({
  color,
  onPress,
  selectedIndex,
}: {
  color: string;
  onPress: ({ candleResolution }: { candleResolution: CandleResolution }) => void;
  selectedIndex: SharedValue<number>;
}) => {
  return Object.values(CANDLE_RESOLUTIONS).map(({ index, label, resolution }) => (
    <TimeframeButton
      candleResolution={resolution}
      color={color}
      index={index}
      key={resolution}
      label={label}
      onPress={onPress}
      selectedIndex={selectedIndex}
    />
  ));
};

const LineChartButtons = ({
  color,
  onPress,
  selectedIndex,
}: {
  color: string;
  onPress: ({ lineChartTimePeriod }: { lineChartTimePeriod: LineChartTimePeriod }) => void;
  selectedIndex: SharedValue<number>;
}) => {
  return Object.values(LINE_CHART_TIME_PERIODS).map(({ index, label, timePeriod }) => (
    <TimeframeButton
      color={color}
      index={index}
      key={timePeriod}
      label={label}
      lineChartTimePeriod={timePeriod}
      onPress={onPress}
      selectedIndex={selectedIndex}
    />
  ));
};

// ============ Chart Type Toggle ============================================== //

const ChartTypeToggle = memo(function ChartTypeToggle({
  backgroundColor,
  color,
  initialChartType,
  scrollViewRef,
  selectedIndex,
}: {
  backgroundColor: string;
  color: string;
  initialChartType: ChartType;
  scrollViewRef: RefObject<ScrollView | null>;
  selectedIndex: SharedValue<number>;
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

  const toggleChartType = useCallback(() => {
    toggleChartTypeAndScroll(scrollViewRef, selectedIndex);
  }, [selectedIndex, scrollViewRef]);

  const onPress = useCallback(() => {
    'worklet';
    selectedChartType.value = selectedChartType.value === ChartType.Candlestick ? ChartType.Line : ChartType.Candlestick;
    runOnJS(toggleChartType)();
  }, [selectedChartType, toggleChartType]);

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
  contentOffset: { x: number; y: number };
  initialChartType: ChartType;
  initialIndex: number;
} {
  const initialIndex = getInitialSelectedIndex(chartType);
  const x = getInitialScrollPosition(initialIndex);
  return { contentOffset: { x, y: 0 }, initialChartType: chartType, initialIndex };
}

function getInitialSelectedIndex(chartType: ChartType): number {
  return chartType === ChartType.Candlestick
    ? CANDLE_RESOLUTIONS[useChartsStore.getState().candleResolution].index
    : LINE_CHART_TIME_PERIODS[useChartsStore.getState().lineChartTimePeriod].index;
}

function getInitialScrollPosition(buttonIndex: number): number {
  const buttonOffset = buttonIndex * (PILL.width + PILL.gap) + BASE_HORIZONTAL_INSET;
  const availableScrollWidth = DEVICE_WIDTH - BASE_HORIZONTAL_INSET * 2;
  const centerOffset = availableScrollWidth / 2;
  return Math.max(0, buttonOffset - centerOffset);
}

function getScrollViewProps(
  chartType: ChartType,
  hideChartTypeToggle: boolean | undefined
): Pick<ScrollViewProps, 'contentContainerStyle' | 'maintainVisibleContentPosition' | 'style'> {
  const isLineChart = chartType === ChartType.Line;
  return {
    contentContainerStyle: isLineChart
      ? [styles.contentContainer, { width: DEVICE_WIDTH }]
      : hideChartTypeToggle
        ? [styles.contentContainer, styles.hideChartToggleOverride]
        : styles.contentContainer,
    maintainVisibleContentPosition: IS_IOS ? undefined : { minIndexForVisible: 0 },
    style: styles.scrollView,
  };
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

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    flex: 1,
    height: PILL.height,
    justifyContent: 'center',
    width: PILL.width,
  },
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
  container: {
    position: 'relative',
    width: '100%',
  },
  contentContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: PILL.gap,
    marginVertical: -12,
    paddingLeft: BASE_HORIZONTAL_INSET,
    paddingRight: RIGHT_INSET,
    paddingVertical: 12,
    position: 'relative',
    width: IS_IOS ? undefined : CANDLESTICK_CONTENT_WIDTH + BASE_HORIZONTAL_INSET + RIGHT_INSET,
  },
  hideChartToggleOverride: {
    paddingRight: BASE_HORIZONTAL_INSET,
    width: IS_IOS ? undefined : CANDLESTICK_CONTENT_WIDTH + BASE_HORIZONTAL_INSET * 2,
  },
  leftFade: {
    height: '100%',
    left: 0,
    pointerEvents: 'none',
    position: 'absolute',
    top: 0,
    width: BASE_HORIZONTAL_INSET,
  },
  rightFade: {
    height: '100%',
    position: 'absolute',
    right: 0,
    top: 0,
    width: RIGHT_INSET,
  },
  scrollView: {
    marginVertical: -12,
    overflow: 'hidden',
    paddingVertical: 12,
    width: '100%',
  },
  selectedHighlight: {
    borderWidth: 2,
    borderCurve: 'continuous',
    borderRadius: PILL.height / 2,
    height: PILL.height,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    width: PILL.width,
  },
  symmetricalRightFade: {
    pointerEvents: 'none',
    width: BASE_HORIZONTAL_INSET,
  },
});
