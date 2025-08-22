import React, { memo } from 'react';
import { Box, Separator, Stack, Text, useForegroundColor } from '@/design-system';
import { PerpsNavbar } from '@/features/perps/components/PerpsNavbar';
import { RouteProp, useRoute } from '@react-navigation/native';
import { PerpsStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
import { formatAssetPrice } from '@/helpers/formatAssetPrice';
import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { formatPriceChange } from '@/features/perps/utils';
import { PerpMarket } from '@/features/perps/types';
import { SizeInputCard } from '@/features/perps/screens/perps-new-position-screen/SizeInputCard';

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

function DetailsSection() {
  return (
    <Box>
      <Text size="20pt" weight="heavy" color={'label'}>
        {'Details'}
      </Text>
    </Box>
  );
}

export const PerpsNewPositionScreen = memo(function PerpsNewPositionScreen() {
  const {
    params: { market },
  } = useRoute<RouteProp<PerpsStackParamList, typeof Routes.PERPS_NEW_POSITION_SCREEN>>();

  return (
    <Box background={'surfacePrimary'} paddingHorizontal={'20px'} style={{ flex: 1 }}>
      <PerpsNavbar />
      <Box paddingTop={'20px'}>
        <Separator color={'separatorTertiary'} direction="horizontal" />
      </Box>
      <Stack space={'24px'} separator={<Separator color={'separatorTertiary'} direction="horizontal" />}>
        <MarketInfoSection market={market} />
        <SizeInputCard />
        <DetailsSection />
      </Stack>
    </Box>
  );
});
