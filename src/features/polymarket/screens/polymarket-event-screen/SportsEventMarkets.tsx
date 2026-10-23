import { Fragment, memo, useMemo, useState, type ReactNode } from 'react';

import { Box, globalColors, Separator, Text, TextIcon, useColorMode } from '@/design-system';
import { PERPS_BACKGROUND_DARK, PERPS_BACKGROUND_LIGHT } from '@/features/perps/constants';
import { BetTypeSelector } from '@/features/polymarket/screens/polymarket-event-screen/BetTypeSelector';
import { SingleMarketEventOutcomes } from '@/features/polymarket/screens/polymarket-event-screen/components/SingleMarketEvent';
import { ItemSelector } from '@/features/polymarket/screens/polymarket-event-screen/ItemSelector';
import { MarketRow } from '@/features/polymarket/screens/polymarket-event-screen/MarketRow';
import {
  getMarketsGroupedByBetType,
  type LineBasedGroup,
  type MoneylineGroup,
  type SingleMarketGroup,
} from '@/features/polymarket/screens/polymarket-event-screen/utils/getMarketsGroupedByBetType';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { getOutcomeColor } from '@/features/polymarket/utils/getMarketColor';
import { getOutcomeTeam } from '@/features/polymarket/utils/getOutcomeTeam';
import { getSportsTeamImage } from '@/features/polymarket/utils/getSportsTeamImage';
import { BET_TYPE, type BetType } from '@/features/polymarket/utils/marketClassification';
import { type Participant } from '@/features/sports/core/generated/sports';
import { getGameId, useSportsStore } from '@/features/sports/data/sportsStore';
import useDimensions from '@/hooks/useDimensions';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';

/**
 * Displays a Sports event's markets with bet type and line selection.
 */
export const SportsEventMarkets = memo(function SportsEventMarkets({ event }: { event: PolymarketEvent }) {
  const { isDarkMode } = useColorMode();
  const { width } = useDimensions();
  const participants = useSportsStore(s => {
    const gameId = getGameId(s, event.id);
    return gameId ? s.games[gameId]?.participants : undefined;
  });

  const groupedMarkets = useMemo(() => getMarketsGroupedByBetType(event.markets, event), [event]);
  const [selectedBetType, setSelectedBetType] = useState<BetType>(groupedMarkets.betTypes[0] ?? BET_TYPE.MONEYLINE);

  const betType = groupedMarkets[selectedBetType].length ? selectedBetType : groupedMarkets.betTypes[0];
  const groups = betType ? groupedMarkets[betType] : [];
  const selectorWidth = width - 48;

  return (
    <Box gap={24}>
      {groupedMarkets.betTypes.length > 1 ? (
        <BetTypeSelector
          availableBetTypes={groupedMarkets.betTypes}
          backgroundColor={isDarkMode ? PERPS_BACKGROUND_DARK : PERPS_BACKGROUND_LIGHT}
          color={isDarkMode ? globalColors.white100 : globalColors.grey100}
          containerWidth={selectorWidth}
          onSelectBetType={setSelectedBetType}
          selectedBetType={betType}
        />
      ) : null}

      {groups.map((group, index) => (
        <Fragment key={group.id}>
          {'market' in group ? (
            <MarketGroup group={group}>
              <SingleMarketEventOutcomes market={group.market} teams={event.teams} participants={participants} event={event} />
            </MarketGroup>
          ) : 'mainLine' in group ? (
            <LineBasedMarkets
              group={group}
              event={event}
              participants={participants}
              isDarkMode={isDarkMode}
              isSpread={betType === BET_TYPE.SPREADS}
              width={selectorWidth}
            />
          ) : (
            <MoneylineMarkets group={group} event={event} participants={participants} isDarkMode={isDarkMode} />
          )}

          {index < groups.length - 1 ? <Separator color="separatorSecondary" thickness={1} /> : null}
        </Fragment>
      ))}
    </Box>
  );
});

