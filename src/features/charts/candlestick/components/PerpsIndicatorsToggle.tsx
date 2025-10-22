import { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { AnimatedTextIcon } from '@/components/AnimatedComponents/AnimatedTextIcon';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { Border, Box, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { IS_IOS } from '@/env';
import { chartsActions, useChartsStore, useChartType } from '@/features/charts/stores/chartsStore';
import { ChartType } from '@/features/charts/types';
import { useHasPositionCheck } from '@/features/perps/stores/derived/useHasPositionCheck';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { THICKER_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import { getSolidColorEquivalent } from '@/worklets/colors';

// ============ Constants ====================================================== //

const BUTTON_INNER_PADDING = 4;
const INNER_BUTTON_SIZE = 32;
const BUTTON_SIZE = INNER_BUTTON_SIZE + BUTTON_INNER_PADDING * 2;

// ============ Wrapper Component ============================================== //

export const ChartIndicatorsToggle = memo(function ChartIndicatorsToggle({
  backgroundColor,
  color,
  hyperliquidSymbol,
  isChartGestureActive,
}: {
  backgroundColor: string;
  color: string;
  hyperliquidSymbol: string;
  isChartGestureActive: SharedValue<boolean>;
}) {
  const chartType = useChartType();
  const hasPosition = useHasPositionCheck();
  if (chartType === ChartType.Line || !hasPosition(hyperliquidSymbol)) return null;
  return <PerpsIndicatorsToggle backgroundColor={backgroundColor} color={color} isChartGestureActive={isChartGestureActive} />;
});

// ============ Perps Indicators Toggle ======================================== //

const PerpsIndicatorsToggle = memo(function PerpsIndicatorsToggle({
  backgroundColor,
  color,
  isChartGestureActive,
}: {
  backgroundColor: string;
  color: string;
  isChartGestureActive: SharedValue<boolean>;
}) {
  const { isDarkMode } = useColorMode();
  const indicatorsEnabled = useSharedValue(useChartsStore.getState().enablePerpsIndicators);

  const labelTertiary = useForegroundColor('labelTertiary');
  const labelQuaternary = useForegroundColor('labelQuaternary');

  const borderColor = opacity(color, isDarkMode ? 0.08 : 0.03);
  const mixedBackgroundColor = getSolidColorEquivalent({ background: backgroundColor, foreground: color, opacity: 0.16 });

  const containerStyle = useAnimatedStyle(() => ({
    opacity: isChartGestureActive.value ? 0 : 1,
    pointerEvents: isChartGestureActive.value ? 'none' : 'auto',
  }));

  const indicatorIconStyle = useAnimatedStyle(() => ({
    color: withSpring(indicatorsEnabled.value ? labelTertiary : labelQuaternary, SPRING_CONFIGS.snappyMediumSpringConfig),
  }));

  const selectedStyle = useAnimatedStyle(() => ({
    opacity: withSpring(indicatorsEnabled.value ? 1 : 0, SPRING_CONFIGS.snappyMediumSpringConfig),
    transform: [
      {
        scale: withSpring(indicatorsEnabled.value ? 1 : 0.88, SPRING_CONFIGS.snappyMediumSpringConfig),
      },
    ],
  }));

  const toggleIndicators = useCallback(() => {
    'worklet';
    indicatorsEnabled.value = !indicatorsEnabled.value;
  }, [indicatorsEnabled]);

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <GestureHandlerButton
        hapticTrigger="tap-end"
        hapticType="impactMedium"
        hitSlop={20}
        onPressJS={chartsActions.togglePerpsIndicators}
        onPressWorklet={toggleIndicators}
        style={[styles.chartTypeSwitch, { backgroundColor: isDarkMode ? opacity(globalColors.grey100, 0.08) : undefined }]}
      >
        <Box
          as={Animated.View}
          borderColor={isDarkMode ? { custom: borderColor } : undefined}
          borderRadius={INNER_BUTTON_SIZE / 2}
          borderWidth={isDarkMode ? 2 : undefined}
          pointerEvents="none"
          style={[
            styles.switchSelectedHighlight,
            IS_IOS && !isDarkMode ? styles.switchShadowLight : undefined,
            {
              backgroundColor: isDarkMode ? mixedBackgroundColor : globalColors.white100,
            },
            selectedStyle,
          ]}
        />

        <View style={styles.switchButton}>
          <AnimatedTextIcon
            color="labelQuaternary"
            height={INNER_BUTTON_SIZE}
            size="icon 12px"
            textStyle={indicatorIconStyle}
            weight="black"
            width={INNER_BUTTON_SIZE}
          >
            􁣃
          </AnimatedTextIcon>
        </View>

        <Border borderColor={{ custom: borderColor }} borderRadius={BUTTON_SIZE / 2} borderWidth={THICKER_BORDER_WIDTH} enableInLightMode />
      </GestureHandlerButton>
    </Animated.View>
  );
});

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  candlesWrapper: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 2,
  },
  chartTypeSwitch: {
    alignItems: 'center',
    borderRadius: BUTTON_SIZE / 2,
    height: BUTTON_SIZE,
    justifyContent: 'center',
    width: BUTTON_SIZE,
  },
  container: {
    bottom: -9,
    position: 'absolute',
    right: 20,
  },
  switchButton: {
    alignItems: 'center',
    height: INNER_BUTTON_SIZE,
    justifyContent: 'center',
    width: INNER_BUTTON_SIZE,
  },
  switchSelectedHighlight: {
    borderCurve: 'continuous',
    borderRadius: INNER_BUTTON_SIZE / 2,
    height: INNER_BUTTON_SIZE,
    left: BUTTON_INNER_PADDING,
    overflow: 'hidden',
    position: 'absolute',
    width: INNER_BUTTON_SIZE,
  },
  switchShadowLight: {
    overflow: 'visible',
    shadowColor: globalColors.grey100,
    shadowOffset: {
      height: 2,
      width: 0,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
});
