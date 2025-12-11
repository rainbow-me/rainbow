import { memo } from 'react';
import { PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { Box, useForegroundColor } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { MarketRow } from '@/features/polymarket/screens/polymarket-event-screen/MarketRow';
import { PolymarketTeamInfo } from '@/features/polymarket/types';

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

  return (
    <Box gap={8}>
      {market.outcomes.map((outcome, index) => {
        const team = teams?.find(team => team.alias === outcome);
        const outcomeColor = team?.color ?? (index === 0 ? green : red);
        const outcomeImage = team?.logo;

        return (
          <ButtonPressAnimation
            key={outcome}
            scaleTo={0.96}
            onPress={() => Navigation.handleAction(Routes.POLYMARKET_NEW_POSITION_SHEET, { market, outcomeIndex: index })}
          >
            <MarketRow
              accentColor={outcomeColor}
              image={outcomeImage}
              priceChange={0}
              title={outcomeTitles?.[index] ?? outcome}
              tokenId={market.clobTokenIds[index]}
              price={market.outcomePrices[index]}
              minTickSize={market.orderPriceMinTickSize}
            />
          </ButtonPressAnimation>
        );
      })}
    </Box>
  );
});
