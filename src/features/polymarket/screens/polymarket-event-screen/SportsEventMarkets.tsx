import { Box, globalColors, Separator, Text, TextIcon, useColorMode } from '@/design-system';
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
import { MarketRow } from '@/features/polymarket/screens/polymarket-event-screen/MarketRow';
import { PolymarketTeamInfo } from '@/features/polymarket/types';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { getOutcomeTeam } from '@/features/polymarket/utils/getOutcomeTeam';
import { getOutcomeColor } from '@/features/polymarket/utils/getMarketColor';

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
    <Box gap={24}>
      {availableBetTypes.length > 1 && (
        <BetTypeSelector
          availableBetTypes={availableBetTypes}
          backgroundColor={backgroundColor}
          color={isDarkMode ? '#FFFFFF' : '#000000'}
          containerWidth={width - 2 * 24}
          onSelectBetType={setSelectedBetType}
          selectedBetType={selectedBetType}
        />
      )}
      <Markets markets={groupedMarkets} selectedBetType={selectedBetType} teams={event.teams} event={event} />
    </Box>
  );
});

const Markets = memo(function Markets({
  markets,
  selectedBetType,
  teams,
  event,
}: {
  markets: GroupedSportsMarkets;
  selectedBetType: BetType;
  teams?: PolymarketTeamInfo[];
  event: PolymarketEvent;
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
      {selectedMarketsGroup.map((marketsGroup, index) => {
        return (
          <React.Fragment key={marketsGroup.id}>
            {'lines' in marketsGroup && (
              <LineBasedMarkets key={marketsGroup.sportsMarketType} marketsGroup={marketsGroup} teams={teams} event={event} />
            )}
            {!('lines' in marketsGroup) && <MoneylineMarkets marketsGroup={marketsGroup} teams={teams} event={event} />}
            {index < selectedMarketsGroup.length - 1 && <Separator color="separatorSecondary" thickness={1} />}
          </React.Fragment>
        );
      })}
    </Box>
  );
});

const LineBasedMarkets = memo(function LineBasedMarket({
  marketsGroup,
  teams,
  event,
}: {
  marketsGroup: LineBasedGroup;
  teams?: PolymarketTeamInfo[];
  event: PolymarketEvent;
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
      // The first outcome is always the negative line
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
            accentColor={isDarkMode ? globalColors.white100 : globalColors.grey100}
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
        <SingleMarketEventOutcomes market={selectedLine.market} outcomeTitles={outcomeTitles} teams={teams} event={event} />
      </Box>
    </Box>
  );
});

const MoneylineMarkets = memo(function MoneylineMarket({
  marketsGroup,
  teams,
  event,
}: {
  marketsGroup: MoneylineGroup;
  teams?: PolymarketTeamInfo[];
  event: PolymarketEvent;
}) {
  if (marketsGroup.isThreeWay) {
    return <ThreeWayMoneylineMarkets marketsGroup={marketsGroup} teams={teams} event={event} />;
  }

  return <StandardMoneylineMarkets marketsGroup={marketsGroup} teams={teams} event={event} />;
});

const ThreeWayMoneylineMarkets = memo(function ThreeWayMoneylineMarkets({
  marketsGroup,
  teams,
  event,
}: {
  marketsGroup: MoneylineGroup;
  teams?: PolymarketTeamInfo[];
  event: PolymarketEvent;
}) {
  const { isDarkMode } = useColorMode();
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
      <Box gap={8}>
        {marketsGroup.markets.map((market, index) => {
          const team = getOutcomeTeam({ outcome: market.groupItemTitle, outcomeIndex: index, teams });
          const outcomeColor = getOutcomeColor({ market, outcome: market.groupItemTitle, outcomeIndex: index, isDarkMode, teams });
          // The second outcome is the draw outcome, which we currently don't have an image for
          const image = index !== 1 ? team?.logo : undefined;

          return (
            <MarketRow
              key={market.id}
              accentColor={outcomeColor}
              image={image}
              priceChange={0}
              title={market.groupItemTitle}
              tokenId={market.clobTokenIds[0]}
              price={market.outcomePrices[0]}
              minTickSize={market.orderPriceMinTickSize}
              onPress={() => {
                Navigation.handleAction(Routes.POLYMARKET_MARKET_SHEET, { market, event });
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
});

const StandardMoneylineMarkets = memo(function StandardMoneylineMarkets({
  marketsGroup,
  teams,
  event,
}: {
  marketsGroup: MoneylineGroup;
  teams?: PolymarketTeamInfo[];
  event: PolymarketEvent;
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
        return <SingleMarketEventOutcomes key={market.id} market={market} outcomeTitles={market.outcomes} teams={teams} event={event} />;
      })}
    </Box>
  );
});
