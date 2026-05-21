import { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import ImgixImage from '@/components/images/ImgixImage';
import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { globalColors, Text, useColorMode } from '@/design-system';
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
export const PREDICTION_MARKET_TILE_CARD_BORDER_RADIUS = 24;

const OUTCOME_ROW_COUNT = 2;
const LAST_TRADE_PRICE_THRESHOLDS = [0.05, 0.01];
const CARD_GRADIENT_CONFIG = {
  end: { x: 0.64, y: 0.68 },
  start: { x: -0.08, y: -0.08 },
};
const OUTCOME_ROW_WIDTH = 256;
const ASSET_ACCENT_COLORS = [
  { color: '#F8931A', pattern: /\b(bitcoin|btc)\b/i },
  { color: '#9CA4AD', pattern: /\b(ethereum|eth)\b/i },
  { color: '#C0C1CC', pattern: /\b(silver|xagusd|xag)\b/i },
  { color: '#D6A438', pattern: /\b(gold|xauusd|xau)\b/i },
  { color: '#7A70FF', pattern: /\b(solana|sol)\b/i },
] as const;

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
  const eventColor = useMemo(() => getTileAccentColor(event, isDarkMode), [event, isDarkMode]);
  const rows = useMemo(() => getOutcomeRows(event), [event]);
  const iconSource = useMemo(() => ({ uri: event.icon ?? event.image }), [event.icon, event.image]);
  const volumeText = useMemo(() => formatNumber(String(event.volume), { useOrderSuffix: true, decimals: 1, style: '$' }), [event.volume]);
  const priceChange = rows[0]?.market.oneDayPriceChange;
  const priceChangeText = useMemo(() => formatPriceChange(priceChange), [priceChange]);
  const priceChangeIsPositive = priceChange !== undefined && priceChange > 0;
  const colorPalette = useMemo(() => createOpacityPalette(eventColor, [0, 8, 10, 16, 24]), [eventColor]);
  const cardBorderGradientColors = useMemo(
    () => (isDarkMode ? ([eventColor, colorPalette.opacity16] as const) : ([globalColors.white100, globalColors.white100] as const)),
    [colorPalette.opacity16, eventColor, isDarkMode]
  );
  const cardGradientColors = useMemo(
    () =>
      isDarkMode ? ([colorPalette.opacity24, colorPalette.opacity0] as const) : ([colorPalette.opacity10, colorPalette.opacity0] as const),
    [colorPalette.opacity0, colorPalette.opacity10, colorPalette.opacity24, isDarkMode]
  );

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
        <GradientBorderView
          backgroundColor={isDarkMode ? globalColors.grey100 : opacity(globalColors.white100, 0.9)}
          borderGradientColors={cardBorderGradientColors}
          borderRadius={PREDICTION_MARKET_TILE_CARD_BORDER_RADIUS}
          borderWidth={2}
          end={CARD_GRADIENT_CONFIG.end}
          start={CARD_GRADIENT_CONFIG.start}
          style={styles.card}
        >
          <LinearGradient
            colors={cardGradientColors}
            pointerEvents="none"
            start={CARD_GRADIENT_CONFIG.start}
            end={CARD_GRADIENT_CONFIG.end}
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
                    <Text
                      align="left"
                      color={priceChangeIsPositive ? { custom: '#2BEA69' } : { custom: '#FF4D57' }}
                      size="icon 11px"
                      weight="heavy"
                      style={{ transform: priceChangeIsPositive ? [{ rotate: '180deg' }] : [] }}
                    >
                      {'􀄱'}
                    </Text>
                    <Text
                      align="left"
                      color={priceChangeIsPositive ? { custom: '#2BEA69' } : { custom: '#FF4D57' }}
                      size="15pt"
                      weight="bold"
                    >
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
    <GradientBorderView
      borderGradientColors={[eventColor, opacity(eventColor, 0.18)]}
      borderRadius={22}
      borderWidth={2}
      style={styles.outcomeRowFrame}
    >
      <LinearGradient
        colors={[opacity(eventColor, isDarkMode ? 0.1 : 0.08), opacity(eventColor, 0)]}
        pointerEvents="none"
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.outcomeRowContent}>
        <ButtonPressAnimation onPress={onPress} scaleTo={0.92}>
          <View style={[styles.oddsPill, { backgroundColor: eventColor, shadowColor: eventColor }]}>
            <View style={styles.oddsPillOverlay} pointerEvents="none" />
            <LiveTokenText
              align="center"
              autoSubscriptionEnabled={false}
              color={{ custom: '#FFFFFF' }}
              initialValue={formatOdds(row.initialPrice)}
              numberOfLines={1}
              selector={token => formatOdds(token.price)}
              size="17pt"
              tokenId={row.tokenId}
              weight="heavy"
            />
          </View>
        </ButtonPressAnimation>
        <Text align="left" color="label" numberOfLines={1} size="17pt" style={styles.outcomeTitle} weight="bold">
          {row.title}
        </Text>
      </View>
    </GradientBorderView>
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

function getTileAccentColor(event: PolymarketEvent, isDarkMode: boolean): string {
  const semanticMatchTarget = `${event.title} ${event.ticker} ${event.slug} ${event.subtitle}`;
  const semanticAccentColor = ASSET_ACCENT_COLORS.find(({ pattern }) => pattern.test(semanticMatchTarget))?.color;
  return semanticAccentColor ?? getColorValueForThemeWorklet(event.color, isDarkMode);
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    overflow: 'hidden',
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
    borderColor: opacity('#FFFFFF', 0.1),
    borderRadius: 15,
    borderWidth: 2,
    height: 42,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 8,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    width: 62,
  },
  oddsPillOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: opacity('#000000', 0.3),
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
