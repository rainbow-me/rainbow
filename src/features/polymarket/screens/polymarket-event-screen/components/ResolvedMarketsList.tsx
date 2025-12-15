import { Box } from '@/design-system';
import { memo } from 'react';
import { PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { ResolvedMarketRow } from '@/features/polymarket/screens/polymarket-event-screen/components/ResolvedMarketRow';

export const ResolvedMarketsList = memo(function ResolvedMarketsList({
  markets,
  showMarketImages,
}: {
  markets: PolymarketMarket[];
  showMarketImages: boolean;
}) {
  return (
    <Box gap={8}>
      {markets.map(market => {
        const resolvedOutcomeIndex = market.outcomePrices.findIndex(price => price === '1');

        return (
          <ResolvedMarketRow
            key={market.id}
            accentColor={market.color}
            image={showMarketImages ? market.icon : undefined}
            title={market.groupItemTitle}
            volume={market.volume}
            isWinningOutcome={resolvedOutcomeIndex === 0}
          />
        );
      })}
    </Box>
  );
});
