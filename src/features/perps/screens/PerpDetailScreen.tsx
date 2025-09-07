import React, { memo, useEffect } from 'react';
import { AnimatedText, Box, Text, TextShadow } from '@/design-system';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
import { formatAssetPrice } from '@/helpers/formatAssetPrice';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { PerpMarket } from '@/features/perps/types';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { colors } from '@/styles';
import { SheetHandle } from '@/features/perps/components/SheetHandle';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { abs, greaterThan, isEqual } from '@/helpers/utilities';
import { toFixedWorklet } from '@/safe-math/SafeMath';
import { DOWN_ARROW, UP_ARROW } from '@/features/perps/constants';
import { Page } from '@/components/layout';
import { useChartsStore } from '@/features/charts/stores/chartsStore';
import { ChartType } from '@/features/charts/types';
import { PerpsAccentColorContextProvider, usePerpsAccentColorContext } from '@/features/perps/context/PerpsAccentColorContext';
import { ScrollView } from 'react-native';
import { Chart } from '@/components/value-chart/Chart';

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
    <Box
      backgroundColor="#192928"
      borderRadius={28}
      borderWidth={2}
      borderColor={{ custom: opacityWorklet('#3ECFAD', 0.06) }}
      padding="20px"
      gap={14}
    >
      <Box flexDirection="row" alignItems="center" justifyContent="space-between" gap={8}>
        <Text size="22pt" weight="heavy" color="labelTertiary" testID={`poistion-value-header-${market.symbol}`}>
          Position Value
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
        <AnimatedText size="22pt" weight="heavy" color="label" testID={`chart-header-${market.symbol}-price`}>
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
  );
});

const Screen = memo(function PerpsDetailScreen({ market }: { market: PerpMarket }) {
  const colors = usePerpsAccentColorContext();

  return (
    <Box as={Page} backgroundColor={colors.accentColors.surfacePrimary} flex={1} height="full" testID="perps-details-screen" width="full">
      <SheetHandle withoutGradient extraPaddingTop={6} />
      <Box height="full" width="full" paddingTop={{ custom: 96 }}>
        <Box as={ScrollView} gap={32}>
          <Box gap={20}>
            {/* the chart dont take padding that's why we add it here */}
            <Box paddingHorizontal="24px">
              <NameAndPriceSection market={market} />
            </Box>
            <ChartSection market={market} />
            <Box paddingHorizontal="24px">
              <PositionValueSection market={market} />
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
