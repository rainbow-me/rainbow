import React, { memo } from 'react';
import { Box, Inline, Stack, Text, AnimatedText } from '@/design-system';
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

const DEFAULT_TIMEFRAME = '24h';
const TIMEFRAME_SWITCH_CONFIG = TIMING_CONFIGS.buttonPressConfig;

const MARKET_DATA = {
  timeframes: {
    '5m': {
      relativeChange: 0.82,
      transactions: 100,
      volume: 100,
      makers: 4762,
      buys: 100,
      sells: 100,
      buyVolume: 100,
      sellVolume: 100,
      buyers: 100,
      sellers: 100,
    },
    '1h': {
      relativeChange: 2.25,
      transactions: 100,
      volume: 100,
      makers: 4762,
      buys: 20,
      sells: 100,
      buyVolume: 100,
      sellVolume: 100,
      buyers: 100,
      sellers: 100,
    },
    '6h': {
      relativeChange: -0.24,
      transactions: 100,
      volume: 100,
      makers: 4762,
      buys: 500,
      sells: 100,
      buyVolume: 100,
      sellVolume: 100,
      buyers: 100,
      sellers: 100,
    },
    '24h': {
      relativeChange: 4.28,
      transactions: 100,
      volume: 100,
      makers: 4762,
      buys: 100,
      sells: 10,
      buyVolume: 100,
      sellVolume: 100,
      buyers: 100,
      sellers: 100,
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
}: {
  leftTitle: string;
  rightTitle: string;
  leftValue: SharedValue<string>;
  rightValue: SharedValue<string>;
}) {
  const ratios = useDerivedValue(() => {
    const [leftRatio, rightRatio] = calculateRatios(Number(leftValue.value), Number(rightValue.value));
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
              {leftValue}
            </AnimatedText>
            <AnimatedText color="label" size="15pt" weight="heavy">
              {rightValue}
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
  const textStyle = useAnimatedStyle(() => {
    const isSelected = selectedTimeframe.value === timeframe;
    return {
      // TODO: implement actual colors based on asset sheet background
      color: isSelected ? colors.whiteLabel : colors.lightGrey,
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
            <Text color={relativeChange > 0 ? 'green' : 'labelTertiary'} size="15pt" weight="bold">
              {relativeChange}
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
  // An shared value object is not used because otherwise the individual keys would be shared values themselves and thus not usable in AnimatedText
  const transactions = useSharedValue('0');
  const volume = useSharedValue('0');
  const makers = useSharedValue('0');
  const buys = useSharedValue('0');
  const sells = useSharedValue('0');
  const buyVolume = useSharedValue('0');
  const sellVolume = useSharedValue('0');
  const buyers = useSharedValue('0');
  const sellers = useSharedValue('0');

  const timeframesContainerWidth = useSharedValue(0);

  // TODO: handle formatting in a useMemo so that formatting does not occur on every timeframe change
  useAnimatedReaction(
    () => selectedTimeframe.value,
    timeframe => {
      'worklet';
      const timeframeData = timeframes[timeframe as keyof typeof timeframes];
      transactions.value = timeframeData.transactions.toString();
      volume.value = timeframeData.volume.toString();
      makers.value = timeframeData.makers.toString();
      buys.value = timeframeData.buys.toString();
      sells.value = timeframeData.sells.toString();
      buyVolume.value = timeframeData.buyVolume.toString();
      sellVolume.value = timeframeData.sellVolume.toString();
      buyers.value = timeframeData.buyers.toString();
      sellers.value = timeframeData.sellers.toString();
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
        backgroundColor: accentColors.opacity6,
        borderColor: accentColors.opacity6,
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
            <RatioBarItem leftTitle="Buys" rightTitle="Sells" leftValue={buys} rightValue={sells} />
            <RatioBarItem leftTitle="Bought" rightTitle="Sold" leftValue={buyVolume} rightValue={sellVolume} />
            <RatioBarItem leftTitle="Buyers" rightTitle="Sellers" leftValue={buyers} rightValue={sellers} />
          </Box>
        </Inline>
      </Box>
    </Box>
  );
});
