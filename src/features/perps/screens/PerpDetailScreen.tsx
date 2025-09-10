import React, { Fragment, memo, useEffect, useMemo, useState } from 'react';
import { AnimatedText, Box, Text, TextShadow } from '@/design-system';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
import { formatAssetPrice } from '@/helpers/formatAssetPrice';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { HlTrade, PerpMarket } from '@/features/perps/types';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { colors } from '@/styles';
import { SheetHandle } from '@/features/perps/components/SheetHandle';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { abs, greaterThan, isEqual } from '@/helpers/utilities';
import { divWorklet, getPercentageDifferenceWorklet, toFixedWorklet } from '@/safe-math/SafeMath';
import { DOWN_ARROW, UP_ARROW } from '@/features/perps/constants';
import { Page } from '@/components/layout';
import { useChartsStore } from '@/features/charts/stores/chartsStore';
import { ChartType } from '@/features/charts/types';
import { PerpsAccentColorContextProvider, usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { ScrollView } from 'react-native';
import { Chart } from '@/components/value-chart/Chart';
import { useHlTradesStore } from '@/features/perps/stores/hlTradesStore';
import { ButtonPressAnimation } from '@/components/animations';
import { format } from 'date-fns';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CollapsibleSectionBase } from '@/components/collapsible/CollapsibleSectionBase';
import { useSharedValue } from 'react-native-reanimated';

export const NameAndPriceSection = memo(function NameAndPriceSection({ market }: { market: PerpMarket }) {
  return (
    <Box gap={20}>
      <HyperliquidTokenIcon symbol={market.symbol} style={{ width: 44, height: 44 }} />

      <Box flexDirection="row" alignItems="center" gap={8}>
        <TextShadow blur={12} shadowOpacity={0.24}>
          <Text size="22pt" weight="heavy" color="labelTertiary" testID={`chart-header-${market.symbol}`}>
            {/* // TODO: Change this for real asset name ? */}
            {market.symbol}
          </Text>
        </TextShadow>

        <Box
          paddingHorizontal="6px"
          height={24}
          justifyContent="center"
          alignItems="center"
          borderRadius={10}
          borderWidth={1.67}
          // TODO (kane): real token color, blocked by backend
          backgroundColor={opacityWorklet('#677483', 0.16)}
          borderColor={{ custom: opacityWorklet('#677483', 0.16) }}
        >
          <Text size="15pt" color="labelTertiary" weight="heavy">
            10x
          </Text>
        </Box>
        <Box
          paddingHorizontal="6px"
          height={24}
          justifyContent="center"
          alignItems="center"
          borderRadius={10}
          borderWidth={1.67}
          backgroundColor={opacityWorklet(colors.green, 0.16)}
          borderColor={{ custom: opacityWorklet(colors.green, 0.16) }}
        >
          <Text size="15pt" color="green" weight="heavy">
            LONG
          </Text>
        </Box>
      </Box>
      {/* <Box gap={20}>
        <AnimatedText size="34pt" weight="heavy" color="label" testID={`chart-header-${market.symbol}-price`}>
          {livePrice}
        </AnimatedText>

        <Box flexDirection="row" alignItems="center" gap={8}>
          <LiveTokenText
            selector={state => {
              return formatPriceChange(state.change.change24hPct);
            }}
            tokenId={`${market.symbol}:hl`}
            initialValueLastUpdated={0}
            initialValue={formatPriceChange(market.priceChange['24h'])}
            autoSubscriptionEnabled={false}
            usePriceChangeColor
            priceChangeChangeColors={{
              positive: green,
              negative: red,
              neutral: labelTertiary,
            }}
            color="label"
            size="20pt"
            weight="heavy"
          />
          <Box
            paddingHorizontal="6px"
            height={24}
            justifyContent="center"
            alignItems="center"
            borderRadius={10}
            borderWidth={2}
            // TODO (kane): real token color, blocked by backend
            backgroundColor={opacityWorklet('#000000', 0.08)}
            borderColor={{ custom: '#9CA4AD1F' }}
          >
            <Text size="15pt" color="labelQuaternary" weight="heavy">
              15m
            </Text>
          </Box>
        </Box>
      </Box> */}
    </Box>
  );
});

