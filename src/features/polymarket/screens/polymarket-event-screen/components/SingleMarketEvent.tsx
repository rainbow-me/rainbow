import { memo } from 'react';
import { PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { Box, useForegroundColor } from '@/design-system';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { MarketRow } from '@/features/polymarket/screens/polymarket-event-screen/MarketRow';
import { PolymarketTeamInfo } from '@/features/polymarket/types';
import { ResolvedMarketRow } from '@/features/polymarket/screens/polymarket-event-screen/components/ResolvedMarketRow';

export const SingleMarketEventOutcomes = memo(function SingleMarketEventOutcomes({
  market,
  outcomeTitles,
  teams,
}: {
  market: PolymarketMarket;
  outcomeTitles?: string[];
  teams?: PolymarketTeamInfo[];
}) {
  const green = useForegroundColor('green');
  const red = useForegroundColor('red');

  const winningOutcomeIndex = getWinningOutcomeIndex(market);

  return (
    <Box gap={8}>
      {market.outcomes.map((outcome, index) => {
        const team = teams?.find(team => (team.alias ?? team.name)?.toLowerCase() === outcome.toLowerCase());
        const outcomeColor = team?.color ?? (index === 0 ? green : red);
        const outcomeImage = team?.logo;

        if (winningOutcomeIndex !== null) {
          return (
            <ResolvedMarketRow
              key={outcome}
              accentColor={outcomeColor}
              image={outcomeImage}
              title={outcomeTitles?.[index] ?? outcome}
              isWinningOutcome={index === winningOutcomeIndex}
            />
          );
        }

        return (
          <MarketRow
            key={outcome}
            accentColor={outcomeColor}
            image={outcomeImage}
            priceChange={0}
            title={outcomeTitles?.[index] ?? outcome}
            tokenId={market.clobTokenIds[index]}
            price={market.outcomePrices[index]}
            minTickSize={market.orderPriceMinTickSize}
            onPress={() => {
              Navigation.handleAction(Routes.POLYMARKET_NEW_POSITION_SHEET, { market, outcomeIndex: index, outcomeColor });
            }}
          />
        );
      })}
    </Box>
  );
});

function getWinningOutcomeIndex(market: PolymarketMarket): number | null {
  if (market.umaResolutionStatus !== 'resolved') return null;

  const winningOutcomeIndex = market.outcomePrices.findIndex(p => p === '1');

  return winningOutcomeIndex;
}
