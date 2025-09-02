import React, { memo } from 'react';
import { Box, Separator, Stack, Text, useBackgroundColor, useForegroundColor } from '@/design-system';
import { PerpsNavbar } from '@/features/perps/components/PerpsNavbar';
import { formatAssetPrice } from '@/helpers/formatAssetPrice';
import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { formatPriceChange } from '@/features/perps/utils';
import { PerpMarket } from '@/features/perps/types';
import { AmountInputCard } from './AmountInputCard';
import { LeverageInputCard } from './LeverageInputCard';
import { PositionSideSelector } from './PositionSideSelector';
import { DetailsSection } from './DetailsSection';
import { useHlNewPositionStore } from '@/features/perps/stores/hlNewPositionStore';
import { LiquidationInfo } from '@/features/perps/screens/perps-new-position-screen/LiquidationInfo';
import { TriggerOrdersSection } from '@/features/perps/screens/perps-new-position-screen/TriggerOrdersSection';
import { ScrollView } from 'react-native';
import { FOOTER_HEIGHT_WITH_SAFE_AREA } from '@/features/perps/constants';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

type MarketInfoSectionProps = {
  market: PerpMarket;
};

function MarketInfoSection({ market }: MarketInfoSectionProps) {
  const green = useForegroundColor('green');
  const red = useForegroundColor('red');
  const labelTertiary = useForegroundColor('labelTertiary');

  return (
    <Box flexDirection="row" alignItems="center" gap={12}>
      <HyperliquidTokenIcon symbol={market.symbol} style={{ width: 40, height: 40 }} />
      <Box gap={12}>
        <Text size="17pt" weight="bold" color="label">
          {market.symbol}
        </Text>
        <Box flexDirection="row" alignItems="center" gap={8}>
          <LiveTokenText
            tokenId={`${market.symbol}:hl`}
            initialValue={formatAssetPrice({ value: market.price, currency: 'USD' })}
            initialValueLastUpdated={0}
            selector={token => {
              return formatAssetPrice({ value: token.price, currency: 'USD' });
            }}
            size="15pt"
            weight="bold"
            color="labelSecondary"
          />
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
            color={'label'}
            size="15pt"
            weight="bold"
            align="right"
          />
        </Box>
      </Box>
    </Box>
  );
}

export const PerpsNewPositionScreen = memo(function PerpsNewPositionScreen() {
  const market = useHlNewPositionStore(state => state.market);
  const screenBackgroundColor = useBackgroundColor('surfacePrimary');

  if (!market) return null;

  return (
    <Box background={'surfacePrimary'} paddingHorizontal={'20px'} style={{ flex: 1 }}>
      <PerpsNavbar />
      <Box style={{ overflow: 'visible', paddingBottom: 24 }}>
        <PositionSideSelector />
      </Box>
      <Box style={{ flex: 1, position: 'relative' }}>
        <ScrollView showsVerticalScrollIndicator={false} contentInset={{ bottom: FOOTER_HEIGHT_WITH_SAFE_AREA }}>
          <Box paddingTop={'24px'}>
            <Stack space={'24px'} separator={<Separator color={'separatorTertiary'} direction="horizontal" />}>
              <MarketInfoSection market={market} />
              <Box gap={17}>
                <Box gap={24}>
                  <AmountInputCard />
                  <LeverageInputCard market={market} />
                </Box>
                <Box paddingHorizontal={'8px'}>
                  <LiquidationInfo market={market} />
                </Box>
              </Box>
              <TriggerOrdersSection />
              <DetailsSection market={market} />
            </Stack>
          </Box>
        </ScrollView>
        <EasingGradient
          endColor={screenBackgroundColor}
          startColor={screenBackgroundColor}
          endOpacity={0}
          startOpacity={1}
          style={{
            height: 32,
            width: DEVICE_WIDTH,
            pointerEvents: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
          }}
        />
      </Box>
    </Box>
  );
});