export const ChartSection = memo(function ChartSection({ market }: { market: PerpMarket }) {
  const { setToken, setChartType } = useChartsStore();
  const colors = usePerpsAccentColorContext();

  useEffect(() => {
    setToken(market.symbol);
    setChartType(ChartType.Candlestick);
  }, [setToken, setChartType, market.symbol]);

  return (
    <Chart
      accentColors={{
        ...colors.accentColors,
        textOnAccent: colors.accentColors.opacity100,
        background: colors.accentColors.surfacePrimary,
        border: colors.accentColors.surfacePrimary,
        color: colors.accentColors.opacity100,
        borderSecondary: colors.accentColors.surfacePrimary,
        surface: colors.accentColors.surfacePrimary,
        surfaceSecondary: colors.accentColors.surfacePrimary,
      }}
      backgroundColor={colors.accentColors.surfacePrimary}
      hyperliquidSymbol={market.symbol}
      hideChartTypeToggle
    />
  );
});

export const PositionValueSection = memo(function PositionValueSection({ market }: { market: PerpMarket }) {
  const position = useHyperliquidAccountStore(state => state.getPosition(market.symbol));

  if (!position) return null;

  const isPositivePnl = greaterThan(position.unrealizedPnl, 0);
  const isNeutralPnl = isEqual(position.unrealizedPnl, 0);
  const textColor = isPositivePnl ? 'green' : isNeutralPnl ? 'labelTertiary' : 'red';

  const formattedUnrealizedPnl = formatAssetPrice({
    value: abs(position.unrealizedPnl),
    currency: 'USD',
  });
  const formattedUnrealizedPnlPercent = `${toFixedWorklet(abs(position.unrealizedPnlPercent), 2)}%`;
  const formattedValue = formatAssetPrice({
    value: position.value,
    currency: 'USD',
  });

  return (
    <>
      <Box
        backgroundColor="#192928"
        borderRadius={28}
        borderWidth={2}
        borderColor={{ custom: opacityWorklet('#3ECFAD', 0.06) }}
        padding="20px"
        gap={14}
      >
        <Box flexDirection="row" alignItems="center" justifyContent="space-between" gap={8}>
          <Text size="17pt" weight="bold" color="labelSecondary">
            {'Position Value'}
          </Text>
          <Box flexDirection="row" alignItems="center" gap={2}>
            <TextShadow blur={8} shadowOpacity={0.2}>
              <Text size="12pt" weight="heavy" color={textColor}>
                {isPositivePnl ? UP_ARROW : DOWN_ARROW}
              </Text>
            </TextShadow>
            <TextShadow blur={8} shadowOpacity={0.2}>
              <Text size="17pt" weight="heavy" color={textColor}>
                {formattedUnrealizedPnlPercent}
              </Text>
            </TextShadow>
          </Box>
        </Box>
        <Box flexDirection="row" alignItems="center" justifyContent="space-between" gap={8}>
          <AnimatedText size="22pt" weight="heavy" color="label">
            {formattedValue}
          </AnimatedText>
          <Box flexDirection="row" alignItems="center" justifyContent="space-between">
            <Box flexDirection="row" alignItems="center" gap={2}>
              <TextShadow blur={8} shadowOpacity={0.2}>
                <Text size="20pt" weight="heavy" color={textColor}>
                  {isPositivePnl ? '+' : '-'}
                </Text>
              </TextShadow>
              <TextShadow blur={8} shadowOpacity={0.2}>
                <Text size="22pt" weight="heavy" color={textColor}>
                  {formattedUnrealizedPnl}
                </Text>
              </TextShadow>
            </Box>
          </Box>
        </Box>
      </Box>
      <LiquidationSection market={market} />
    </>
  );
});

