import { memo, useCallback, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import ImgixImage from '@/components/images/ImgixImage';
import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { globalColors, Text, useColorMode } from '@/design-system';
import { DOWN_ARROW, UP_ARROW } from '@/features/perps/constants';
import { type PolymarketEvent, type PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { getOutcomeColor } from '@/features/polymarket/utils/getMarketColor';
import { formatOdds } from '@/features/polymarket/utils/sportsEventBetData';
import { toPercentageWorklet } from '@/framework/core/safeMath';
import { getPriceChangeColor, usePriceChangeColors } from '@/framework/ui/price/usePriceChangeColors';
import { opacity } from '@/framework/ui/utils/opacity';
import { formatNumber } from '@/helpers/strings';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { createOpacityPalette } from '@/worklets/colors';

export const PREDICTION_MARKET_TILE_CARD_WIDTH = Math.min(300, DEVICE_WIDTH - 40);
export const PREDICTION_MARKET_TILE_CARD_HEIGHT = Math.round(PREDICTION_MARKET_TILE_CARD_WIDTH * (16 / 15));
export const PREDICTION_MARKET_TILE_CARD_BORDER_RADIUS = 24;

const OUTCOME_ROW_COUNT = 2;
const LAST_TRADE_PRICE_THRESHOLDS = [0.05, 0.01];
const CARD_FILL_GRADIENT_CONFIG = {
  end: { x: 1, y: 1 },
  locations: [0.17824, 0.58889] as const,
  start: { x: 0, y: 0 },
};
const CARD_FILL_LIGHT_GRADIENT_CONFIG = {
  end: { x: 1, y: 0.72 },
  start: { x: 0, y: 0 },
};
const CARD_BORDER_GRADIENT_CONFIG = {
  end: { x: 1, y: 1 },
  locations: [0, 0.94] as const,
  start: { x: 0, y: 0 },
};
const OUTCOME_ROW_GRADIENT_CONFIG = {
  end: { x: 0.89062, y: 0.5 },
  locations: [0, 1] as const,
  start: { x: 0, y: 0.5 },
};
const OUTCOME_ROW_WIDTH = PREDICTION_MARKET_TILE_CARD_WIDTH - 24;
const ODDS_PILL_BORDER_RADIUS = 15;
const ASSET_ACCENT_COLORS = [
  { color: '#F8931A', pattern: /\b(bitcoin|btc)\b/i },
  { color: '#9CA4AD', pattern: /\b(ethereum|eth)\b/i },
  { color: '#C0C1CC', pattern: /\b(silver|xagusd|xag)\b/i },
  { color: '#D6A438', pattern: /\b(gold|xauusd|xau)\b/i },
  { color: '#7A70FF', pattern: /\b(solana|sol)\b/i },
] as const;

// ============ Android Odds-Pill Overlay Geometry ============================= //

const ODDS_PILL_WIDTH = 62;
const ODDS_PILL_HEIGHT = 42;
const BORDER_WIDTH = 2;
const CONTENT_PADDING_BOTTOM = 12;
const OUTCOME_ROW_HEIGHT = 58;
const OUTCOME_ROW_GAP = 4;
const OUTCOME_ROW_CONTENT_LEFT_PADDING = 8;
const OUTCOME_ROW_PITCH = OUTCOME_ROW_HEIGHT + OUTCOME_ROW_GAP;
const ODDS_PILL_OVERLAY_LEFT =
  (PREDICTION_MARKET_TILE_CARD_WIDTH - OUTCOME_ROW_WIDTH) / 2 + BORDER_WIDTH + OUTCOME_ROW_CONTENT_LEFT_PADDING;
const ODDS_PILL_OVERLAY_BOTTOM = 2 * BORDER_WIDTH + CONTENT_PADDING_BOTTOM + (OUTCOME_ROW_HEIGHT - 2 * BORDER_WIDTH - ODDS_PILL_HEIGHT) / 2;

type PredictionMarketTileCardProps = {
  event: PolymarketEvent;
};

type OutcomeRowData = {
  market: PolymarketMarket;
  outcomeIndex: number;
  title: string;
  initialPrice: string | number;
  tokenId: string;
};

export const PredictionMarketTileCard = memo(function PredictionMarketTileCard({ event }: PredictionMarketTileCardProps) {
  const { isDarkMode } = useColorMode();
  const eventColor = useMemo(() => getTileAccentColor(event, isDarkMode), [event, isDarkMode]);
  const rows = useMemo(() => getOutcomeRows(event), [event]);
  const iconSource = useMemo(() => ({ uri: event.icon ?? event.image }), [event.icon, event.image]);
  const volumeText = useMemo(() => formatNumber(String(event.volume), { useOrderSuffix: true, decimals: 1, style: '$' }), [event.volume]);
  const priceChange = rows[0]?.market.oneDayPriceChange;
  const priceChangeText = useMemo(() => formatPriceChange(priceChange), [priceChange]);
  const priceChangeIsPositive = priceChange !== undefined && priceChange > 0;
  const priceChangeColors = usePriceChangeColors();
  const priceChangeColor =
    priceChange === undefined ? priceChangeColors.neutral : getPriceChangeColor(String(priceChange), priceChangeColors);
  const colorPalette = useMemo(() => createOpacityPalette(eventColor, [0, 8, 10, 16, 24]), [eventColor]);
  const cardBorderGradientColors = useMemo(
    () =>
      isDarkMode
        ? ([opacity(eventColor, 0.08), opacity(eventColor, 0)] as const)
        : ([opacity(globalColors.white100, 0.8), opacity(globalColors.white100, 0.8)] as const),
    [eventColor, isDarkMode]
  );
  const cardGradientColors = useMemo(
    () =>
      isDarkMode
        ? ([colorPalette.opacity24, colorPalette.opacity0] as const)
        : ([opacity(eventColor, 0.06), opacity(eventColor, 0)] as const),
    [colorPalette.opacity0, colorPalette.opacity24, eventColor, isDarkMode]
  );

  const handlePress = useCallback(() => {
    Navigation.handleAction(Routes.POLYMARKET_EVENT_SCREEN, { event, eventId: event.id });
  }, [event]);

  return (
    <View style={styles.container}>
      {Platform.OS === 'android' ? (
        <AndroidOddsPillsOverlay event={event} eventColor={eventColor} isDarkMode={isDarkMode} rows={rows} />
      ) : null}
      <ButtonPressAnimation onPress={handlePress} scaleTo={0.96} style={styles.flex} wrapperStyle={styles.flex}>
        <View style={[styles.cardShadow, !isDarkMode && styles.cardShadowLight]}>
          <GradientBorderView
            backgroundColor={isDarkMode ? globalColors.grey100 : opacity(globalColors.white100, 0.92)}
            borderGradientColors={cardBorderGradientColors}
            borderRadius={PREDICTION_MARKET_TILE_CARD_BORDER_RADIUS}
            borderWidth={2}
            end={CARD_BORDER_GRADIENT_CONFIG.end}
            locations={isDarkMode ? CARD_BORDER_GRADIENT_CONFIG.locations : undefined}
            start={CARD_BORDER_GRADIENT_CONFIG.start}
            style={styles.card}
          >
            <LinearGradient
              colors={cardGradientColors}
              pointerEvents="none"
              start={isDarkMode ? CARD_FILL_GRADIENT_CONFIG.start : CARD_FILL_LIGHT_GRADIENT_CONFIG.start}
              end={isDarkMode ? CARD_FILL_GRADIENT_CONFIG.end : CARD_FILL_LIGHT_GRADIENT_CONFIG.end}
              locations={isDarkMode ? CARD_FILL_GRADIENT_CONFIG.locations : undefined}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.content}>
              <ImgixImage enableFasterImage source={iconSource} size={42} style={styles.icon} />
              <View style={styles.headerText}>
                <Text align="left" color="label" numberOfLines={2} size="20pt / 135%" style={styles.title} weight="heavy">
                  {event.title}
                </Text>
                <View style={styles.statsRow}>
                  <Text align="left" color="labelTertiary" size="15pt" weight="bold">
                    {`VOL ${volumeText}`}
                  </Text>
                  {priceChangeText ? (
                    <View style={styles.priceChangeRow}>
                      <Text align="left" color={{ custom: priceChangeColor }} size="icon 11px" weight="heavy">
                        {priceChangeIsPositive ? UP_ARROW : DOWN_ARROW}
                      </Text>
                      <Text align="left" color={{ custom: priceChangeColor }} size="15pt" weight="bold">
                        {priceChangeText}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <View style={styles.outcomes}>
                {rows.map(row => (
                  <OutcomeRow
                    event={event}
                    eventColor={eventColor}
                    isDarkMode={isDarkMode}
                    key={`${row.market.id}:${row.outcomeIndex}`}
                    row={row}
                  />
                ))}
              </View>
            </View>
          </GradientBorderView>
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
}: {
  event: PolymarketEvent;
  eventColor: string;
  isDarkMode: boolean;
  row: OutcomeRowData;
}) {
  return (
    <GradientBorderView
      borderGradientColors={
        isDarkMode ? ([opacity(eventColor, 0.08), opacity(eventColor, 0)] as const) : ([eventColor, eventColor] as const)
      }
      borderBottomLeftRadius={22}
      borderBottomRightRadius={20}
      borderTopLeftRadius={22}
      borderTopRightRadius={20}
      borderWidth={2}
      end={OUTCOME_ROW_GRADIENT_CONFIG.end}
      locations={isDarkMode ? OUTCOME_ROW_GRADIENT_CONFIG.locations : undefined}
      start={OUTCOME_ROW_GRADIENT_CONFIG.start}
      style={styles.outcomeRowFrame}
    >
      <LinearGradient
        colors={[opacity(eventColor, 0.1), opacity(eventColor, 0)]}
        pointerEvents="none"
        start={OUTCOME_ROW_GRADIENT_CONFIG.start}
        end={OUTCOME_ROW_GRADIENT_CONFIG.end}
        locations={isDarkMode ? OUTCOME_ROW_GRADIENT_CONFIG.locations : undefined}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.outcomeRowContent}>
        {Platform.OS === 'android' ? (
          <View style={styles.oddsButton} />
        ) : (
          <OutcomeOddsPill event={event} eventColor={eventColor} isDarkMode={isDarkMode} row={row} />
        )}
        <Text align="left" color="label" numberOfLines={1} size="17pt" style={styles.outcomeTitle} weight="bold">
          {row.title}
        </Text>
      </View>
    </GradientBorderView>
  );
});

const OutcomeOddsPill = memo(function OutcomeOddsPill({
  event,
  eventColor,
  isDarkMode,
  row,
}: {
  event: PolymarketEvent;
  eventColor: string;
  isDarkMode: boolean;
  row: OutcomeRowData;
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
    <ButtonPressAnimation onPress={onPress} scaleTo={0.92} style={styles.oddsButton}>
      <View
        style={[
          styles.oddsPill,
          {
            backgroundColor: eventColor,
            borderColor: opacity(isDarkMode ? globalColors.white100 : globalColors.grey100, 0.1),
            shadowColor: isDarkMode ? eventColor : globalColors.grey100,
            shadowOpacity: isDarkMode ? 0.3 : 0.06,
          },
        ]}
      >
        <View
          style={[styles.oddsPillOverlay, { backgroundColor: opacity(globalColors.grey100, isDarkMode ? 0.3 : 0.1) }]}
          pointerEvents="none"
        />
        <LiveTokenText
          align="center"
          autoSubscriptionEnabled={false}
          color={{ custom: globalColors.white100 }}
          initialValue={formatOdds(row.initialPrice)}
          numberOfLines={1}
          selector={token => formatOdds(token.price)}
          size="17pt"
          tokenId={row.tokenId}
          weight="heavy"
        />
      </View>
    </ButtonPressAnimation>
  );
});

const AndroidOddsPillsOverlay = memo(function AndroidOddsPillsOverlay({
  event,
  eventColor,
  isDarkMode,
  rows,
}: {
  event: PolymarketEvent;
  eventColor: string;
  isDarkMode: boolean;
  rows: OutcomeRowData[];
}) {
  return (
    <View pointerEvents="box-none" style={styles.oddsPillsOverlay}>
      {rows.map((row, index) => (
        <View
          key={`${row.market.id}:${row.outcomeIndex}`}
          pointerEvents="box-none"
          style={[styles.oddsPillSlot, { bottom: ODDS_PILL_OVERLAY_BOTTOM + (rows.length - 1 - index) * OUTCOME_ROW_PITCH }]}
        >
          <OutcomeOddsPill event={event} eventColor={eventColor} isDarkMode={isDarkMode} row={row} />
        </View>
      ))}
    </View>
  );
});

/**
 * Token ids for the outcome pills this tile-widget renders. Derived from the SAME
 * getOutcomeRows resolution the card uses, so subscribed == rendered by construction.
 */
export function getTileWidgetTokenIds(event: PolymarketEvent): string[] {
  const tokenIds = getOutcomeRows(event).map(row => row.tokenId);
  return Array.from(new Set(tokenIds));
}

function getOutcomeRows(event: PolymarketEvent): OutcomeRowData[] {
  const activeMarkets = event.markets.filter(market => market.active && !market.closed);
  const firstMarket = activeMarkets[0];
  if (!firstMarket) return [];

  if (activeMarkets.length === 1) {
    return firstMarket.outcomes
      .slice(0, OUTCOME_ROW_COUNT)
      .map((outcome, outcomeIndex) =>
        buildOutcomeRow({
          market: firstMarket,
          outcomeIndex,
          title: outcome,
        })
      )
      .filter(isOutcomeRowData);
  }

  const marketsAboveThreshold = LAST_TRADE_PRICE_THRESHOLDS.map(threshold =>
    activeMarkets.filter(market => calculateOddsPrice(market) >= threshold)
  ).find(markets => markets.length >= OUTCOME_ROW_COUNT);
  const visibleMarkets = (marketsAboveThreshold ?? activeMarkets).slice(0, OUTCOME_ROW_COUNT);

  return visibleMarkets
    .map(market =>
      buildOutcomeRow({
        market,
        outcomeIndex: 0,
        title: formatOutcomeTitle(market.groupItemTitle || market.outcomes[0] || market.question),
      })
    )
    .filter(isOutcomeRowData);
}

function buildOutcomeRow({
  market,
  outcomeIndex,
  title,
}: {
  market: PolymarketMarket;
  outcomeIndex: number;
  title: string;
}): OutcomeRowData | null {
  const tokenId = market.clobTokenIds[outcomeIndex];
  if (!tokenId) return null;

  return {
    market,
    outcomeIndex,
    title,
    initialPrice: getInitialOutcomePrice(market, outcomeIndex),
    tokenId: getPolymarketTokenId(tokenId, 'sell'),
  };
}

function isOutcomeRowData(row: OutcomeRowData | null): row is OutcomeRowData {
  return row !== null;
}

function getInitialOutcomePrice(market: PolymarketMarket, outcomeIndex: number): string | number {
  const outcomePrice = market.outcomePrices[outcomeIndex];
  return outcomePrice === undefined || outcomePrice === '' ? calculateOddsPrice(market) : outcomePrice;
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
  const match = title.match(/^([↑↓])\s*(\$)?\s*(.+)$/);
  if (!match) return title;

  return `${match[1]} $${match[3]}`;
}

function formatPriceChange(priceChange: number | undefined): string {
  if (priceChange === undefined || Math.abs(priceChange) < 0.01) return '';
  const roundedPriceChange = Math.round(priceChange * 100) / 100;
  return `${toPercentageWorklet(Math.abs(roundedPriceChange))}%`;
}

function getTileAccentColor(event: PolymarketEvent, isDarkMode: boolean): string {
  const semanticMatchTarget = `${event.title} ${event.ticker} ${event.slug} ${event.subtitle}`;
  const semanticAccentColor = ASSET_ACCENT_COLORS.find(({ pattern }) => pattern.test(semanticMatchTarget))?.color;
  return semanticAccentColor ?? getColorValueForThemeWorklet(event.color, isDarkMode);
}

const styles = StyleSheet.create({
  container: {
    height: PREDICTION_MARKET_TILE_CARD_HEIGHT,
    width: PREDICTION_MARKET_TILE_CARD_WIDTH,
  },
  card: {
    flex: 1,
    overflow: 'hidden',
  },
  cardShadow: {
    borderCurve: 'continuous',
    borderRadius: PREDICTION_MARKET_TILE_CARD_BORDER_RADIUS,
    flex: 1,
  },
  cardShadowLight: {
    backgroundColor: opacity(globalColors.white100, 0.92),
    elevation: 4,
    shadowColor: globalColors.grey100,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 12,
    paddingTop: 22,
  },
  flex: {
    flex: 1,
  },
  headerText: {
    gap: 12,
    paddingHorizontal: 10,
  },
  icon: {
    borderRadius: 14,
    height: 42,
    marginBottom: 14,
    width: 42,
  },
  oddsPill: {
    alignItems: 'center',
    borderRadius: ODDS_PILL_BORDER_RADIUS,
    borderWidth: 2,
    height: ODDS_PILL_HEIGHT,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 8,
    shadowOffset: { height: 0, width: 0 },
    shadowRadius: 24,
    width: ODDS_PILL_WIDTH,
  },
  oddsButton: {
    borderRadius: ODDS_PILL_BORDER_RADIUS,
    height: ODDS_PILL_HEIGHT,
    width: ODDS_PILL_WIDTH,
  },
  oddsPillOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: ODDS_PILL_BORDER_RADIUS,
  },
  oddsPillsOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  oddsPillSlot: {
    height: ODDS_PILL_HEIGHT,
    left: ODDS_PILL_OVERLAY_LEFT,
    position: 'absolute',
    width: ODDS_PILL_WIDTH,
  },
  outcomeTitle: {
    flex: 1,
  },
  outcomes: {
    alignItems: 'center',
    gap: 4,
  },
  outcomeRowContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    paddingLeft: 8,
    paddingRight: 12,
  },
  outcomeRowFrame: {
    height: 58,
    overflow: 'hidden',
    width: OUTCOME_ROW_WIDTH,
  },
  priceChangeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  statsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    height: 54,
  },
});
