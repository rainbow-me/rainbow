import { Bleed, Box, Text, TextIcon, useBackgroundColor, useColorMode } from '@/design-system';
import { memo } from 'react';
import { usePolymarketEventStore } from '@/features/polymarket/stores/polymarketEventStore';
import { PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { ShimmerAnimation } from '@/components/animations';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { MarketRow } from '@/features/polymarket/screens/polymarket-event-screen/MarketRow';
import { ResolvedMarketsSection } from '@/features/polymarket/screens/polymarket-event-screen/components/ResolvedMarketsSection';
import { SingleMarketEventOutcomes } from '@/features/polymarket/screens/polymarket-event-screen/components/SingleMarketEvent';
import { opacityWorklet } from '@/__swaps__/utils/swaps';

export const MarketsSection = memo(function MarketsSection() {
  const markets = usePolymarketEventStore(state => state.getMarkets());
  const isSingleMarketEvent = markets?.length === 1;

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
      {markets ? (
        <>
          {isSingleMarketEvent && <SingleMarketEventOutcomes market={markets?.[0]} />}
          {!isSingleMarketEvent && <MultiMarketEvent markets={markets} />}
        </>
      ) : (
        <MarketRowLoadingSkeleton />
      )}
    </Box>
  );
});

const MultiMarketEvent = memo(function MultiMarketEvent({ markets }: { markets: PolymarketMarket[] }) {
  const activeMarkets = markets.filter(market => !market.closed);
  const resolvedMarkets = markets.filter(market => market.closed);
  const uniqueMarketImages = usePolymarketEventStore(state => state.getData()?.uniqueMarketImages ?? false);

  return (
    <>
      <Bleed right={'8px'}>
        <Box gap={8}>
          {activeMarkets?.map(market => (
            <MarketRow
              key={market.id}
              accentColor={market.color}
              priceChange={market.oneDayPriceChange}
              image={uniqueMarketImages ? market.icon : undefined}
              title={market.groupItemTitle}
              volume={market.volume}
              tokenId={market.clobTokenIds[0]}
              price={market.lastTradePrice ? String(market.lastTradePrice) : '0'}
              minTickSize={market.orderPriceMinTickSize}
              onPress={() => Navigation.handleAction(Routes.POLYMARKET_MARKET_SHEET, { market })}
            />
          ))}
        </Box>
      </Bleed>
      {resolvedMarkets?.length > 0 && <ResolvedMarketsSection markets={resolvedMarkets} uniqueMarketImages={uniqueMarketImages} />}
    </>
  );
});

const MarketRowLoadingSkeleton = memo(function MarketRowLoadingSkeleton() {
  const { isDarkMode } = useColorMode();
  const fillQuaternary = useBackgroundColor('fillQuaternary');
  const shimmerColor = opacityWorklet(fillQuaternary, isDarkMode ? 0.025 : 0.06);

  return (
    <Box gap={8}>
      <Box backgroundColor={fillQuaternary} height={66} width={'full'} borderRadius={26} style={{ overflow: 'hidden' }}>
        <ShimmerAnimation color={shimmerColor} gradientColor={shimmerColor} />
      </Box>
      <Box backgroundColor={fillQuaternary} height={66} width={'full'} borderRadius={26} style={{ overflow: 'hidden' }}>
        <ShimmerAnimation color={shimmerColor} gradientColor={shimmerColor} />
      </Box>
    </Box>
  );
});
