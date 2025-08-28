import React, { memo } from 'react';
import { AnimatedText, Box, Text, TextShadow, useForegroundColor } from '@/design-system';
import { RouteProp, useRoute } from '@react-navigation/native';
import { PerpsStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
import { formatAssetPrice } from '@/helpers/formatAssetPrice';
import { LiveTokenText, useLiveTokenSharedValue } from '@/components/live-token-text/LiveTokenText';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { formatPriceChange } from '@/features/perps/utils';
import { PerpMarket } from '@/features/perps/types';
import { SHEET_FOOTER_HEIGHT } from '@/screens/expandedAssetSheet/components/SheetFooter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { colors } from '@/styles';
import { SheetHandle } from '@/components/sheet';
import { useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { abs, greaterThan, isEqual } from '@/helpers/utilities';
import { toFixedWorklet } from '@/safe-math/SafeMath';
import { DOWN_ARROW, UP_ARROW } from '@/features/perps/constants';

export const NameAndPriceSection = memo(function NameAndPriceSection({ market }: { market: PerpMarket }) {
  const green = useForegroundColor('green');
  const red = useForegroundColor('red');
  const labelTertiary = useForegroundColor('labelTertiary');

  const livePrice = useLiveTokenSharedValue({
    tokenId: `${market.symbol}:hl`,
    initialValue: formatAssetPrice({ value: market.price, currency: 'USD' }),
    selector: state => {
      return formatAssetPrice({ value: state.price, currency: 'USD' });
    },
  });

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
      <Box gap={20}>
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
      </Box>
    </Box>
  );
});

export const ChartSection = memo(function ChartSection() {
  return (
    <Box height={300}>
      <Text size="15pt" color="labelQuaternary" weight="heavy">
        CHART SECTION PLACEHOLDER
      </Text>
    </Box>
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
      backgroundColor="#151E20"
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

export const PerpsDetailScreen = memo(function PerpsDetailScreen() {
  const {
    params: { market },
  } = useRoute<RouteProp<PerpsStackParamList, typeof Routes.PERPS_DETAIL_SCREEN>>();
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <>
      <Box background={'surfacePrimary'} paddingHorizontal={'20px'} style={{ flex: 1 }}>
        <Box height="full" width="full" paddingTop={{ custom: 96 }} paddingBottom={{ custom: SHEET_FOOTER_HEIGHT + safeAreaInsets.bottom }}>
          <Box gap={32}>
            <Box gap={20}>
              <NameAndPriceSection market={market} />
              <ChartSection />
              <PositionValueSection market={market} />
            </Box>
          </Box>
        </Box>
      </Box>
      <SheetHandle />
    </>
  );
});
