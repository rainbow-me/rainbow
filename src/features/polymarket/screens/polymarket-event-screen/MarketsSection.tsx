import { Box, Text } from '@/design-system';
import { memo } from 'react';
import { usePolymarketEventStore } from '@/features/polymarket/stores/polymarketEventStore';
import { PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import ImgixImage from '@/components/images/ImgixImage';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { LinearGradient } from 'react-native-linear-gradient';
import { StyleSheet } from 'react-native';
import { SkiaBadge } from '@/components/SkiaBadge';
import { lessThanWorklet, toPercentageWorklet } from '@/safe-math/SafeMath';
import { formatNumber } from '@/helpers/strings';
import { ButtonPressAnimation } from '@/components/animations';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

export const MarketsSection = memo(function MarketsSection() {
  const markets = usePolymarketEventStore(state => state.getMarkets());

  return (
    <Box gap={12}>
      <Text size="15pt" weight="bold" color="label">
        {'Outcomes'}
      </Text>
      <Box gap={8}>{markets?.map(market => <MarketRow key={market.id} market={market} />)}</Box>
    </Box>
  );
});

const MarketRow = memo(function MarketRow({ market }: { market: PolymarketMarket }) {
  const accentColor = market.seriesColor || '#DC5CEA';

  return (
    <GradientBorderView
      borderGradientColors={[opacityWorklet(accentColor, 0.06), opacityWorklet(accentColor, 0)]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 0 }}
      borderRadius={24}
      style={{ overflow: 'hidden' }}
    >
      <LinearGradient
        colors={[opacityWorklet(accentColor, 0.14), opacityWorklet(accentColor, 0)]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0 }}
        pointerEvents="none"
      />
      <Box height={66} flexDirection="row" alignItems="center" gap={12} paddingRight={'10px'}>
        <ImgixImage resizeMode="cover" size={40} source={{ uri: market.icon }} style={{ height: 40, width: 40, borderRadius: 9 }} />
        <Box gap={12} style={{ flex: 1 }}>
          <Box flexDirection="row" alignItems="center" gap={8}>
            <Text size="17pt" weight="bold" color="label">
              {market.groupItemTitle}
            </Text>
            {market.oneDayPriceChange && (
              <Box flexDirection="row" alignItems="center" gap={3}>
                <Text
                  size="icon 8px"
                  weight="heavy"
                  color={lessThanWorklet(market.oneDayPriceChange, 0) ? 'red' : 'green'}
                  style={{ transform: lessThanWorklet(market.oneDayPriceChange, 0) ? [{ rotate: '180deg' }] : [] }}
                >
                  {'􀛤'}
                </Text>
                <Text size="15pt" weight="heavy" color={lessThanWorklet(market.oneDayPriceChange, 0) ? 'red' : 'green'}>
                  {`${toPercentageWorklet(market.oneDayPriceChange)}%`}
                </Text>
              </Box>
            )}
          </Box>
          <Text size="15pt" weight="bold" color="labelSecondary">
            {formatNumber(market.volume, { useOrderSuffix: true, decimals: 1, style: '$' })}
          </Text>
        </Box>
        <ButtonPressAnimation onPress={() => Navigation.handleAction(Routes.POLYMARKET_MARKET_SHEET, { market })}>
          <SkiaBadge
            text={`${toPercentageWorklet(market.lastTradePrice, 0.001)}%`}
            textColor={{ custom: accentColor }}
            gradientFill={[
              {
                colors: [opacityWorklet(accentColor, 0.16), opacityWorklet(accentColor, 0.08)],
                start: { x: 0, y: 0 },
                end: { x: 0, y: 1 },
              },
            ]}
            innerShadows={[{ dx: 0, dy: 1, blur: 2.5, color: opacityWorklet(accentColor, 0.24) }]}
            strokeColor={opacityWorklet(accentColor, 0.06)}
            strokeWidth={2.5}
            fontSize="26pt"
            fontWeight="heavy"
            height={46}
            paddingHorizontal={12}
            borderRadius={16}
          />
        </ButtonPressAnimation>
      </Box>
    </GradientBorderView>
  );
});
