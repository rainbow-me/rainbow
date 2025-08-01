import React, { memo } from 'react';
import { Box, Inline, Stack, Text, AnimatedText, useForegroundColor } from '@/design-system';
import { useExpandedAssetSheetContext } from '@/screens/expandedAssetSheet/context/ExpandedAssetSheetContext';
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
import { MarketStats, TimeFrames, useTokenMarketStats } from '@/resources/metadata/tokenStats';
import { getNumberFormatter } from '@/helpers/intl';

const TIMEFRAME_SWITCH_CONFIG = TIMING_CONFIGS.buttonPressConfig;

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

const MarketStatsCardContent = memo(function MarketStatsCardContent({ marketData }: { marketData: Record<string, MarketStats> }) {
  const { accentColors } = useExpandedAssetSheetContext();

  const defaultTimeframe = Object.keys(marketData)[Object.keys(marketData).length - 1];
  const selectedTimeframe = useSharedValue(defaultTimeframe);

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
      const timeframeData = marketData[timeframe as TimeFrames];
      transactions.value = getNumberFormatter('en-US', {
        maximumFractionDigits: 2,
      }).format(timeframeData.transactions);

      // TODO
      volume.value = '$' + abbreviateNumberWorklet(timeframeData.volume, 1);

      makers.value = getNumberFormatter('en-US', {
        maximumFractionDigits: 2,
      }).format(timeframeData.uniques);

      buys.value = getNumberFormatter('en-US', {
        maximumFractionDigits: 2,
      }).format(timeframeData.buys);
      sells.value = getNumberFormatter('en-US', {
        maximumFractionDigits: 2,
      }).format(timeframeData.sells);

      // TODO
      // This is the only section that requires a separate value for the non formatted value so that the ratio bar can be calculated
      buyVolumeFormatted.value = '$' + abbreviateNumberWorklet(timeframeData.buyVolume, 1);
      sellVolumeFormatted.value = '$' + abbreviateNumberWorklet(timeframeData.sellVolume, 1);
      buyVolume.value = timeframeData.buyVolume.toString();
      sellVolume.value = timeframeData.sellVolume.toString();

      buyers.value = getNumberFormatter('en-US', {
        maximumFractionDigits: 2,
      }).format(timeframeData.buyers);
      sellers.value = getNumberFormatter('en-US', {
        maximumFractionDigits: 2,
      }).format(timeframeData.sellers);
    }
  );

  const selectedTimeframeIndicatorStyle = useAnimatedStyle(() => {
    const allTimeframes = Object.keys(marketData);
    const timeframesCount = allTimeframes.length;
    const selectedTimeframeIndex = allTimeframes.indexOf(selectedTimeframe.value);
    const defaultIndex = allTimeframes.indexOf(defaultTimeframe);
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
          {Object.keys(marketData).map((timeframe, index) => (
            <>
              {index > 0 && <Box style={{ alignSelf: 'center' }} height={20} width={1} backgroundColor={accentColors.opacity6} />}
              <TimeframeItem
                timeframe={timeframe}
                relativeChange={marketData[timeframe as TimeFrames].priceChangePct ?? 0}
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

export const MarketStatsCard = memo(function MarketStatsCard() {
  const { basicAsset: asset } = useExpandedAssetSheetContext();
  const { data: marketData } = useTokenMarketStats({ chainID: asset.chainId, address: asset.address });

  if (!marketData || Object.keys(marketData).length === 0) return null;

  return <MarketStatsCardContent marketData={marketData} />;
});
