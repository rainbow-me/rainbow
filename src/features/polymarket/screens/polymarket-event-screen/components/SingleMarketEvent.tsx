import { memo } from 'react';
import { PolymarketEvent, PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { Box, useColorMode } from '@/design-system';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { MarketRow } from '@/features/polymarket/screens/polymarket-event-screen/MarketRow';
import { PolymarketTeamInfo } from '@/features/polymarket/types';
import { ResolvedMarketRow } from '@/features/polymarket/screens/polymarket-event-screen/components/ResolvedMarketRow';
import { getOutcomeTeam } from '@/features/polymarket/utils/getOutcomeTeam';
import { getOutcomeColor } from '@/features/polymarket/utils/getMarketColor';

export const SingleMarketEventOutcomes = memo(function SingleMarketEventOutcomes({
  market,
  outcomeTitles,
  teams,
  event,
}: {
  market: PolymarketMarket;
  outcomeTitles?: string[];
  teams?: PolymarketTeamInfo[];
  event: PolymarketEvent;
}) {
  const { isDarkMode } = useColorMode();
  const winningOutcomeIndex = getWinningOutcomeIndex(market);

  return (
    <Box gap={8}>
      {market.outcomes.map((outcome, index) => {
        const isTeamBased = isTeamBasedOutcome(outcome);
        const outcomeImage = isTeamBased ? getOutcomeTeam({ outcome, outcomeIndex: index, teams })?.logo : undefined;
        const outcomeColor = isTeamBased
          ? getOutcomeColor({ market, outcome, outcomeIndex: index, isDarkMode, teams })
          : getOutcomeColor({ market, outcome, outcomeIndex: index, isDarkMode });

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
              Navigation.handleAction(Routes.POLYMARKET_NEW_POSITION_SHEET, {
                market,
                event,
                outcomeIndex: index,
                outcomeColor,
                fromRoute: Routes.POLYMARKET_EVENT_SCREEN,
              });
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

function isTeamBasedOutcome(outcome: string): boolean {
  const outcomeLowerCase = outcome.toLowerCase();
  if (outcomeLowerCase === 'yes' || outcomeLowerCase === 'no') return false;
  if (outcomeLowerCase === 'over' || outcomeLowerCase === 'under') return false;
  return true;
}