const LineBasedMarkets = memo(function LineBasedMarkets({
  group,
  isDarkMode,
  isSpread,
  width,
  event,
  participants,
}: {
  group: LineBasedGroup;
  isDarkMode: boolean;
  isSpread: boolean;
  width: number;
  event: PolymarketEvent;
  participants?: Participant[];
}) {
  const [selectedLineValue, setSelectedLineValue] = useState<number>(Math.abs(group.mainLine));

  const selectedMarket = useMemo(
    () =>
      group.markets.find(market => Math.abs(market.line) === selectedLineValue) ??
      group.markets.find(market => Math.abs(market.line) === Math.abs(group.mainLine)) ??
      group.markets[0],
    [group.markets, group.mainLine, selectedLineValue]
  );

  const lineSelectorItems = useMemo(() => {
    if (group.markets.length < 2) return undefined;
    return group.markets.map(market => {
      const value = String(Math.abs(market.line));
      return { value, label: value };
    });
  }, [group.markets]);

  if (!selectedMarket) return null;

  const line = Math.abs(selectedMarket.line);
  const outcomeTitles = [
    `${selectedMarket.outcomes[0]} ${isSpread ? '-' : ''}${line}`,
    `${selectedMarket.outcomes[1]} ${isSpread ? '+' : ''}${line}`,
  ];

  return (
    <MarketGroup group={group}>
      <Box gap={16}>
        {lineSelectorItems ? (
          <ItemSelector
            accentColor={isDarkMode ? globalColors.white100 : globalColors.grey100}
            backgroundColor={isDarkMode ? PERPS_BACKGROUND_DARK : PERPS_BACKGROUND_LIGHT}
            selectedValue={String(line)}
            onSelect={value => setSelectedLineValue(Number(value))}
            pillHeight={36}
            pillGap={7}
            separatorWidth={1}
            containerWidth={width}
            paddingHorizontal={6}
            paddingVertical={6}
            items={lineSelectorItems}
          />
        ) : null}

        <SingleMarketEventOutcomes
          market={selectedMarket}
          outcomeTitles={outcomeTitles}
          teams={event.teams}
          participants={participants}
          event={event}
        />
      </Box>
    </MarketGroup>
  );
});

const MoneylineMarkets = memo(function MoneylineMarkets({
  group,
  event,
  participants,
  isDarkMode,
}: {
  group: MoneylineGroup;
  event: PolymarketEvent;
  participants?: Participant[];
  isDarkMode: boolean;
}) {
  return (
    <MarketGroup group={group}>
      {group.isThreeWay ? (
        <Box gap={8}>
          {group.markets.map((market, index) => {
            const team = getOutcomeTeam({ outcome: market.groupItemTitle, outcomeIndex: index, teams: event.teams });
            const image = index !== 1 ? getSportsTeamImage(team, participants) : undefined;
            const outcomeColor = getOutcomeColor({
              market,
              outcome: market.groupItemTitle,
              outcomeIndex: index,
              isDarkMode,
              teams: event.teams,
            });

            return (
              <MarketRow
                key={market.id}
                accentColor={outcomeColor}
                icon={image}
                priceChange={0}
                title={market.groupItemTitle}
                umaResolutionStatus={market.umaResolutionStatus}
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
      ) : (
        group.markets.map(market => (
          <SingleMarketEventOutcomes key={market.id} market={market} teams={event.teams} participants={participants} event={event} />
        ))
      )}
    </MarketGroup>
  );
});

function MarketGroup({ group, children }: { group: MoneylineGroup | LineBasedGroup | SingleMarketGroup; children: ReactNode }) {
  return (
    <Box gap={24}>
      <Box flexDirection="row" alignItems="center" gap={10}>
        {group.icon ? (
          <TextIcon color="labelQuaternary" size="icon 17px" weight="heavy">
            {group.icon}
          </TextIcon>
        ) : null}
        <Text size="20pt" weight="heavy" color="label">
          {group.label}
        </Text>
      </Box>
      {children}
    </Box>
  );
}
