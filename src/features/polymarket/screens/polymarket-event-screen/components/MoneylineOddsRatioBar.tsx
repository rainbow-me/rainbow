import React, { memo, useMemo } from 'react';
import * as i18n from '@/languages';
import { Box, Text, TextShadow, useColorMode } from '@/design-system';
import { PolymarketEvent, PolymarketMarketEvent, PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { getMarketsGroupedByBetType } from '@/features/polymarket/screens/polymarket-event-screen/utils/getMarketsGroupedByBetType';
import { POLYMARKET_SPORTS_MARKET_TYPE } from '@/features/polymarket/constants';
import { getOutcomeColor } from '@/features/polymarket/utils/getMarketColor';
import { toPercentageWorklet } from '@/safe-math/SafeMath';
import { isDrawMarket } from '@/features/polymarket/utils/sports';
import { useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';
import { formatPrice } from '@/features/polymarket/utils/formatPrice';
import { PolymarketTeamInfo } from '@/features/polymarket/types';
import { formatNumber } from '@/helpers/strings';

const BAR_HEIGHT = 8;
const BAR_GAP = 4;

type MoneylineOutcome = {
  id: string;
  price: string;
  isDraw: boolean;
  color: string;
};

export const MoneylineOddsRatioBar = memo(function MoneylineOddsRatioBar({ event }: { event: PolymarketEvent | PolymarketMarketEvent }) {
  const moneylineGroup = useMemo(() => {
    if (!('markets' in event)) return undefined;
    const groups = getMarketsGroupedByBetType(event).moneyline;
    return groups.find(group => group.sportsMarketType === POLYMARKET_SPORTS_MARKET_TYPE.MONEYLINE) ?? groups[0];
  }, [event]);

  if (!moneylineGroup || !('markets' in event)) return null;

  return moneylineGroup.isThreeWay ? (
    <ThreeWayMoneylineOddsRatioBar event={event} markets={moneylineGroup.markets} />
  ) : (
    <StandardMoneylineOddsRatioBar event={event} market={moneylineGroup.markets[0]} />
  );
});

const StandardMoneylineOddsRatioBar = memo(function StandardMoneylineOddsRatioBar({
  event,
  market,
}: {
  event: PolymarketEvent;
  market: PolymarketMarket;
}) {
  const { isDarkMode } = useColorMode();
  const livePriceA = useLiveMarketPrice(market, 0);
  const livePriceB = useLiveMarketPrice(market, 1);

  const outcomes = useMemo<MoneylineOutcome[]>(() => {
    return [
      createOutcome({ market, livePrice: livePriceA, outcomeIndex: 0, isDarkMode, teams: event.teams }),
      createOutcome({ market, livePrice: livePriceB, outcomeIndex: 1, isDarkMode, teams: event.teams }),
    ];
  }, [event.teams, isDarkMode, livePriceA, livePriceB, market]);

  return <MoneylineOddsRatioBarContent outcomes={outcomes} eventVolume={event.volume} />;
});

const ThreeWayMoneylineOddsRatioBar = memo(function ThreeWayMoneylineOddsRatioBar({
  event,
  markets,
}: {
  event: PolymarketEvent;
  markets: PolymarketMarket[];
}) {
  const { isDarkMode } = useColorMode();
  const marketA = markets[0];
  const marketB = markets[1];
  const marketC = markets[2];

  const livePriceA = useLiveMarketPrice(marketA);
  const livePriceB = useLiveMarketPrice(marketB);
  const livePriceC = useLiveMarketPrice(marketC);

  const outcomes = useMemo<MoneylineOutcome[]>(() => {
    return [
      createOutcome({ market: marketA, livePrice: livePriceA, outcomeIndex: 0, isDarkMode, teams: event.teams }),
      createOutcome({ market: marketB, livePrice: livePriceB, outcomeIndex: 1, isDarkMode, teams: event.teams }),
      createOutcome({ market: marketC, livePrice: livePriceC, outcomeIndex: 2, isDarkMode, teams: event.teams }),
    ];
  }, [event.teams, isDarkMode, livePriceA, livePriceB, livePriceC, marketA, marketB, marketC]);

  return <MoneylineOddsRatioBarContent outcomes={outcomes} eventVolume={event.volume} />;
});

const MoneylineOddsRatioBarContent = memo(function MoneylineOddsRatioBarContent({
  outcomes,
  eventVolume,
}: {
  outcomes: MoneylineOutcome[];
  eventVolume: number;
}) {
  const ratios = useMemo(() => calculateRatios(outcomes.map(outcome => Number(outcome.price))), [outcomes]);
  const outcomesNoDraw = useMemo(() => outcomes.filter(outcome => !outcome.isDraw), [outcomes]);

  return (
    <Box gap={16} paddingHorizontal="8px">
      <Box flexDirection="row" height={BAR_HEIGHT} gap={BAR_GAP}>
        {outcomes.map((outcome, index) => (
          <Box
            key={outcome.id}
            style={{
              flex: ratios[index],
              shadowColor: outcome.color,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 10,
              elevation: 4,
            }}
            backgroundColor={outcome.color}
            height={BAR_HEIGHT}
            borderRadius={4}
          />
        ))}
      </Box>
      <Box height={41} flexDirection="row" justifyContent="space-between" alignItems="center">
        <TextShadow key={`${outcomesNoDraw[0].id}-percent`} blur={20} shadowOpacity={0.4} color={outcomesNoDraw[0].color}>
          <Text size="34pt" weight="heavy" color={{ custom: outcomesNoDraw[0].color }}>
            {`${toPercentageWorklet(outcomesNoDraw[0].price)}%`}
          </Text>
        </TextShadow>
        <Text color="labelQuaternary" size="15pt" weight="bold">
          {`${formatNumber(String(eventVolume), { useOrderSuffix: true, decimals: 1, style: '$' })} ${i18n.t(i18n.l.market_data.vol)}`}
        </Text>
        <TextShadow key={`${outcomesNoDraw[1].id}-percent`} blur={20} shadowOpacity={0.4} color={outcomesNoDraw[1].color}>
          <Text size="34pt" weight="heavy" color={{ custom: outcomesNoDraw[1].color }}>
            {`${toPercentageWorklet(outcomesNoDraw[1].price)}%`}
          </Text>
        </TextShadow>
      </Box>
    </Box>
  );
});

function useLiveMarketPrice(market: PolymarketMarket, outcomeIndex = 0) {
  return useLiveTokenValue({
    tokenId: getPolymarketTokenId(market.clobTokenIds[outcomeIndex], 'sell'),
    initialValue: formatPrice(market.outcomePrices[outcomeIndex], market.orderPriceMinTickSize),
    selector: token => formatPrice(token.price, market.orderPriceMinTickSize),
  });
}

function createOutcome({
  market,
  livePrice,
  outcomeIndex,
  isDarkMode,
  teams,
}: {
  market: PolymarketMarket;
  livePrice: string;
  outcomeIndex: number;
  isDarkMode: boolean;
  teams: PolymarketTeamInfo[] | undefined;
}): MoneylineOutcome {
  return {
    id: market.id,
    price: livePrice,
    isDraw: isDrawMarket(market),
    color: getOutcomeColor({
      market,
      outcome: market.groupItemTitle ?? market.outcomes[outcomeIndex],
      outcomeIndex,
      isDarkMode,
      teams,
    }),
  };
}

function calculateRatios(values: number[]) {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return values.map(() => 1);
  }

  return values.map(value => Math.max((value / total) * 100, 1));
}
