import { Box } from '@/design-system/components/Box/Box';
import { Separator } from '@/design-system/components/Separator/Separator';
import { Text } from '@/design-system/components/Text/Text';
import { TextIcon } from '@/design-system/components/TextIcon/TextIcon';
import { useColorMode } from '@/design-system/color/ColorMode';
import { PolymarketPositionCard } from '@/features/polymarket/components/PolymarketPositionCard';
import { usePolymarketPositionsStore } from '@/features/polymarket/stores/polymarketPositionsStore';
import * as i18n from '@/languages';
import { memo } from 'react';

export const OpenPositionsSection = memo(function OpenPositionsSection({ eventId, eventColor }: { eventId: string; eventColor: string }) {
  const { isDarkMode } = useColorMode();
  const positions = usePolymarketPositionsStore(state => state.getEventPositions(eventId));

  if (positions.length === 0) return null;

  return (
    <Box gap={28}>
      <Box gap={20}>
        <Box flexDirection="row" alignItems="center" gap={10}>
          <TextIcon size="icon 17px" weight="bold" color={isDarkMode ? 'label' : { custom: eventColor }} opacity={isDarkMode ? 0.4 : 1}>
            {'􁎢'}
          </TextIcon>
          <Text size="20pt" weight="heavy" color="label">
            {i18n.t(i18n.l.predictions.event.open_positions)}
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