const TradeListItem = memo(function TradeListItem({ trade, isLast }: { trade: HlTrade; isLast: boolean }) {
  const pnlValue = parseFloat(trade.pnl);
  const pnlColor = pnlValue >= 0 ? 'green' : 'red';

  const formattedDate = useMemo(() => {
    return format(trade.executedAt, 'MMM d, HH:mm');
  }, [trade.executedAt]);

  const leftHandSide = useMemo(() => {
    if (trade.triggerOrderType) {
      return `${toFixedWorklet(divWorklet(trade.fillStartSize, trade.size), 2)}%`;
    }

    // TODO: KANE
    return formatAssetPrice({ value: '0', currency: 'USD' });
  }, [trade.fillStartSize, trade.size, trade.triggerOrderType]);

  return (
    <>
      <Box paddingVertical="16px" gap={12}>
        <Box flexDirection="row" justifyContent="space-between" alignItems="center">
          <Box flexDirection="row" gap={8} alignItems="center">
            <Text size="13pt" weight="semibold" color="labelTertiary">
              {trade.description}
            </Text>
          </Box>
          <Text size="13pt" color="labelQuaternary" weight="medium">
            {formattedDate}
          </Text>
        </Box>

        <Box flexDirection="row" justifyContent="space-between" alignItems="center">
          <Text size="17pt" color="white" weight="semibold">
            {leftHandSide}{' '}
            <Text size="17pt" color="labelTertiary" weight="semibold">
              @
            </Text>{' '}
            {formatAssetPrice({ value: trade.price, currency: 'USD' })}
          </Text>
          {pnlValue !== 0 && (
            <Text size="17pt" weight="semibold" color={pnlColor}>
              {pnlValue >= 0 ? '+' : ''}
              {formatAssetPrice({ value: trade.pnl, currency: 'USD' })}
            </Text>
          )}
        </Box>
      </Box>

      {!isLast && <Box backgroundColor="#F5F8FF06" height={{ custom: 1.33 }} width="full" />}
    </>
  );
});

export const HistorySection = memo(function HistorySection({ market }: { market: PerpMarket }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const colors = usePerpsAccentColorContext();
  const historyData = useHlTradesStore(state => state.tradesBySymbol);

  const trades = historyData[market.symbol] || [];
  const visibleTrades = isExpanded ? trades : trades.slice(0, 3);

  if (trades.length === 0) {
    return (
      <Box>
        <Text weight="semibold" size="17pt" color="labelTertiary">
          No trades
        </Text>
      </Box>
    );
  }

  return (
    <Box gap={16}>
      {(isExpanded || trades.length > 0) && (
        <Box gap={12}>
          {visibleTrades.map((trade, index) => (
            <TradeListItem key={`${trade.id}-${index}`} trade={trade} isLast={index === visibleTrades.length - 1} />
          ))}

          {trades.length > 3 && !isExpanded && (
            <ButtonPressAnimation onPress={() => setIsExpanded(true)} scaleTo={0.98}>
              <Box
                backgroundColor="#192928"
                borderRadius={28}
                borderWidth={2}
                borderColor={{ custom: opacityWorklet('#3ECFAD', 0.06) }}
                padding="12px"
                alignItems="center"
              >
                <Text size="15pt" weight="semibold" color={{ custom: colors.accentColors.opacity56 }}>
                  More
                </Text>
              </Box>
            </ButtonPressAnimation>
          )}
        </Box>
      )}
    </Box>
  );
});

