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
import { truncateToDecimals } from '@/safe-math/SafeMath';

export const MarketsSection = memo(function MarketsSection({ eventId }: { eventId: string }) {
  const event = usePolymarketEventStore(state => state.getData());

  return (
    <Box gap={12}>
      <Text size="15pt" weight="bold" color="label">
        {'Outcomes'}
      </Text>
      <Box gap={8}>{event?.markets?.map(market => <MarketRow key={market.id} market={market} />)}</Box>
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
          <Text size="17pt" weight="bold" color="label">
            {market.groupItemTitle}
          </Text>
          <Text size="15pt" weight="bold" color="labelSecondary">
            {market.volume}
          </Text>
        </Box>
        <SkiaBadge
          text={truncateToDecimals(String(market.lastTradePrice * 100), 1)}
          textColor={{ custom: accentColor }}
          fillColor={opacityWorklet(accentColor, 0.16)}
          strokeColor={opacityWorklet(accentColor, 0.06)}
          strokeWidth={2.5}
          fontSize="26pt"
          fontWeight="heavy"
          height={46}
        />
      </Box>
    </GradientBorderView>
  );
});
