import { Box, useColorMode } from '@/design-system';
import { memo } from 'react';
import { PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { ResolvedMarketRow } from '@/features/polymarket/screens/polymarket-event-screen/components/ResolvedMarketRow';
import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';

export const ResolvedMarketsList = memo(function ResolvedMarketsList({
  markets,
  showMarketImages,
}: {
  markets: PolymarketMarket[];
  showMarketImages: boolean;
}) {
  const { isDarkMode } = useColorMode();

  return (
    <Box gap={8}>
      {markets.map(market => {
        const resolvedOutcomeIndex = market.outcomePrices.findIndex(price => price === '1');

        return (
          <ResolvedMarketRow
            key={market.id}
            accentColor={getColorValueForThemeWorklet(market.color, isDarkMode)}
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