const LiquidationSection = memo(function LiquidationSection({ market }: { market: PerpMarket }) {
  const position = useHyperliquidAccountStore(state => state.getPosition(market.symbol));

  const formattedValues = useMemo(() => {
    if (!position) return null;
    return {
      entryPrice: formatAssetPrice({
        value: position.entryPrice,
        currency: 'USD',
      }),
      liquidationPrice: position.liquidationPrice
        ? formatAssetPrice({
            value: position.liquidationPrice,
            currency: 'USD',
          })
        : 'N/A',
      unrealizedPnl: formatAssetPrice({
        value: abs(position.unrealizedPnl),
        prefix: position.unrealizedPnl.includes('-') ? '-' : '+',
        currency: 'USD',
      }),
      positionValue: formatAssetPrice({
        value: position.value,
        currency: 'USD',
      }),
    };
  }, [position]);

  const targetPriceDifferential = useMemo(() => {
    if (!position || !position.liquidationPrice) return null;
    return getPercentageDifferenceWorklet(market.price, position.liquidationPrice);
  }, [position, market.price]);

  const formattedMarkPrice = useMemo(() => {
    return formatAssetPrice({
      value: market.price,
      currency: 'USD',
    });
  }, [market.price]);

  const formattedFundingRate = useMemo(() => {
    // Convert funding rate to percentage format
    const fundingRatePercent = parseFloat(market.fundingRate) * 100;
    return `${toFixedWorklet(fundingRatePercent, 4)}%`;
  }, [market.fundingRate]);

  const items = [
    {
      title: 'Mark Price',
      value: formattedMarkPrice,
    },
    {
      title: 'Entry Price',
      value: formattedValues?.entryPrice,
    },
    {
      title: 'Funding Rate',
      value: formattedFundingRate,
    },
  ];

  if (!position) return null;

  const targetPriceDifferentialNegative = targetPriceDifferential && parseFloat(targetPriceDifferential) < 0;
  return (
    <>
      <Box
        backgroundColor="#192928"
        borderRadius={28}
        borderWidth={2}
        borderColor={{ custom: opacityWorklet('#3ECFAD', 0.06) }}
        padding="20px"
        marginTop={{ custom: 16 }}
        gap={16}
      >
        <Box flexDirection="row" alignItems="center" justifyContent="space-between" gap={8}>
          <Box>
            <Box flexDirection="row" alignItems="center" gap={6}>
              {targetPriceDifferentialNegative && (
                <Text size="13pt" weight="semibold" color="red">
                  􀇿
                </Text>
              )}
              <Text size="17pt" weight="semibold" color="labelTertiary" testID={`liquidation-price-header-${market.symbol}`}>
                Liquidation Price
              </Text>
            </Box>
            {targetPriceDifferential && (
              <Box flexDirection="row" alignItems="center" gap={5} marginTop={{ custom: 12 }}>
                <Text color={targetPriceDifferentialNegative ? 'red' : 'green'} size="13pt" weight="heavy">
                  {toFixedWorklet(targetPriceDifferential, 2)}%
                </Text>
                <Text color="labelTertiary" size="13pt" weight="heavy">
                  from current price
                </Text>
              </Box>
            )}
          </Box>
          <Text color="white" size="17pt" weight="bold">
            {formattedValues?.liquidationPrice}
          </Text>
        </Box>
        <Box backgroundColor="#F5F8FF06" height={{ custom: 1 }} width="full" />
        {items.map((item, index) => (
          <Fragment key={item.title}>
            <Box flexDirection="row" alignItems="center" justifyContent="space-between" gap={8}>
              <Text size="17pt" weight="semibold" color="labelTertiary" testID={`liquidation-price-header-${market.symbol}`}>
                {item.title}
              </Text>
              <Text color="white" size="17pt" weight="bold">
                {item.value}
              </Text>
            </Box>
            {index !== items.length - 1 && <Box backgroundColor="#F5F8FF06" height={{ custom: 1 }} width="full" />}
          </Fragment>
        ))}
      </Box>
      <Box
        backgroundColor="#F5F8FF06"
        height={{ custom: 1 }}
        width="full"
        marginTop={{ custom: 28 }}
        // we have a gap of 20 already so 28 - 20
        marginBottom={{ custom: 8 }}
      />
    </>
  );
});

const Screen = memo(function PerpsDetailScreen({ market }: { market: PerpMarket }) {
  const colors = usePerpsAccentColorContext();
  const insets = useSafeAreaInsets();
  const historyExpanded = useSharedValue(true);

  const onToggleHistory = () => {
    'worklet';
    historyExpanded.value = !historyExpanded.value;
  };

  return (
    <Box as={Page} backgroundColor={colors.accentColors.surfacePrimary} flex={1} height="full" testID="perps-details-screen" width="full">
      <SheetHandle withoutGradient extraPaddingTop={6} />
      <Box height="full" width="full" paddingTop={{ custom: 96 }}>
        <Box as={ScrollView} gap={32} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
          <Box gap={20}>
            {/* the chart dont take padding that's why we add it here */}
            <Box paddingHorizontal="24px">
              <NameAndPriceSection market={market} />
            </Box>
            <ChartSection market={market} />
            <Box paddingHorizontal="24px">
              <PositionValueSection market={market} />
            </Box>
            <Box paddingHorizontal="24px">
              <CollapsibleSectionBase
                iconColor={colors.accentColors.opacity100}
                icon="􀐫"
                content={<HistorySection market={market} />}
                primaryText="History"
                expanded={historyExpanded}
                onToggle={onToggleHistory}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
});

export const PerpsDetailScreen = () => {
  const {
    params: { market },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.PERPS_DETAIL_SCREEN>>();

  return (
    <PerpsAccentColorContextProvider>
      <Screen market={market} />
    </PerpsAccentColorContextProvider>
  );
};
