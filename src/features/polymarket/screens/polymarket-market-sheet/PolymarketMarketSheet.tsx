import { memo } from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
import { Box, Separator, Text, useForegroundColor } from '@/design-system';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import ImgixImage from '@/components/images/ImgixImage';
import { formatNumber } from '@/helpers/strings';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Navigation } from '@/navigation';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { PolymarketOutcome } from '@/features/polymarket/constants';

export const PolymarketMarketSheet = memo(function PolymarketMarketSheet() {
  const {
    params: { market },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.POLYMARKET_MARKET_SHEET>>();

  const green = useForegroundColor('green');
  const red = useForegroundColor('red');

  return (
    <PanelSheet innerBorderWidth={1}>
      <Box paddingHorizontal="24px" paddingBottom={'24px'} paddingTop={{ custom: 33 }}>
        <Box gap={20}>
          <Header market={market} />
          <Separator color="separatorTertiary" direction="horizontal" thickness={1} />
          <MarketChart />
        </Box>
        <Box paddingTop={'24px'} gap={12}>
          <ButtonPressAnimation
            onPress={() => Navigation.handleAction(Routes.POLYMARKET_NEW_POSITION_SHEET, { market, outcome: PolymarketOutcome.YES })}
          >
            <Box
              height={56}
              backgroundColor={opacityWorklet(green, 0.16)}
              borderRadius={28}
              borderWidth={2.5}
              borderColor={{ custom: opacityWorklet(green, 0.06) }}
              paddingHorizontal="24px"
              justifyContent="center"
              alignItems="center"
            >
              <Text size="22pt" weight="heavy" color={'green'}>
                {'Buy Yes'}
              </Text>
            </Box>
          </ButtonPressAnimation>
          <ButtonPressAnimation
            onPress={() => Navigation.handleAction(Routes.POLYMARKET_NEW_POSITION_SHEET, { market, outcome: PolymarketOutcome.NO })}
          >
            <Box
              height={56}
              backgroundColor={opacityWorklet(red, 0.16)}
              borderRadius={28}
              borderWidth={2.5}
              borderColor={{ custom: opacityWorklet(red, 0.06) }}
              paddingHorizontal="24px"
              justifyContent="center"
              alignItems="center"
            >
              <Text size="22pt" weight="heavy" color={'red'}>
                {'Buy No'}
              </Text>
            </Box>
          </ButtonPressAnimation>
        </Box>
      </Box>
    </PanelSheet>
  );
});

const Header = memo(function Header({ market }: { market: PolymarketMarket }) {
  return (
    <Box>
      <Box flexDirection="row" alignItems="center" gap={14}>
        <ImgixImage resizeMode="cover" size={56} source={{ uri: market.icon }} style={{ height: 56, width: 56, borderRadius: 12 }} />
        <Box gap={14}>
          <Text size="26pt" weight="heavy" color="label">
            {market.groupItemTitle}
          </Text>
          <Text size="15pt" weight="bold" color="labelQuaternary">
            {formatNumber(market.volume, { useOrderSuffix: true, decimals: 1, style: '$' })}
          </Text>
        </Box>
      </Box>
    </Box>
  );
});

const MarketChart = memo(function MarketChart() {
  return (
    <Box
      height={350}
      justifyContent="center"
      alignItems="center"
      backgroundColor="backgroundSecondary"
      borderRadius={12}
      borderWidth={1}
      borderColor="separator"
    >
      <Text color="label" size="15pt" weight="bold">
        Chart
      </Text>
    </Box>
  );
});
