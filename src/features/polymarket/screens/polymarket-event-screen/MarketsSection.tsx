import { Bleed, Box, Text, TextIcon, useColorMode } from '@/design-system';
import * as i18n from '@/languages';
import { memo, useMemo, useState } from 'react';
import { usePolymarketEventStore } from '@/features/polymarket/stores/polymarketEventStore';
import { PolymarketEvent, PolymarketMarket, PolymarketMarketEvent } from '@/features/polymarket/types/polymarket-event';
import { ButtonPressAnimation } from '@/components/animations';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { MarketRow, MarketRowLoadingSkeleton } from '@/features/polymarket/screens/polymarket-event-screen/MarketRow';
import { ResolvedMarketsList } from '@/features/polymarket/screens/polymarket-event-screen/components/ResolvedMarketsList';
import { SingleMarketEventOutcomes } from '@/features/polymarket/screens/polymarket-event-screen/components/SingleMarketEvent';
import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import { opacity } from '@/data/opacity';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { getSolidColorEquivalent } from '@/worklets/colors';
import { POLYMARKET_BACKGROUND_LIGHT } from '@/features/polymarket/constants';
import useDimensions from '@/hooks/useDimensions';
import { THICKER_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { ResolvedMarketsSection } from '@/features/polymarket/screens/polymarket-event-screen/components/ResolvedMarketsSection';

export const MarketsSection = memo(function MarketsSection({ event }: { event: PolymarketEvent | null }) {
  const { isDarkMode } = useColorMode();
  const markets = event?.markets;
  const isSingleMarketEvent = markets?.length === 1;
  const eventColor = useMemo(() => getColorValueForThemeWorklet(event?.color, isDarkMode), [event?.color, isDarkMode]);

  return (
    <Box gap={20}>
      <Box flexDirection="row" alignItems="center" gap={10}>
        <TextIcon size="icon 17px" weight="bold" color={isDarkMode ? 'label' : { custom: eventColor }} opacity={isDarkMode ? 0.4 : 1}>
          {'􀢊'}
        </TextIcon>
        <Text size="20pt" weight="heavy" color="label">
          {i18n.t(i18n.l.predictions.event.outcomes)}
        </Text>
      </Box>
      {markets ? (
        <>
          {isSingleMarketEvent && <SingleMarketEventOutcomes market={markets[0]} event={event} />}
          {!isSingleMarketEvent && <MultiMarketEvent markets={markets} event={event} />}
        </>
      ) : (
        <MarketRowLoadingSkeleton />
      )}
    </Box>
  );
});

const MultiMarketEvent = memo(function MultiMarketEvent({
  markets,
  event,
}: {
  markets: PolymarketMarket[];
  event: PolymarketMarketEvent | PolymarketEvent;
}) {
  const { width } = useDimensions();
  const { isDarkMode } = useColorMode();
  const activeMarkets = markets.filter(market => !market.closed);
  const resolvedMarkets = markets.filter(market => market.closed);
  const [showAllMarkets, setShowAllMarkets] = useState(markets.length <= 10);
  const showMarketImages = usePolymarketEventStore(state => state.getData()?.showMarketImages ?? false);
  const allResolved = activeMarkets.length === 0;
  const visibleMarkets = showAllMarkets ? activeMarkets : activeMarkets.slice(0, 10);
  const eventColor = getColorValueForThemeWorklet(event.color, isDarkMode);
  const screenBackgroundColor = isDarkMode
    ? getSolidColorEquivalent({ background: eventColor, foreground: '#000000', opacity: 0.92 })
    : POLYMARKET_BACKGROUND_LIGHT;

  return (
    <>
      <Box>
        {activeMarkets.length > 0 && (
          <Box gap={8}>
            {visibleMarkets.map(market => (
              <MarketRow
                key={market.id}
                accentColor={getColorValueForThemeWorklet(market.color, isDarkMode)}
                priceChange={market.oneDayPriceChange}
                image={showMarketImages ? market.icon : undefined}
                title={market.groupItemTitle}
                volume={market.volume}
                tokenId={market.clobTokenIds[0]}
                price={market.lastTradePrice ? String(market.lastTradePrice) : '0'}
                minTickSize={market.orderPriceMinTickSize}
                onPress={() => {
                  Navigation.handleAction(Routes.POLYMARKET_MARKET_SHEET, { market, event });
                }}
              />
            ))}
          </Box>
        )}
        {resolvedMarkets.length > 0 && showAllMarkets && (
          <Box paddingTop={'20px'}>
            <ResolvedMarketsSection markets={resolvedMarkets} showMarketImages={showMarketImages} />
          </Box>
        )}
        {allResolved && <ResolvedMarketsList markets={resolvedMarkets} showMarketImages={showMarketImages} />}
        {!allResolved && markets.length > 10 && (
          <>
            <Box position="absolute" bottom={{ custom: 0 }} width="full">
              <EasingGradient
                startPosition="top"
                endPosition="bottom"
                startColor={screenBackgroundColor}
                endColor={screenBackgroundColor}
                startOpacity={0}
                endOpacity={1}
                style={{ height: 150, width, position: 'absolute', bottom: 0, left: 0, opacity: showAllMarkets ? 0 : 1 }}
              />
            </Box>
            <ButtonPressAnimation onPress={() => setShowAllMarkets(prev => !prev)}>
              <Bleed top={showAllMarkets ? { custom: -20 } : '10px'}>
                <Box flexDirection="row" alignItems="center" justifyContent="center" gap={8}>
                  <Box
                    height={20}
                    width={20}
                    justifyContent="center"
                    alignItems="center"
                    backgroundColor={opacity('#F5F8FF', 0.09)}
                    borderRadius={10}
                    style={{ transform: [{ rotate: showAllMarkets ? '180deg' : '0deg' }] }}
                  >
                    <TextIcon size="icon 10px" weight="black" color="label">
                      {'􀆈'}
                    </TextIcon>
                  </Box>
                  <Text size="17pt" weight="bold" color="label">
                    {showAllMarkets ? i18n.t(i18n.l.predictions.event.show_less) : i18n.t(i18n.l.predictions.event.show_more)}
                  </Text>
                  {resolvedMarkets.length > 0 && !showAllMarkets && (
                    <Box
                      backgroundColor={opacity('#F5F8FF', 0.06)}
                      borderWidth={THICKER_BORDER_WIDTH}
                      borderColor={{ custom: opacity('#F5F8FF', 0.03) }}
                      height={22}
                      paddingHorizontal={'8px'}
                      borderRadius={11}
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Text size="13pt" weight="bold" color="labelQuaternary">
                        {`${resolvedMarkets.length} ${i18n.t(i18n.l.predictions.event.resolved)}`}
                      </Text>
                    </Box>
                  )}
                </Box>
              </Bleed>
            </ButtonPressAnimation>
          </>
        )}
      </Box>
    </>
  );
});
