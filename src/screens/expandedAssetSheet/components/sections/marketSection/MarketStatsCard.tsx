import React, { memo } from 'react';
import { Box, Inline, Stack, Text, AnimatedText, useColorMode, useForegroundColor } from '@/design-system';
import { useExpandedAssetSheetContext } from '../../../context/ExpandedAssetSheetContext';
import Animated, {
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { colors } from '@/styles';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { abbreviateNumberWorklet } from '@/helpers/utilities';

const DEFAULT_TIMEFRAME = '24h';
const TIMEFRAME_SWITCH_CONFIG = TIMING_CONFIGS.buttonPressConfig;

const MARKET_DATA = {
  timeframes: {
    '5m': {
      relativeChange: -0.18,
      transactions: 758,
      volume: 1000000,
      makers: 46,
      buys: 220,
      sells: 447,
      buyVolume: 105000,
      sellVolume: 866000,
      buyers: 21,
      sellers: 33,
    },
    '1h': {
      relativeChange: 2.25,
      transactions: 6473,
      volume: 3800000,
      makers: 175,
      buys: 2711,
      sells: 3825,
      buyVolume: 1200000,
      sellVolume: 2500000,
      buyers: 122,
      sellers: 96,
    },
    '6h': {
      relativeChange: -0.24,
      transactions: 41636,
      volume: 24700000,
      makers: 876,
      buys: 21441,
      sells: 20229,
      buyVolume: 12300000,
      sellVolume: 12300000,
      buyers: 625,
      sellers: 456,
    },
    '24h': {
      relativeChange: 4.28,
      transactions: 176320,
      volume: 99400000,
      makers: 2883,
      buys: 103054,
      sells: 73280,
      buyVolume: 48900000,
      sellVolume: 504000000,
      buyers: 2076,
      sellers: 1476,
    },
  },
};

const LeftSideItem = memo(function LeftSideItem({ title, value }: { title: string; value: SharedValue<string> }) {
  const { accentColors } = useExpandedAssetSheetContext();
  return (
    <Stack space="12px">
      <Stack space="8px">
        <Text color="labelSecondary" size="11pt" weight="bold">
          {title}
        </Text>
        <AnimatedText color="labelSecondary" size="15pt" weight="heavy">
          {value}
        </AnimatedText>
      </Stack>
      <Box width="full" height={1} backgroundColor={accentColors.opacity6} />
    </Stack>
  );
});

const DISTRIBUTION_BAR_HEIGHT = 3;

const calculateRatios = (value1: number, value2: number) => {
  'worklet';
  const total = value1 + value2;

  if (total === 0) {
    return [50, 50];
  }

  const ratio1 = Math.round((value1 / total) * 100);
  const ratio2 = Math.round((value2 / total) * 100);

  // Ensure that some part of either bar is always visible
  return [Math.max(ratio1, 1), Math.max(ratio2, 1)];
};

const RatioBarItem = memo(function RatioBarItem({
  leftTitle,
  rightTitle,
  leftValue,
  rightValue,
  leftLabel,
  rightLabel,
}: {
  leftTitle: string;
  rightTitle: string;
  leftValue: SharedValue<string>;
  rightValue: SharedValue<string>;
  leftLabel: SharedValue<string>;
  rightLabel: SharedValue<string>;
}) {
  const ratios = useDerivedValue(() => {
    const [leftRatio, rightRatio] = calculateRatios(parseFloat(leftValue.value), parseFloat(rightValue.value));
    return {
      left: leftRatio,
      right: rightRatio,
    };
  });

  const leftBarStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(`${ratios.value.left}%`, TIMEFRAME_SWITCH_CONFIG),
    };
  });

  const rightBarStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(`${ratios.value.right}%`, TIMEFRAME_SWITCH_CONFIG),
    };
  });

  return (
    <Stack space="16px">
      <Stack space="10px">
        <Stack space="8px">
          <Inline alignHorizontal="justify">
            <Text color="labelSecondary" size="11pt" weight="bold">
              {leftTitle}
            </Text>
            <Text color="labelSecondary" size="11pt" weight="bold">
              {rightTitle}
            </Text>
          </Inline>
          <Inline alignHorizontal="justify">
            <AnimatedText color="label" size="15pt" weight="heavy">
              {leftLabel}
            </AnimatedText>
            <AnimatedText color="label" size="15pt" weight="heavy">
              {rightLabel}
            </AnimatedText>
          </Inline>
        </Stack>
        {/* The gap cannot be accounted for when creating relative widths for the bars, so we add equivalent margin to correct for it */}
        <Box marginRight={{ custom: 3 }} height={DISTRIBUTION_BAR_HEIGHT} flexDirection="row" gap={3}>
          {/* TODO: implement gradient from design spec */}
          <Animated.View style={[leftBarStyle, { height: DISTRIBUTION_BAR_HEIGHT, backgroundColor: colors.green, borderRadius: 4 }]} />
          <Animated.View style={[rightBarStyle, { height: DISTRIBUTION_BAR_HEIGHT, backgroundColor: colors.red, borderRadius: 4 }]} />
        </Box>
      </Stack>
    </Stack>
  );
});

