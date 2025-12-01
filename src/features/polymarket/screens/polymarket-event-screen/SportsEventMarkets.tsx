import { Box, Separator, Text, useColorMode, useForegroundColor } from '@/design-system';
import { BetTypeSelector } from '@/features/polymarket/screens/polymarket-event-screen/BetTypeSelector';
import { usePolymarketEventStore } from '@/features/polymarket/stores/polymarketEventStore';
import { PERPS_BACKGROUND_DARK, PERPS_BACKGROUND_LIGHT } from '@/features/perps/constants';
import { memo, useMemo, useState } from 'react';
import {
  BET_TYPE,
  BetType,
  getMarketsGroupedByBetType,
  GroupedSportsMarkets,
  LineBasedGroup,
  MoneylineGroup,
} from '@/features/polymarket/screens/polymarket-event-screen/utils/getMarketsGroupedByBetType';
import { ButtonPressAnimation } from '@/components/animations';
import { MarketRow } from '@/features/polymarket/screens/polymarket-event-screen/MarketRow';
import { PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { ItemSelector } from '@/features/polymarket/screens/polymarket-event-screen/ItemSelector';
import { useDimensions } from '@/hooks';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { POLYMARKET_SPORTS_MARKET_TYPE } from '@/features/polymarket/constants';
import { SingleMarketEvent } from '@/features/polymarket/screens/polymarket-event-screen/components/SingleMarketEvent';

export const SportsEventMarkets = memo(function SportsEventMarkets() {
  const event = usePolymarketEventStore(state => state.getData());
  const [selectedBetType, setSelectedBetType] = useState<BetType>(BET_TYPE.MONEYLINE);
  const { isDarkMode } = useColorMode();

  const backgroundColor = isDarkMode ? PERPS_BACKGROUND_DARK : PERPS_BACKGROUND_LIGHT;
  const groupedMarkets = event ? getMarketsGroupedByBetType(event) : null;

  if (!event || !groupedMarkets) return null;
  return (
    <Box gap={16}>
      <BetTypeSelector
        backgroundColor={backgroundColor}
        color={'#FFFFFF'}
        selectedBetType={selectedBetType}
        onSelectBetType={setSelectedBetType}
      />
      <Markets markets={groupedMarkets} selectedBetType={selectedBetType} />
    </Box>
  );
});

const Markets = memo(function Markets({ markets, selectedBetType }: { markets: GroupedSportsMarkets; selectedBetType: BetType }) {
  const selectedMarkets = useMemo(() => {
    if (selectedBetType === BET_TYPE.MONEYLINE) return markets.moneyline;
    if (selectedBetType === BET_TYPE.SPREADS) return markets.spreads;
    return markets.totals;
  }, [selectedBetType, markets]);

  return (
    <Box gap={24}>
      {selectedMarkets.map(market => {
        return (
          <>
            <Separator color="separatorSecondary" thickness={1} />
            {'lines' in market && <LineBasedMarket key={market.sportsMarketType} lineMarkets={market} />}
            {!('lines' in market) && <MoneylineMarket key={market.sportsMarketType} market={market} />}
          </>
        );
      })}
    </Box>
  );
});

const LineBasedMarket = memo(function LineBasedMarket({ lineMarkets }: { lineMarkets: LineBasedGroup }) {
  const { isDarkMode } = useColorMode();
  const { width } = useDimensions();
  const [selectedLineValue, setSelectedLineValue] = useState<number>(Math.abs(lineMarkets.mainLine));

  const selectedLine = useMemo(() => {
    return lineMarkets.lines.find(line => Math.abs(line.value) === selectedLineValue);
  }, [lineMarkets, selectedLineValue]);

  const backgroundColor = isDarkMode ? PERPS_BACKGROUND_DARK : PERPS_BACKGROUND_LIGHT;

  const lineSelectorItems = useMemo(() => {
    return lineMarkets.lines.reduce(
      (acc, line, index) => {
        const lineString = String(Math.abs(line.value));
        acc[lineString] = { value: lineString, label: lineString, index };
        return acc;
      },
      {} as Record<string, { value: string; label: string; index: number }>
    );
  }, [lineMarkets]);

  const outcomeTitles = useMemo(() => {
    if (!selectedLine) return ['', ''];

    const absoluteLineValue = Math.abs(selectedLine.value);

    if (
      lineMarkets.sportsMarketType === POLYMARKET_SPORTS_MARKET_TYPE.SPREADS ||
      lineMarkets.sportsMarketType === POLYMARKET_SPORTS_MARKET_TYPE.FIRST_HALF_SPREADS
    ) {
      // TODO: Should check the assumption that the first outcome is always the negative line
      return [`${selectedLine.market.outcomes[0]} -${absoluteLineValue}`, `${selectedLine.market.outcomes[1]} +${absoluteLineValue}`];
    }
    return [`${selectedLine.market.outcomes[0]} ${absoluteLineValue}`, `${selectedLine.market.outcomes[1]} ${absoluteLineValue}`];
  }, [selectedLine, lineMarkets.sportsMarketType]);

  if (!selectedLine) {
    return null;
  }

  return (
    <Box gap={24}>
      <Text size="20pt" weight="heavy" color="label">
        {lineMarkets.label}
      </Text>
      <Box gap={16}>
        {lineMarkets.lines.length > 1 && (
          <ItemSelector
            backgroundColor={backgroundColor}
            color={'#FFFFFF'}
            selectedItem={String(selectedLineValue)}
            onSelectItem={item => setSelectedLineValue(Number(item))}
            pillHeight={36}
            pillGap={7}
            containerWidth={width - 2 * 24}
            paddingHorizontal={6}
            paddingVertical={6}
            items={lineSelectorItems}
          />
        )}
        <SingleMarketEvent market={selectedLine.market} outcomeTitles={outcomeTitles} />
      </Box>
    </Box>
  );
});

const MoneylineMarket = memo(function MoneylineMarket({ market }: { market: MoneylineGroup }) {
  return (
    <Box gap={24}>
      <Text size="20pt" weight="heavy" color="label">
        {market.label}
      </Text>
      {market.markets.map(market => {
        return <SingleMarketEvent key={market.id} market={market} outcomeTitles={market.outcomes} />;

        // return (
        //   <MarketRow
        //     key={market.id}
        //     accentColor={market.color}
        //     priceChange={market.oneDayPriceChange}
        //     // image={uniqueMarketImages ? market.icon : undefined}
        //     title={market.groupItemTitle}
        //     volume={market.volume}
        //     tokenId={market.clobTokenIds[0]}
        //     price={String(market.lastTradePrice)}
        //   />
        // );
      })}
    </Box>
  );
});
