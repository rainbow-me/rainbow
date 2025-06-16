import React, { memo } from 'react';
import { SharedValue, useAnimatedReaction, useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import { AnimatedText, Box, TextShadow, useColorMode, useForegroundColor } from '@/design-system';
import { IS_ANDROID } from '@/env';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { useTheme } from '@/theme';
import { toFixedWorklet } from '@/safe-math/SafeMath';
import { AnimatedNumber } from '@/components/live-token-text/AnimatedNumber';
import { useExpandedAssetSheetContext } from '@/screens/expandedAssetSheet/context/ExpandedAssetSheetContext';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';

const UP_ARROW = IS_ANDROID ? '' : '↑';

type ChartPercentChangeLabelProps = {
  percentageChange: SharedValue<number | undefined>;
};

export const ChartPercentChangeLabel = memo(function ChartPercentChangeLabel({ percentageChange }: ChartPercentChangeLabelProps) {
  const { colors } = useTheme();
  const { isDarkMode } = useColorMode();
  const { accentColors } = useExpandedAssetSheetContext();
  const labelSecondary = useForegroundColor('labelSecondary');
  const percentageChangeDirectionRotation = useSharedValue(0);

  const percentageChangeText = useDerivedValue(() => {
    const value = percentageChange.value;
    if (value === undefined) {
      // important that string is not empty so that when actual value fills it does not cause a vertical layout shift
      return ' ';
    }
    return `${toFixedWorklet(Math.abs(value), 2)}%`;
  });

  const percentageChangeDirectionStyle = useAnimatedStyle(() => {
    const value = percentageChange.value ?? 0;
    const isPositive = value > 0;
    const isNegative = value < 0;
    const color = isPositive ? colors.green : isNegative ? colors.red : labelSecondary;

    return {
      color,
      transform: [{ rotate: `${percentageChangeDirectionRotation.value}deg` }],
    };
  });

  useAnimatedReaction(
    () => percentageChange.value,
    value => {
      if (value === undefined) {
        return;
      }
      percentageChangeDirectionRotation.value = withTiming(value > 0 ? 0 : 180, TIMING_CONFIGS.slowFadeConfig);
    }
  );

  const textStyle = useAnimatedStyle(() => {
    const value = percentageChange.value;
    const isPositive = value !== undefined && value > 0;
    const isNegative = value !== undefined && value < 0;
    const color = value !== undefined ? (isPositive ? colors.green : isNegative ? colors.red : labelSecondary) : 'transparent';

    return {
      color,
      textShadowColor: isDarkMode ? opacityWorklet(color, 0.24) : 'transparent',
    };
  });

  // TODO: figure out how to add the text shadow
  return (
    <Box flexDirection="row" alignItems="center" gap={2}>
      <AnimatedText size="20pt" style={percentageChangeDirectionStyle} tabularNumbers weight="heavy">
        {UP_ARROW}
      </AnimatedText>
      <AnimatedNumber
        value={percentageChangeText}
        easingMaskColor={accentColors.background}
        style={textStyle}
        align="left"
        size="20pt"
        weight="heavy"
        tabularNumbers
        // TODO:
        disabled={false}
        color={'label'}
      />
    </Box>
  );

  // return (
  //   <TextShadow blur={12} shadowOpacity={0.24}>
  //     <AnimatedText numberOfLines={1} size="20pt" style={textStyle} tabularNumbers weight="heavy">
  //       {percentageChangeText}
  //     </AnimatedText>
  //   </TextShadow>
  // );
});
