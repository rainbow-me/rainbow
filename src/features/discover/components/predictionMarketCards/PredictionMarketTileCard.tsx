import { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import ImgixImage from '@/components/images/ImgixImage';
import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { Text, useColorMode } from '@/design-system';
import { type PolymarketEvent, type PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { getOutcomeColor } from '@/features/polymarket/utils/getMarketColor';
import { roundWorklet, toPercentageWorklet } from '@/framework/core/safeMath';
import { opacity } from '@/framework/ui/utils/opacity';
import { formatNumber } from '@/helpers/strings';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { createOpacityPalette } from '@/worklets/colors';

export const PREDICTION_MARKET_TILE_CARD_WIDTH = Math.min(280, DEVICE_WIDTH - 40);
export const PREDICTION_MARKET_TILE_CARD_HEIGHT = 300;
export const PREDICTION_MARKET_TILE_CARD_BORDER_RADIUS = 28;

const OUTCOME_ROW_COUNT = 2;
const LAST_TRADE_PRICE_THRESHOLDS = [0.05, 0.01];

type PredictionMarketTileCardProps = {
  event: PolymarketEvent;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  width?: number;
};

type OutcomeRowData = {
  market: PolymarketMarket;
  outcomeIndex: number;
  title: string;
  initialPrice: string | number;
  tokenId: string;
};

export const PredictionMarketTileCard = memo(function PredictionMarketTileCard({
  event,
  onPress,
  style,
  width = PREDICTION_MARKET_TILE_CARD_WIDTH,
}: PredictionMarketTileCardProps) {
  const { isDarkMode } = useColorMode();
  const eventColor = getColorValueForThemeWorklet(event.color, isDarkMode);
  const rows = useMemo(() => getOutcomeRows(event), [event]);
  const iconSource = useMemo(() => ({ uri: event.icon ?? event.image }), [event.icon, event.image]);
  const volumeText = useMemo(() => formatNumber(String(event.volume), { useOrderSuffix: true, decimals: 1, style: '$' }), [event.volume]);
  const priceChange = rows[0]?.market.oneDayPriceChange;
  const priceChangeText = useMemo(() => formatPriceChange(priceChange), [priceChange]);
  const priceChangeIsPositive = priceChange !== undefined && priceChange > 0;
  const colorPalette = useMemo(() => createOpacityPalette(eventColor, [0, 8, 14, 20, 28, 48]), [eventColor]);
  const mutedWhite = opacity('#FFFFFF', 0.82);

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
      return;
    }
    Navigation.handleAction(Routes.POLYMARKET_EVENT_SCREEN, { event, eventId: event.id });
  }, [event, onPress]);

  return (
    <View style={[{ height: PREDICTION_MARKET_TILE_CARD_HEIGHT, width }, style]}>
      <ButtonPressAnimation onPress={handlePress} scaleTo={0.96} style={styles.flex} wrapperStyle={styles.flex}>
        <View style={[styles.card, { backgroundColor: eventColor }]}>
          <LinearGradient
            colors={[colorPalette.opacity0, colorPalette.opacity28, colorPalette.opacity0]}
            pointerEvents="none"
            start={{ x: 0, y: 0.02 }}
            end={{ x: 0.98, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={[opacity('#FFFFFF', isDarkMode ? 0.08 : 0.18), opacity('#000000', isDarkMode ? 0.12 : 0.04)]}
            pointerEvents="none"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.content}>
            <ImgixImage enableFasterImage source={iconSource} size={38} style={styles.icon} />
            <View style={styles.headerText}>
              <Text align="left" color={{ custom: '#FFFFFF' }} numberOfLines={3} size="22pt" weight="heavy">
                {event.title}
              </Text>
              <View style={styles.statsRow}>
                <Text align="left" color={{ custom: '#FFFFFF' }} size="17pt" weight="heavy">
                  {`VOL ${volumeText}`}
                </Text>
                {priceChangeText ? (
                  <View style={styles.priceChangeRow}>
                    <Text
                      align="left"
                      color={priceChangeIsPositive ? { custom: '#2BEA69' } : { custom: '#FF4D57' }}
                      size="icon 13px"
                      weight="heavy"
                      style={{ transform: priceChangeIsPositive ? [{ rotate: '180deg' }] : [] }}
                    >
                      {'􀄱'}
                    </Text>
                    <Text
                      align="left"
                      color={priceChangeIsPositive ? { custom: '#2BEA69' } : { custom: '#FF4D57' }}
                      size="17pt"
                      weight="heavy"
                    >
                      {priceChangeText}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
            <View style={styles.outcomes}>
              {rows.map((row, index) => (
                <OutcomeRow
                  event={event}
                  eventColor={eventColor}
                  isDarkMode={isDarkMode}
                  key={`${row.market.id}:${row.outcomeIndex}`}
                  row={row}
                  showSeparator={index < rows.length - 1}
                  textColor={mutedWhite}
                />
              ))}
            </View>
          </View>
        </View>
      </ButtonPressAnimation>
    </View>
  );
});

const OutcomeRow = memo(function OutcomeRow({
  event,
  eventColor,
  isDarkMode,
  row,
  showSeparator,
  textColor,
}: {
  event: PolymarketEvent;
  eventColor: string;
  isDarkMode: boolean;
  row: OutcomeRowData;
  showSeparator: boolean;
  textColor: string;
}) {
  const outcomeColor = getOutcomeColor({
    market: row.market,
    outcome: row.market.outcomes[row.outcomeIndex] ?? row.title,
    outcomeIndex: row.outcomeIndex,
    isDarkMode,
    teams: event.teams,
  });

  const onPress = useCallback(() => {
    Navigation.handleAction(Routes.POLYMARKET_NEW_POSITION_SHEET, {
      market: row.market,
      event,
      outcomeIndex: row.outcomeIndex,
      outcomeColor,
      fromRoute: Routes.POLYMARKET_BROWSE_EVENTS_SCREEN,
    });
  }, [event, outcomeColor, row.market, row.outcomeIndex]);

  return (
    <View>
      <View style={styles.outcomeRow}>
        <ButtonPressAnimation onPress={onPress} scaleTo={0.92}>
          <View style={[styles.oddsPill, { backgroundColor: opacity('#000000', isDarkMode ? 0.22 : 0.18) }]}>
            <LinearGradient
              colors={[opacity('#FFFFFF', 0.14), opacity(eventColor, 0.22)]}
              pointerEvents="none"
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <LiveTokenText
              align="center"
              autoSubscriptionEnabled={false}
              color={{ custom: '#FFFFFF' }}
              initialValue={formatOdds(row.initialPrice)}
              numberOfLines={1}
              selector={token => formatOdds(token.price)}
              size="22pt"
              tokenId={row.tokenId}
              weight="heavy"
            />
          </View>
        </ButtonPressAnimation>
        <Text align="left" color={{ custom: textColor }} numberOfLines={1} size="22pt" style={styles.outcomeTitle} weight="heavy">
          {row.title}
        </Text>
      </View>
      {showSeparator ? <View style={styles.outcomeSeparator} /> : null}
    </View>
  );
});

function getOutcomeRows(event: PolymarketEvent): OutcomeRowData[] {
  const activeMarkets = event.markets.filter(market => market.active && !market.closed);
  const firstMarket = activeMarkets[0];
  if (!firstMarket) return [];

  if (activeMarkets.length === 1) {
    return firstMarket.outcomes.slice(0, OUTCOME_ROW_COUNT).map((outcome, outcomeIndex) =>
      buildOutcomeRow({
        market: firstMarket,
        outcomeIndex,
        title: outcome,
      })
    );
  }

  const marketsAboveThreshold = LAST_TRADE_PRICE_THRESHOLDS.map(threshold =>
    activeMarkets.filter(market => calculateOddsPrice(market) >= threshold)
  ).find(markets => markets.length >= OUTCOME_ROW_COUNT);
  const visibleMarkets = (marketsAboveThreshold ?? activeMarkets).slice(0, OUTCOME_ROW_COUNT);

  return visibleMarkets.map(market =>
    buildOutcomeRow({
      market,
      outcomeIndex: 0,
      title: formatOutcomeTitle(market.groupItemTitle || market.outcomes[0] || market.question),
    })
  );
}

function buildOutcomeRow({
  market,
  outcomeIndex,
  title,
}: {
  market: PolymarketMarket;
  outcomeIndex: number;
  title: string;
}): OutcomeRowData {
  const tokenId = market.clobTokenIds[outcomeIndex];
  return {
    market,
    outcomeIndex,
    title,
    initialPrice: market.outcomePrices[outcomeIndex] ?? calculateOddsPrice(market),
    tokenId: getPolymarketTokenId(tokenId, 'sell'),
  };
}

function calculateOddsPrice(market: PolymarketMarket): number {
  let price = market.lastTradePrice;
  if (price === undefined) {
    if (market.bestAsk !== undefined && market.bestBid !== undefined) {
      price = (market.bestAsk + market.bestBid) / 2;
    } else {
      price = Number(market.outcomePrices[0] ?? 0);
    }
  }
  return price;
}

function formatOutcomeTitle(title: string): string {
  return title.replace(/^([↑↓])\s*(?!\$)/, '$1 $$');
}

function formatOdds(value: string | number): string {
  return `${roundWorklet(toPercentageWorklet(value))}%`;
}

function formatPriceChange(priceChange: number | undefined): string {
  if (priceChange === undefined || Math.abs(priceChange) < 0.01) return '';
  const roundedPriceChange = Math.round(priceChange * 100) / 100;
  return `${toPercentageWorklet(Math.abs(roundedPriceChange))}%`;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: PREDICTION_MARKET_TILE_CARD_BORDER_RADIUS,
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 18,
    paddingHorizontal: 22,
    paddingTop: 28,
  },
  flex: {
    flex: 1,
  },
  headerText: {
    gap: 8,
  },
  icon: {
    borderRadius: 10,
    height: 38,
    marginBottom: 24,
    width: 38,
  },
  oddsPill: {
    alignItems: 'center',
    borderRadius: 18,
    height: 48,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 12,
    width: 78,
  },
  outcomeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    minHeight: 56,
  },
  outcomeSeparator: {
    alignSelf: 'flex-end',
    backgroundColor: opacity('#000000', 0.22),
    height: 1,
    marginVertical: 8,
    width: 158,
  },
  outcomeTitle: {
    flex: 1,
  },
  outcomes: {
    gap: 0,
  },
  priceChangeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  statsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
});
