import { Box, Separator, Text, TextIcon, useColorMode } from '@/design-system';
import { BetTypeSelector } from '@/features/polymarket/screens/polymarket-event-screen/BetTypeSelector';
import { usePolymarketEventStore } from '@/features/polymarket/stores/polymarketEventStore';
import { PERPS_BACKGROUND_DARK, PERPS_BACKGROUND_LIGHT } from '@/features/perps/constants';
import React, { memo, useMemo, useState } from 'react';
import {
  BET_TYPE,
  BetType,
  getMarketsGroupedByBetType,
  GroupedSportsMarkets,
  LineBasedGroup,
  MoneylineGroup,
} from '@/features/polymarket/screens/polymarket-event-screen/utils/getMarketsGroupedByBetType';
import { useDimensions } from '@/hooks';
import { POLYMARKET_SPORTS_MARKET_TYPE } from '@/features/polymarket/constants';
import { SingleMarketEvent } from '@/features/polymarket/screens/polymarket-event-screen/components/SingleMarketEvent';
import { ItemSelector } from '@/features/polymarket/screens/polymarket-event-screen/ItemSelector';

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
  const selectedMarketsGroup = useMemo(() => {
    switch (selectedBetType) {
      case BET_TYPE.MONEYLINE:
        return markets.moneyline;
      case BET_TYPE.SPREADS:
        return markets.spreads;
      case BET_TYPE.TOTALS:
        return markets.totals;
      case BET_TYPE.OTHER:
        return markets.other;
    }
  }, [selectedBetType, markets]);

  return (
    <Box gap={24}>
      {selectedMarketsGroup.map(marketsGroup => {
        return (
          <React.Fragment key={marketsGroup.sportsMarketType}>
            <Separator color="separatorSecondary" thickness={1} />
            {'lines' in marketsGroup && <LineBasedMarkets key={marketsGroup.sportsMarketType} marketsGroup={marketsGroup} />}
            {!('lines' in marketsGroup) && <MoneylineMarkets key={marketsGroup.sportsMarketType} marketsGroup={marketsGroup} />}
          </React.Fragment>
        );
      })}
    </Box>
  );
});

const LineBasedMarkets = memo(function LineBasedMarket({ marketsGroup }: { marketsGroup: LineBasedGroup }) {
  const { isDarkMode } = useColorMode();
  const { width } = useDimensions();
  const [selectedLineValue, setSelectedLineValue] = useState<number>(Math.abs(marketsGroup.mainLine));

  const selectedLine = useMemo(() => {
    return marketsGroup.lines.find(line => Math.abs(line.value) === selectedLineValue);
  }, [marketsGroup, selectedLineValue]);

  const backgroundColor = isDarkMode ? PERPS_BACKGROUND_DARK : PERPS_BACKGROUND_LIGHT;

  const lineSelectorItems = useMemo(() => {
    return marketsGroup.lines.map(line => ({
      value: String(Math.abs(line.value)),
      label: String(Math.abs(line.value)),
    }));
  }, [marketsGroup]);

  const outcomeTitles = useMemo(() => {
    if (!selectedLine) return ['', ''];

    const absoluteLineValue = Math.abs(selectedLine.value);

    if (
      marketsGroup.sportsMarketType === POLYMARKET_SPORTS_MARKET_TYPE.SPREADS ||
      marketsGroup.sportsMarketType === POLYMARKET_SPORTS_MARKET_TYPE.FIRST_HALF_SPREADS
    ) {
      // TODO: Should check the assumption that the first outcome is always the negative line
      return [`${selectedLine.market.outcomes[0]} -${absoluteLineValue}`, `${selectedLine.market.outcomes[1]} +${absoluteLineValue}`];
    }
    return [`${selectedLine.market.outcomes[0]} ${absoluteLineValue}`, `${selectedLine.market.outcomes[1]} ${absoluteLineValue}`];
  }, [selectedLine, marketsGroup.sportsMarketType]);

  if (!selectedLine) {
    return null;
  }

  return (
    <Box gap={24}>
      <Box flexDirection="row" alignItems="center" gap={10}>
        {marketsGroup.icon && (
          <TextIcon color="labelQuaternary" size="icon 17px" weight="heavy">
            {marketsGroup.icon}
          </TextIcon>
        )}
        <Text size="20pt" weight="heavy" color="label">
          {marketsGroup.label}
        </Text>
      </Box>
      <Box gap={16}>
        {marketsGroup.lines.length > 1 && (
          <ItemSelector
            accentColor={'#FFFFFF'}
            backgroundColor={backgroundColor}
            selectedValue={String(selectedLineValue)}
            onSelect={value => setSelectedLineValue(Number(value))}
            pillHeight={36}
            pillGap={7}
            separatorWidth={1}
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

const MoneylineMarkets = memo(function MoneylineMarket({ marketsGroup }: { marketsGroup: MoneylineGroup }) {
  return (
    <Box gap={24}>
      <Box flexDirection="row" alignItems="center" gap={10}>
        {marketsGroup.icon && (
          <TextIcon color="labelQuaternary" size="icon 17px" weight="heavy">
            {marketsGroup.icon}
          </TextIcon>
        )}
        <Text size="20pt" weight="heavy" color="label">
          {marketsGroup.label}
        </Text>
      </Box>
      {marketsGroup.markets.map(market => {
        return <SingleMarketEvent key={market.id} market={market} outcomeTitles={market.outcomes} />;
      })}
    </Box>
  );
});
