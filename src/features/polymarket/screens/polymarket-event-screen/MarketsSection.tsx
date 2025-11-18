import { Box, Text } from '@/design-system';
import { memo } from 'react';
import { usePolymarketEventStore } from '@/features/polymarket/stores/polymarketEventStore';
import { PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import ImgixImage from '@/components/images/ImgixImage';

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
  return (
    <Box height={66} flexDirection="row" alignItems="center" gap={12} background={'surfaceSecondary'}>
      <ImgixImage resizeMode="cover" size={40} source={{ uri: market.icon }} style={{ height: 40, width: 40, borderRadius: 9 }} />
      <Box gap={12} style={{ flex: 1 }}>
        <Text size="17pt" weight="bold" color="label">
          {market.groupItemTitle}
        </Text>
        <Text size="15pt" weight="bold" color="labelSecondary">
          {market.volume}
        </Text>
      </Box>
      <Text size="15pt" weight="bold" color="labelSecondary">
        {market.lastTradePrice}
      </Text>
    </Box>
  );
});
