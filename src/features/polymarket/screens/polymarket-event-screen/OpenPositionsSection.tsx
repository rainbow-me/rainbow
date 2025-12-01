import { Box, Separator, Text, TextIcon } from '@/design-system';
import { PolymarketPositionCard } from '@/features/polymarket/components/PolymarketPositionCard';
import { usePolymarketPositionsStore } from '@/features/polymarket/stores/polymarketPositionsStore';
import { memo } from 'react';

export const OpenPositionsSection = memo(function OpenPositionsSection({ eventId }: { eventId: string }) {
  const positions = usePolymarketPositionsStore(state => state.getEventPositions(eventId));

  if (positions.length === 0) return null;

  return (
    <Box gap={28}>
      <Box gap={20}>
        <Box flexDirection="row" alignItems="center" gap={10}>
          <Box style={{ opacity: 0.4 }}>
            <TextIcon size="icon 17px" weight="bold" color="label">
              {'􁎢'}
            </TextIcon>
          </Box>
          <Text size="20pt" weight="heavy" color="label">
            {'Open Positions'}
          </Text>
        </Box>
        <Box gap={12}>
          {positions.map(position => (
            <PolymarketPositionCard key={position.slug} position={position} showEventTitle={false} />
          ))}
        </Box>
      </Box>
      <Separator color={'separatorSecondary'} direction="horizontal" thickness={1} />
    </Box>
  );
});
