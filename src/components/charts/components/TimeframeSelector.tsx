import React, { memo, RefObject, useCallback, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  AnimatedStyle,
  Easing,
  SharedValue,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
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
import { chartsActions, useChartsStore, useChartType } from '../state/chartsStore';
import { CandleResolution, ChartType, LineChartTimePeriod } from '../types';

// ============ Constants ====================================================== //

const PILL = { gap: 3, height: 34, width: 56 };

const BASE_HORIZONTAL_INSET = 28;
const CHART_TOGGLE_LEFT_MARGIN = 12;
const CHART_TOGGLE_SIZE = PILL.height;
const RIGHT_INSET = BASE_HORIZONTAL_INSET + CHART_TOGGLE_SIZE + CHART_TOGGLE_LEFT_MARGIN;

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

export const TimeframeSelector = memo(function TimeframeSelector({ backgroundColor, color }: { backgroundColor: string; color: string }) {
  const chartType = useChartType();
  const initialState = useStableValue(() => getInitialState(chartType));
  const scrollViewRef = useRef<ScrollView>(null);
  const selectedIndex = useSharedValue(initialState.initialIndex);

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
        contentContainerStyle={styles.contentContainer}
        contentOffset={initialState.contentOffset}
        horizontal
        ref={scrollViewRef}
        showsHorizontalScrollIndicator={false}
        scrollEnabled={chartType === ChartType.Candlestick}
        style={[styles.scrollView, { paddingLeft: chartType === ChartType.Line ? 8 : 0 }]}
      >
        <SelectedHighlight color={color} selectedIndex={selectedIndex} />

        {chartType === ChartType.Candlestick ? (
          <CandlestickButtons color={color} onPress={onPress} selectedIndex={selectedIndex} />
        ) : (
          <LineChartButtons color={color} onPress={onPress} selectedIndex={selectedIndex} />
        )}
      </ScrollView>

      <EasingGradient
        easing={Easing.in(Easing.sin)}
        endColor={backgroundColor}
        endPosition="left"
        startColor={backgroundColor}
        startPosition="right"
        steps={8}
        style={styles.leftFade}
      />

      <EasingGradient
        easing={Easing.in(Easing.sin)}
        endColor={backgroundColor}
        endPosition="right"
        pointerEvents="auto"
        startColor={backgroundColor}
        startPosition="left"
        steps={8}
        style={styles.rightFade}
      />

      <ChartTypeToggle
        backgroundColor={backgroundColor}
        color={color}
        initialChartType={initialState.initialChartType}
        scrollViewRef={scrollViewRef}
        selectedIndex={selectedIndex}
      />
    </View>
  );
});

const SelectedHighlight = memo(function SelectedHighlight({ color, selectedIndex }: { color: string; selectedIndex: SharedValue<number> }) {
  const { isDarkMode } = useColorMode();
  const backgroundColor = opacity(color, 0.06);
  const borderColor = isDarkMode ? backgroundColor : opacity(color, 0.03);

  const style = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withSpring(
          selectedIndex.value * (PILL.width + PILL.gap) + BASE_HORIZONTAL_INSET,
          SPRING_CONFIGS.snappyMediumSpringConfig
        ),
      },
    ],
  }));

  return <Animated.View style={[styles.selectedHighlight, { backgroundColor, borderColor }, style]} />;
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
  scrollViewRef: RefObject<ScrollView>;
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

  const toggleChartType = useCallback(() => {
    const newChartType = chartsActions.toggleChartType();
    const newSelectedIndex = getInitialSelectedIndex(newChartType);
    selectedIndex.value = newSelectedIndex;
    if (newChartType === ChartType.Line) return;
    scrollViewRef.current?.setNativeProps({ contentOffset: { x: getInitialScrollPosition(newSelectedIndex), y: 0 } });
  }, [selectedIndex, scrollViewRef]);

  const onPress = useCallback(() => {
    'worklet';
    selectedChartType.value = selectedChartType.value === ChartType.Candlestick ? ChartType.Line : ChartType.Candlestick;
    runOnJS(toggleChartType)();
  }, [selectedChartType, toggleChartType]);

  const buttonBackgroundStyle = useAnimatedStyle(() => ({
    backgroundColor: withSpring(
      mixedBackgroundColors[selectedChartType.value === ChartType.Candlestick ? 'highlighted' : 'darkened'],
      SPRING_CONFIGS.snappyMediumSpringConfig
    ),
  }));

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

// ============ Utils ========================================================== //

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

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
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
});
