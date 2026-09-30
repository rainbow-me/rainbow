import { memo, useCallback, useMemo, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import ImgixImage from '@/components/images/ImgixImage';
import { useColorMode } from '@/design-system/color/ColorMode';
import { globalColors } from '@/design-system/color/palettes';
import { Text } from '@/design-system/components/Text/Text';
import { TextIcon } from '@/design-system/components/TextIcon/TextIcon';
import { type CardPressHandler, type OrderPressHandler } from '@/features/discover/types/sectionLayout';
import { DOWN_ARROW, UP_ARROW } from '@/features/market/ui/utils/formatPriceChange';
import { BetButton } from '@/features/polymarket/components/BetButton';
import { type PolymarketEvent, type PolymarketMarket } from '@/features/polymarket/types/polymarket-event';
import { getOutcomeColor } from '@/features/polymarket/utils/getMarketColor';
import { formatNumber } from '@/helpers/strings';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { createOpacityPalette, white } from '@/worklets/colors';

// ============ Types ========================================================== //

type PredictionMarketTileCardProps = {
  event: PolymarketEvent;
  onOrderPress: OrderPressHandler;
  onPress: CardPressHandler;
};

type OutcomeRowData = {
  market: PolymarketMarket;
  outcomeIndex: number;
  title: string;
  initialPrice: string | number;
  tokenId: string;
};

// ============ Constants ====================================================== //

/** Dimensions shared by prediction tiles, their skeletons, and the list layout. */
export const PREDICTION_MARKET_TILE_CARD_WIDTH = Math.min(280, DEVICE_WIDTH - 40);
export const PREDICTION_MARKET_TILE_CARD_HEIGHT = 280;
export const PREDICTION_MARKET_TILE_CARD_BORDER_RADIUS = 30;

const OUTCOME_ROW_COUNT = 2;
const LAST_TRADE_PRICE_THRESHOLDS = [0.05, 0.01];
const LIGHT_CARD_BACKGROUND = white(0.92);
const LIGHT_CARD_BORDER_COLORS = [white(0.8), white(0.8)] as const;
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
const ASSET_ACCENT_COLORS = [
  { color: '#F8931A', pattern: /\b(bitcoin|btc)\b/i },
  { color: '#9CA4AD', pattern: /\b(ethereum|eth)\b/i },
  { color: '#C0C1CC', pattern: /\b(silver|xagusd|xag)\b/i },
  { color: '#D6A438', pattern: /\b(gold|xauusd|xau)\b/i },
  { color: '#7A70FF', pattern: /\b(solana|sol)\b/i },
] as const;

// ============ Prediction Card ================================================ //

/**
 * A Discover prediction tile with an event summary and available bets.
 */
export const PredictionMarketTileCard = memo(function PredictionMarketTileCard({
  event,
  onOrderPress,
  onPress,
}: PredictionMarketTileCardProps): ReactElement {
  const { isDarkMode } = useColorMode();
  const eventColor = useMemo(() => getTileAccentColor(event, isDarkMode), [event, isDarkMode]);
  const rows = useMemo(() => getOutcomeRows(event), [event]);
  const iconSource = useMemo(() => ({ uri: event.icon ?? event.image }), [event.icon, event.image]);
  const volumeText = useMemo(() => formatNumber(event.volume, { useOrderSuffix: true, style: '$' }), [event.volume]);
  const priceChange = rows[0]?.market.oneDayPriceChange;
  const priceChangeText = formatPriceChange(priceChange);
  const priceChangeIsPositive = priceChange !== undefined && priceChange > 0;
  const priceChangeColor = priceChangeIsPositive ? 'green' : 'red';
  const { cardBorderColors, cardFillColors, outcomeBorderColors, outcomeFillColors } = useMemo(() => {
    const palette = createOpacityPalette(eventColor, isDarkMode ? [0, 8, 10, 24] : [0, 6, 10]);
    const outcomeBorderColors = isDarkMode ? ([palette.opacity8, palette.opacity0] as const) : ([eventColor, eventColor] as const);

    return {
      cardBorderColors: isDarkMode ? outcomeBorderColors : LIGHT_CARD_BORDER_COLORS,
      cardFillColors: [isDarkMode ? palette.opacity24 : palette.opacity6, palette.opacity0] as const,
      outcomeBorderColors,
      outcomeFillColors: [palette.opacity10, palette.opacity0] as const,
    };
  }, [eventColor, isDarkMode]);

  const handlePress = useCallback(() => {
    onPress({ marketId: event.id, marketName: event.title, marketSlug: event.slug, marketSymbol: event.ticker });
    Navigation.handleAction(Routes.POLYMARKET_EVENT_SCREEN, { event, eventId: event.id });
  }, [event, onPress]);

  return (
    <ButtonPressAnimation onPress={handlePress} scaleTo={0.96} style={styles.container}>
      <View style={[styles.cardShadow, isDarkMode ? undefined : styles.cardShadowLight]}>
        <GradientBorderView
          backgroundColor={isDarkMode ? globalColors.grey100 : LIGHT_CARD_BACKGROUND}
          borderGradientColors={cardBorderColors}
          borderRadius={PREDICTION_MARKET_TILE_CARD_BORDER_RADIUS}
          borderWidth={2}
          end={CARD_BORDER_GRADIENT_CONFIG.end}
          locations={isDarkMode ? CARD_BORDER_GRADIENT_CONFIG.locations : undefined}
          start={CARD_BORDER_GRADIENT_CONFIG.start}
          style={styles.card}
        >
          <LinearGradient
            colors={cardFillColors}
            pointerEvents="none"
            start={isDarkMode ? CARD_FILL_GRADIENT_CONFIG.start : CARD_FILL_LIGHT_GRADIENT_CONFIG.start}
            end={isDarkMode ? CARD_FILL_GRADIENT_CONFIG.end : CARD_FILL_LIGHT_GRADIENT_CONFIG.end}
            locations={isDarkMode ? CARD_FILL_GRADIENT_CONFIG.locations : undefined}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.content}>
            <View style={styles.header}>
              <ImgixImage enableFasterImage source={iconSource} size={40} style={styles.icon} />
              <View style={styles.headerText}>
                <Text color="label" numberOfLines={2} size="20pt / 135%" style={styles.title} weight="heavy">
                  {event.title}
                </Text>
                <View style={styles.statsRow}>
                  <Text color="labelTertiary" size="13pt" weight="bold">
                    {volumeText} {i18n.t(i18n.l.market_data.vol)}
                  </Text>
                  {priceChangeText ? (
                    <View style={styles.priceChangeRow}>
                      <TextIcon color={priceChangeColor} height={9} size="icon 10px" weight="heavy" width={11}>
                        {priceChangeIsPositive ? UP_ARROW : DOWN_ARROW}
                      </TextIcon>
                      <Text color={priceChangeColor} size="13pt" weight="bold">
                        {priceChangeText}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
            <View style={styles.outcomes}>
              {rows.map(row => (
                <OutcomeRow
                  event={event}
                  eventColor={eventColor}
                  isDarkMode={isDarkMode}
                  key={`${row.market.id}:${row.outcomeIndex}`}
                  borderGradientColors={outcomeBorderColors}
                  fillGradientColors={outcomeFillColors}
                  row={row}
                  onOrderPress={onOrderPress}
                />
              ))}
            </View>
          </View>
        </GradientBorderView>
      </View>
    </ButtonPressAnimation>
  );
});

// ============ Outcomes ======================================================= //

const OutcomeRow = memo(function OutcomeRow({
  borderGradientColors,
  event,
  eventColor,
  fillGradientColors,
  isDarkMode,
  row,
  onOrderPress,
}: {
  borderGradientColors: readonly [string, string];
  event: PolymarketEvent;
  eventColor: string;
  fillGradientColors: readonly [string, string];
  isDarkMode: boolean;
  row: OutcomeRowData;
  onOrderPress: OrderPressHandler;
}): ReactElement {
  const handleBetPress = useCallback(() => {
    onOrderPress({ marketId: row.market.id, marketName: row.market.question, marketSlug: row.market.slug, outcome: row.title });

    Navigation.handleAction(Routes.POLYMARKET_NEW_POSITION_SHEET, {
      market: row.market,
      event,
      outcomeIndex: row.outcomeIndex,
      outcomeColor: getOutcomeColor({
        market: row.market,
        outcome: row.market.outcomes[row.outcomeIndex] ?? row.title,
        outcomeIndex: row.outcomeIndex,
        isDarkMode,
      }),
      fromRoute: Routes.POLYMARKET_BROWSE_EVENTS_SCREEN,
    });
  }, [event, isDarkMode, onOrderPress, row.market, row.outcomeIndex, row.title]);

  return (
    <GradientBorderView
      borderGradientColors={borderGradientColors}
      borderRadius={20}
      borderWidth={2}
      end={OUTCOME_ROW_GRADIENT_CONFIG.end}
      locations={isDarkMode ? OUTCOME_ROW_GRADIENT_CONFIG.locations : undefined}
      start={OUTCOME_ROW_GRADIENT_CONFIG.start}
      style={styles.outcomeRowFrame}
    >
      <LinearGradient
        colors={fillGradientColors}
        pointerEvents="none"
        start={OUTCOME_ROW_GRADIENT_CONFIG.start}
        end={OUTCOME_ROW_GRADIENT_CONFIG.end}
        locations={isDarkMode ? OUTCOME_ROW_GRADIENT_CONFIG.locations : undefined}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.outcomeRowContent}>
        <BetButton
          key={row.tokenId}
          liveTokenId={row.tokenId}
          fallbackPrice={row.initialPrice}
          color={eventColor}
          isDarkMode={isDarkMode}
          onPress={handleBetPress}
        />
        <Text align="left" color="label" numberOfLines={1} size="17pt" style={styles.outcomeTitle} weight="bold">
          {row.title}
        </Text>
      </View>
    </GradientBorderView>
  );
});

// ============ Helpers ======================================================== //

/**
 * Live-token IDs for the outcomes displayed by this card.
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
  if (priceChange === undefined) return '';
  const percentage = Math.round(Math.abs(priceChange) * 1000) / 10;
  return percentage ? `${percentage}%` : '';
}

function getTileAccentColor(event: PolymarketEvent, isDarkMode: boolean): string {
  const semanticMatchTarget = `${event.title} ${event.ticker} ${event.slug} ${event.subtitle}`;
  const semanticAccentColor = ASSET_ACCENT_COLORS.find(({ pattern }) => pattern.test(semanticMatchTarget))?.color;
  return semanticAccentColor ?? getColorValueForThemeWorklet(event.color, isDarkMode);
}

// ============ Styles ========================================================= //

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
    backgroundColor: LIGHT_CARD_BACKGROUND,
    elevation: 4,
    shadowColor: globalColors.grey100,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 10,
    paddingHorizontal: 10,
    paddingTop: 20,
  },
  header: {
    gap: 16,
    paddingHorizontal: 10,
  },
  headerText: {
    gap: 16,
  },
  icon: {
    borderRadius: 10,
    height: 40,
    width: 40,
  },
  outcomeTitle: {
    flex: 1,
  },
  outcomes: {
    gap: 4,
  },
  outcomeRowContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    paddingLeft: 6,
    paddingRight: 12,
  },
  outcomeRowFrame: {
    height: 52,
    overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  title: {
    maxWidth: 236,
  },
});