const TimeframeItem = memo(function TimeframeItem({
  timeframe,
  relativeChange,
  selectedTimeframe,
}: {
  timeframe: string;
  relativeChange: number;
  selectedTimeframe: SharedValue<string>;
}) {
  const selectedColor = useForegroundColor('label');
  const unselectedColor = useForegroundColor('labelSecondary');

  const textStyle = useAnimatedStyle(() => {
    const isSelected = selectedTimeframe.value === timeframe;
    return {
      color: isSelected ? selectedColor : unselectedColor,
    };
  });

  return (
    <Animated.View
      style={{
        flex: 1,
      }}
    >
      <GestureHandlerButton
        hapticTrigger="tap-end"
        onPressWorklet={() => {
          'worklet';
          selectedTimeframe.value = timeframe;
        }}
      >
        <Box padding="8px">
          <Stack space={{ custom: 9 }} alignHorizontal="center">
            <AnimatedText style={textStyle} size="15pt" weight="heavy">
              {timeframe}
            </AnimatedText>
            <Text color={relativeChange > 0 ? 'green' : 'labelTertiary'} size="11pt" weight="heavy">
              {relativeChange.toFixed(2)}%
            </Text>
          </Stack>
        </Box>
      </GestureHandlerButton>
    </Animated.View>
  );
});

