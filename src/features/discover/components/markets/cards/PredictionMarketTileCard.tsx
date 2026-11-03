import { memo, useCallback, useMemo } from 'react';
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
import { getPredictionWidgetOutcomes, type PredictionWidgetOutcome } from '@/features/discover/utils/getPredictionWidgetOutcomes';
import { DOWN_ARROW, UP_ARROW } from '@/features/market/ui/utils/formatPriceChange';
import { BetButton } from '@/features/polymarket/components/BetButton';
import { type PolymarketEvent } from '@/features/polymarket/types/polymarket-event';
import { getOutcomeColors } from '@/features/polymarket/utils/getMarketColor';
import { formatNumber } from '@/helpers/strings';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { createOpacityPalette, white } from '@/worklets/colors';

// ============ Types ========================================================== //

type PredictionMarketTileCardProps = {
  event: PolymarketEvent;
  onOrderPress: OrderPressHandler;
  onPress: CardPressHandler;
};

// ============ Constants ====================================================== //

/** Dimensions shared by prediction tiles, their skeletons, and the list layout. */
export const PREDICTION_MARKET_TILE_CARD_WIDTH = Math.min(280, DEVICE_WIDTH - 40);
export const PREDICTION_MARKET_TILE_CARD_HEIGHT = 280;
export const PREDICTION_MARKET_TILE_CARD_BORDER_RADIUS = 30;

const LIGHT_CARD_BACKGROUND = white(0.92);
const LIGHT_CARD_BORDER_COLORS = [white(0.8), white(0.8)] as const;

const CARD_FILL_GRADIENT_CONFIG = { end: { x: 1, y: 1 }, locations: [0.17824, 0.58889] as const, start: { x: 0, y: 0 } };
const CARD_FILL_LIGHT_GRADIENT_CONFIG = { end: { x: 1, y: 0.72 }, start: { x: 0, y: 0 } };
const CARD_BORDER_GRADIENT_CONFIG = { end: { x: 1, y: 1 }, locations: [0, 0.94] as const, start: { x: 0, y: 0 } };
const OUTCOME_ROW_GRADIENT_CONFIG = { end: { x: 0.89062, y: 0.5 }, locations: [0, 1] as const, start: { x: 0, y: 0.5 } };

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
}: PredictionMarketTileCardProps) {
  const { isDarkMode } = useColorMode();
  const eventColor = useMemo(() => getTileAccentColor(event, isDarkMode), [event, isDarkMode]);
  const rows = useMemo(() => getPredictionWidgetOutcomes(event), [event]);
  const iconSource = useMemo(() => ({ uri: event.icon ?? event.image }), [event.icon, event.image]);
  const volumeText = useMemo(
    () => (event.volume == null ? null : formatNumber(event.volume, { useOrderSuffix: true, style: '$' })),
    [event.volume]
  );

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
                  {volumeText ? (
                    <Text color="labelTertiary" size="13pt" weight="bold">
                      {volumeText} {i18n.t(i18n.l.market_data.vol)}
                    </Text>
                  ) : null}

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
  row: PredictionWidgetOutcome;
  onOrderPress: OrderPressHandler;
}) {
  const handleBetPress = useCallback(() => {
    onOrderPress({ marketId: row.market.id, marketName: row.market.question, marketSlug: row.market.slug, outcome: row.title });

    Navigation.handleAction(Routes.POLYMARKET_NEW_POSITION_SHEET, {
      market: row.market,
      event,
      outcomeIndex: row.outcomeIndex,
      accentColor: getOutcomeColors({
        market: row.market,
        outcome: row.market.outcomes[row.outcomeIndex] ?? row.title,
        outcomeIndex: row.outcomeIndex,
        teams: event.teams,
      }),
      fromRoute: Routes.POLYMARKET_BROWSE_EVENTS_SCREEN,
    });
  }, [event, onOrderPress, row.market, row.outcomeIndex, row.title]);

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
