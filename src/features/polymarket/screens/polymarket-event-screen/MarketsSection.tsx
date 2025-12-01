import { Box, Text, TextIcon } from '@/design-system';
import { memo } from 'react';
import { usePolymarketEventStore } from '@/features/polymarket/stores/polymarketEventStore';
import { PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { ButtonPressAnimation } from '@/components/animations';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { MarketRow } from '@/features/polymarket/screens/polymarket-event-screen/MarketRow';
import { ResolvedMarketsSection } from '@/features/polymarket/screens/polymarket-event-screen/components/ResolvedMarketsSection';
import { SingleMarketEvent } from '@/features/polymarket/screens/polymarket-event-screen/components/SingleMarketEvent';

export const MarketsSection = memo(function MarketsSection() {
  const markets = usePolymarketEventStore(state => state.getMarkets());
  const isSingleMarketEvent = markets?.length === 1;

  // TODO: Handle loading state
  if (!markets) return null;

  return (
    <Box gap={20}>
      <Box flexDirection="row" alignItems="center" gap={10}>
        <Box style={{ opacity: 0.4 }}>
          <TextIcon size="icon 17px" weight="bold" color="label">
            {'􀢊'}
          </TextIcon>
        </Box>
        <Text size="20pt" weight="heavy" color="label">
          {'Outcomes'}
        </Text>
      </Box>
      {isSingleMarketEvent && <SingleMarketEvent market={markets?.[0]} />}
      {!isSingleMarketEvent && <MultiMarketEvent markets={markets} />}
    </Box>
  );
});

const MultiMarketEvent = memo(function MultiMarketEvent({ markets }: { markets: PolymarketMarket[] }) {
  const activeMarkets = markets.filter(market => !market.closed);
  const resolvedMarkets = markets.filter(market => market.closed);
  const uniqueMarketImages = usePolymarketEventStore(state => state.getData()?.uniqueMarketImages ?? false);

  return (
    <>
      <Box gap={8}>
        {activeMarkets?.map(market => (
          <ButtonPressAnimation key={market.id} onPress={() => Navigation.handleAction(Routes.POLYMARKET_MARKET_SHEET, { market })}>
            <MarketRow
              accentColor={market.color}
              priceChange={market.oneDayPriceChange}
              image={uniqueMarketImages ? market.icon : undefined}
              title={market.groupItemTitle}
              volume={market.volume}
              tokenId={market.clobTokenIds[0]}
              price={String(market.lastTradePrice)}
            />
          </ButtonPressAnimation>
        ))}
      </Box>
      {resolvedMarkets?.length > 0 && <ResolvedMarketsSection markets={resolvedMarkets} />}
    </>
  );
});