export const MarketStatsCard = memo(function MarketStatsCard({ marketData = MARKET_DATA }: { marketData?: typeof MARKET_DATA }) {
  const { timeframes } = marketData;
  const { accentColors } = useExpandedAssetSheetContext();

  const selectedTimeframe = useSharedValue(DEFAULT_TIMEFRAME);

  // Shared values are used for representing currently selected timeframe data to avoid re-rendering the component when the timeframe changes
  // A shared value object is not used because then the individual keys would be shared values themselves and thus not usable in AnimatedText
  const transactions = useSharedValue('0');
  const volume = useSharedValue('0');
  const makers = useSharedValue('0');
  const buys = useSharedValue('0');
  const sells = useSharedValue('0');
  const buyVolume = useSharedValue('0');
  const sellVolume = useSharedValue('0');
  const buyVolumeFormatted = useSharedValue('0');
  const sellVolumeFormatted = useSharedValue('0');
  const buyers = useSharedValue('0');
  const sellers = useSharedValue('0');

  const timeframesContainerWidth = useSharedValue(0);

  // TODO: handle formatting in a useMemo so that formatting does not occur on every timeframe change
  useAnimatedReaction(
    () => selectedTimeframe.value,
    timeframe => {
      'worklet';
      const timeframeData = timeframes[timeframe as keyof typeof timeframes];
      transactions.value = timeframeData.transactions.toLocaleString('en-US', {
        maximumFractionDigits: 2,
      });

      // TODO
      volume.value = '$' + abbreviateNumberWorklet(timeframeData.volume, 1);

      makers.value = timeframeData.makers.toLocaleString('en-US', {
        maximumFractionDigits: 2,
      });

      buys.value = timeframeData.buys.toLocaleString('en-US', {
        maximumFractionDigits: 2,
      });
      sells.value = timeframeData.sells.toLocaleString('en-US', {
        maximumFractionDigits: 2,
      });

      // TODO
      // This is the only section that requires a separate value for the non formatted value so that the ratio bar can be calculated
      buyVolumeFormatted.value = '$' + abbreviateNumberWorklet(timeframeData.buyVolume, 1);
      sellVolumeFormatted.value = '$' + abbreviateNumberWorklet(timeframeData.sellVolume, 1);
      buyVolume.value = timeframeData.buyVolume.toString();
      sellVolume.value = timeframeData.sellVolume.toString();

      buyers.value = timeframeData.buyers.toLocaleString('en-US', {
        maximumFractionDigits: 2,
      });
      sellers.value = timeframeData.sellers.toLocaleString('en-US', {
        maximumFractionDigits: 2,
      });
    }
  );

  const selectedTimeframeIndicatorStyle = useAnimatedStyle(() => {
    const allTimeframes = Object.keys(timeframes);
    const timeframesCount = allTimeframes.length;
    const selectedTimeframeIndex = allTimeframes.indexOf(selectedTimeframe.value);
    const defaultIndex = allTimeframes.indexOf(DEFAULT_TIMEFRAME);
    // 7px is the gap 3px space on each side of the 1px separator between the timeframes
    const timeframeSeparatorWidth = 7;
    const borderTopLeftRadius = selectedTimeframeIndex === 0 ? 15 : 10;
    const borderTopRightRadius = selectedTimeframeIndex === timeframesCount - 1 ? 15 : 10;

    // We reverse the index and apply a negative translateX because the default timeframe is the rightmost one
    const reverseIndex = defaultIndex - selectedTimeframeIndex;

    const timeframeWidth = (timeframesContainerWidth.value - (timeframesCount - 1) * timeframeSeparatorWidth) / timeframesCount;
    const translateX = reverseIndex * timeframeWidth + reverseIndex * timeframeSeparatorWidth;

    return {
      transform: [{ translateX: withTiming(-translateX, TIMEFRAME_SWITCH_CONFIG) }],
      right: 0,
      width: timeframeWidth,
      borderTopLeftRadius: withTiming(borderTopLeftRadius, TIMEFRAME_SWITCH_CONFIG),
      borderTopRightRadius: withTiming(borderTopRightRadius, TIMEFRAME_SWITCH_CONFIG),
      borderBottomLeftRadius: 10,
      borderBottomRightRadius: 10,
    };
  });

  return (
    <Box
      borderRadius={18}
      style={{
        padding: 3,
        backgroundColor: accentColors.surface,
        borderColor: accentColors.border,
        borderWidth: 1,
      }}
    >
      {/* Timeframe headers */}
      <Stack space="2px">
        {/* Cannot use Inline with separator because absolutely positioned selection indicator causes extra separator */}
        <Box
          onLayout={({ nativeEvent }) => {
            'worklet';
            timeframesContainerWidth.value = nativeEvent.layout.width;
          }}
          flexDirection="row"
          gap={3}
        >
          <Animated.View
            style={[
              selectedTimeframeIndicatorStyle,
              {
                position: 'absolute',
                backgroundColor: accentColors.opacity12,
                borderColor: accentColors.opacity6,
                borderWidth: 1.33,
                height: '100%',
              },
            ]}
          />
          {Object.keys(timeframes).map((timeframe, index) => (
            <>
              {index > 0 && <Box style={{ alignSelf: 'center' }} height={20} width={1} backgroundColor={accentColors.opacity6} />}
              <TimeframeItem
                timeframe={timeframe}
                relativeChange={timeframes[timeframe as keyof typeof timeframes].relativeChange}
                selectedTimeframe={selectedTimeframe}
              />
            </>
          ))}
        </Box>
        <Box height={1} backgroundColor={accentColors.opacity6} />
      </Stack>
      <Box padding={{ custom: 13 }} gap={16}>
        <Inline space="16px" wrap={false} separator={<Box width={1} height={'full'} backgroundColor={accentColors.opacity6} />}>
          {/* Left Hand Side */}
          <Stack space={'16px'}>
            <LeftSideItem title="Transactions" value={transactions} />
            <LeftSideItem title="Volume" value={volume} />
            <LeftSideItem title="Makers" value={makers} />
          </Stack>
          {/* Right Hand Side */}
          <Box style={{ flex: 1 }} gap={16}>
            <RatioBarItem leftTitle="Buys" rightTitle="Sells" leftValue={buys} rightValue={sells} leftLabel={buys} rightLabel={sells} />
            <RatioBarItem
              leftTitle="Bought"
              rightTitle="Sold"
              leftValue={buyVolume}
              rightValue={sellVolume}
              leftLabel={buyVolumeFormatted}
              rightLabel={sellVolumeFormatted}
            />
            <RatioBarItem
              leftTitle="Buyers"
              rightTitle="Sellers"
              leftValue={buyers}
              rightValue={sellers}
              leftLabel={buyers}
              rightLabel={sellers}
            />
          </Box>
        </Inline>
      </Box>
    </Box>
  );
});
