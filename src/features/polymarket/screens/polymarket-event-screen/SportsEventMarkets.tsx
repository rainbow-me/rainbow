import { Fragment, memo, useMemo, useState, type ReactElement, type ReactNode } from 'react';

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
} from '@/features/polymarket/screens/polymarket-event-screen/utils/getMarketsGroupedByBetType';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { getOutcomeColor } from '@/features/polymarket/utils/getMarketColor';
import { getOutcomeTeam } from '@/features/polymarket/utils/getOutcomeTeam';
import { BET_TYPE, getBetType, type BetType } from '@/features/polymarket/utils/marketClassification';
import useDimensions from '@/hooks/useDimensions';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';

export const SportsEventMarkets = memo(function SportsEventMarkets({ event }: { event: PolymarketEvent }): ReactElement {
  const { isDarkMode } = useColorMode();
  const { width } = useDimensions();
  const groupedMarkets = useMemo(() => getMarketsGroupedByBetType(event), [event]);
  const availableBetTypes = useMemo(() => {
    const types: BetType[] = [];
    if (groupedMarkets.moneyline.length) types.push(BET_TYPE.MONEYLINE);
    if (groupedMarkets.spreads.length) types.push(BET_TYPE.SPREADS);
    if (groupedMarkets.totals.length) types.push(BET_TYPE.TOTALS);
    if (groupedMarkets.other.length) types.push(BET_TYPE.OTHER);
    return types;
  }, [groupedMarkets]);

  const [selectedBetType, setSelectedBetType] = useState<BetType>(availableBetTypes[0] ?? BET_TYPE.MONEYLINE);
  const betType = availableBetTypes.includes(selectedBetType) ? selectedBetType : availableBetTypes[0];
  const groups = betType ? groupedMarkets[betType] : [];
  const selectorWidth = width - 48;

  return (
    <Box gap={24}>
      {availableBetTypes.length > 1 ? (
        <BetTypeSelector
          availableBetTypes={availableBetTypes}
          backgroundColor={isDarkMode ? PERPS_BACKGROUND_DARK : PERPS_BACKGROUND_LIGHT}
          color={isDarkMode ? globalColors.white100 : globalColors.grey100}
          containerWidth={selectorWidth}
          onSelectBetType={setSelectedBetType}
          selectedBetType={betType}
        />
      ) : null}
      {groups.map((group, index) => (
        <Fragment key={group.id}>
          {'lines' in group ? (
            <LineBasedMarkets group={group} event={event} isDarkMode={isDarkMode} width={selectorWidth} />
          ) : (
            <MoneylineMarkets group={group} event={event} isDarkMode={isDarkMode} />
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
  width,
  event,
}: {
  group: LineBasedGroup;
  isDarkMode: boolean;
  width: number;
  event: PolymarketEvent;
}): ReactElement | null {
  const [selectedLineValue, setSelectedLineValue] = useState<number>(Math.abs(group.mainLine));

  const selectedLine = group.lines.find(line => Math.abs(line.value) === selectedLineValue);

  const backgroundColor = isDarkMode ? PERPS_BACKGROUND_DARK : PERPS_BACKGROUND_LIGHT;

  const lineSelectorItems = useMemo(
    () =>
      group.lines.map(line => {
        const value = String(Math.abs(line.value));
        return { value, label: value };
      }),
    [group.lines]
  );

  if (!selectedLine) return null;

  const { market, value } = selectedLine;
  const line = Math.abs(value);
  const isSpread = getBetType(group.sportsMarketType) === BET_TYPE.SPREADS;
  const outcomeTitles = [`${market.outcomes[0]} ${isSpread ? '-' : ''}${line}`, `${market.outcomes[1]} ${isSpread ? '+' : ''}${line}`];

  return (
    <MarketGroup group={group}>
      <Box gap={16}>
        {group.lines.length > 1 ? (
          <ItemSelector
            accentColor={isDarkMode ? globalColors.white100 : globalColors.grey100}
            backgroundColor={backgroundColor}
            selectedValue={String(selectedLineValue)}
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
        <SingleMarketEventOutcomes market={market} outcomeTitles={outcomeTitles} teams={event.teams} event={event} />
      </Box>
    </MarketGroup>
  );
});

const MoneylineMarkets = memo(function MoneylineMarkets({
  group,
  event,
  isDarkMode,
}: {
  group: MoneylineGroup;
  event: PolymarketEvent;
  isDarkMode: boolean;
}): ReactElement {
  return (
    <MarketGroup group={group}>
      {group.isThreeWay ? (
        <Box gap={8}>
          {group.markets.map((market, index) => {
            const team = getOutcomeTeam({ outcome: market.groupItemTitle, outcomeIndex: index, teams: event.teams });
            const outcomeColor = getOutcomeColor({
              market,
              outcome: market.groupItemTitle,
              outcomeIndex: index,
              isDarkMode,
              teams: event.teams,
            });
            const image = index !== 1 ? team?.logo : undefined;

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
          <SingleMarketEventOutcomes key={market.id} market={market} outcomeTitles={market.outcomes} teams={event.teams} event={event} />
        ))
      )}
    </MarketGroup>
  );
});

function MarketGroup({ group, children }: { group: MoneylineGroup | LineBasedGroup; children: ReactNode }): ReactElement {
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
