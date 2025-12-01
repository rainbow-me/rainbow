import { memo } from 'react';
import { PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { Box, useForegroundColor } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { MarketRow } from '@/features/polymarket/screens/polymarket-event-screen/MarketRow';

export const SingleMarketEvent = memo(function SingleMarketEvent({
  market,
  outcomeTitles,
}: {
  market: PolymarketMarket;
  outcomeTitles?: string[];
}) {
  const green = useForegroundColor('green');
  const red = useForegroundColor('red');

  return (
    <Box gap={8}>
      {market.outcomes.map((outcome, index) => (
        <ButtonPressAnimation
          key={outcome}
          onPress={() => Navigation.handleAction(Routes.POLYMARKET_NEW_POSITION_SHEET, { market, outcome })}
        >
          <MarketRow
            accentColor={index === 0 ? green : red}
            // TODO: Will need to include this as live price fetching or just accept it's not available
            priceChange={0}
            title={outcomeTitles?.[index] ?? outcome}
            tokenId={market.clobTokenIds[index]}
            price={market.outcomePrices[index]}
          />
        </ButtonPressAnimation>
      ))}
    </Box>
  );
});
