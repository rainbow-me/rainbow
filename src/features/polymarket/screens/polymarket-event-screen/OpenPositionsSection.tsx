import { Box, Separator, Text } from '@/design-system';
import { PolymarketPositionCard } from '@/features/polymarket/components/PolymarketPositionCard';
import { usePolymarketPositionsStore } from '@/features/polymarket/stores/polymarketPositionsStore';
import { memo } from 'react';

export const OpenPositionsSection = memo(function OpenPositionsSection({ eventId }: { eventId: string }) {
  const positions = usePolymarketPositionsStore(state => state.getEventPositions(eventId));

  if (!positions) return null;

  return (
    <Box gap={12}>
      <Text size="20pt" weight="heavy" color="label">
        Open Positions
      </Text>
      <Box gap={16}>
        {positions.map(position => (
          <PolymarketPositionCard key={position.slug} position={position} />
        ))}
        <Separator color={'separatorTertiary'} direction="horizontal" thickness={1} />
      </Box>
    </Box>
  );
});
