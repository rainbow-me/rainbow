import { Box, Separator, Text, TextIcon, useColorMode } from '@/design-system';
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
import { SingleMarketEventOutcomes } from '@/features/polymarket/screens/polymarket-event-screen/components/SingleMarketEvent';
import { ItemSelector } from '@/features/polymarket/screens/polymarket-event-screen/ItemSelector';
import { BetTypeSelector } from '@/features/polymarket/screens/polymarket-event-screen/BetTypeSelector';
import { PolymarketTeamInfo } from '@/features/polymarket/types';

export const SportsEventMarkets = memo(function SportsEventMarkets() {
  const { isDarkMode } = useColorMode();
  const { width, height } = useDimensions();
  const event = usePolymarketEventStore(state => state.getData());
  const groupedMarkets = event ? getMarketsGroupedByBetType(event) : null;

  const availableBetTypes = useMemo(() => {
    if (!groupedMarkets) return [];
    const types: BetType[] = [];
    if (groupedMarkets.moneyline.length > 0) types.push(BET_TYPE.MONEYLINE);
    if (groupedMarkets.spreads.length > 0) types.push(BET_TYPE.SPREADS);
    if (groupedMarkets.totals.length > 0) types.push(BET_TYPE.TOTALS);
    if (groupedMarkets.other.length > 0) types.push(BET_TYPE.OTHER);
    return types;
  }, [groupedMarkets]);

  const [selectedBetType, setSelectedBetType] = useState<BetType>(availableBetTypes[0] ?? BET_TYPE.MONEYLINE);

  const backgroundColor = isDarkMode ? PERPS_BACKGROUND_DARK : PERPS_BACKGROUND_LIGHT;

  // TODO: Add a loading state
  // This is a hack to ensure the screen is scrollable once the data is loaded
  if (!event || !groupedMarkets) return <Box height={height} />;

  return (
    <Box gap={16}>
      {availableBetTypes.length > 1 && (
        <BetTypeSelector
          availableBetTypes={availableBetTypes}
          backgroundColor={backgroundColor}
          color={'#FFFFFF'}
          containerWidth={width - 2 * 24}
          onSelectBetType={setSelectedBetType}
          selectedBetType={selectedBetType}
        />
      )}
      <Markets markets={groupedMarkets} selectedBetType={selectedBetType} teams={event.teams} />
    </Box>
  );
});

const Markets = memo(function Markets({
  markets,
  selectedBetType,
  teams,
}: {
  markets: GroupedSportsMarkets;
  selectedBetType: BetType;
  teams?: PolymarketTeamInfo[];
}) {
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
      default:
        return [];
    }
  }, [selectedBetType, markets]);

  return (
    <Box gap={24}>
      {selectedMarketsGroup.map(marketsGroup => {
        return (
          <React.Fragment key={marketsGroup.id}>
            <Separator color="separatorSecondary" thickness={1} />
            {'lines' in marketsGroup && <LineBasedMarkets key={marketsGroup.sportsMarketType} marketsGroup={marketsGroup} teams={teams} />}
            {!('lines' in marketsGroup) && <MoneylineMarkets marketsGroup={marketsGroup} teams={teams} />}
          </React.Fragment>
        );
      })}
    </Box>
  );
});

const LineBasedMarkets = memo(function LineBasedMarket({
  marketsGroup,
  teams,
}: {
  marketsGroup: LineBasedGroup;
  teams?: PolymarketTeamInfo[];
}) {
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
        <SingleMarketEventOutcomes market={selectedLine.market} outcomeTitles={outcomeTitles} teams={teams} />
      </Box>
    </Box>
  );
});

const MoneylineMarkets = memo(function MoneylineMarket({
  marketsGroup,
  teams,
}: {
  marketsGroup: MoneylineGroup;
  teams?: PolymarketTeamInfo[];
}) {
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
        return <SingleMarketEventOutcomes key={market.id} market={market} outcomeTitles={market.outcomes} teams={teams} />;
      })}
    </Box>
  );
});
