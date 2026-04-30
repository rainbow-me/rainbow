import React, { memo, useCallback } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import ImgixImage from '@/components/images/ImgixImage';
import { Text, TextIcon, useColorMode } from '@/design-system';
import { useCandlestickStore } from '@/features/charts/stores/candlestickStore';
import { CandleResolution } from '@/features/charts/types';
import { convertStoredPerpPriceChangeToPercent, formatCompactPerpPercentChange } from '@/features/discover/components/perpMarketFormatting';
import { DOWN_ARROW, UP_ARROW } from '@/features/perps/constants';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { navigateToPerpDetailScreen } from '@/features/perps/utils';
import { type PlacementItem, type PlacementItemAnalyticsMetadata } from '@/features/placements/types';
import { opacity } from '@/framework/ui/utils/opacity';
import { getHighContrastColor } from '@/hooks/useAccountAccentColor';
import { getHighContrastTextColorWorklet } from '@/worklets/colors';

type PerpMarketCardProps = {
  item: PlacementItem;
  onPressTracked?: (metadata?: PlacementItemAnalyticsMetadata) => void;
  style?: StyleProp<ViewStyle>;
};

export type { PerpMarketCardProps };

export const PERP_MARKET_CARD_HEIGHT = 76;

const PERP_MARKET_CARD_WIDTH_NO_CHART = 154;
const PERP_MARKET_CARD_MAX_WIDTH = 280;
const PERP_MARKET_NO_CHART_FIXED_WIDTH = 94;
const PERP_MARKET_NO_CHART_TEXT_MIN_WIDTH = PERP_MARKET_CARD_WIDTH_NO_CHART - PERP_MARKET_NO_CHART_FIXED_WIDTH;
const ESTIMATED_SYMBOL_CHARACTER_WIDTH = 11;
const SYMBOL_TEXT_BUFFER = 8;

export function computePerpCardWidth({ percentChangeText, symbol }: { percentChangeText?: string; symbol?: string }): number {
  const estimatedTextWidth = symbol
    ? symbol.length * ESTIMATED_SYMBOL_CHARACTER_WIDTH + SYMBOL_TEXT_BUFFER
    : PERP_MARKET_NO_CHART_TEXT_MIN_WIDTH;
  const textWidth = Math.max(PERP_MARKET_NO_CHART_TEXT_MIN_WIDTH, estimatedTextWidth);

  return Math.min(PERP_MARKET_CARD_MAX_WIDTH, Math.ceil(PERP_MARKET_NO_CHART_FIXED_WIDTH + textWidth));
}

const PRICE_CHANGE_COLORS = {
  positive: { light: '#1DB847', dark: '#3ECF5B' },
  negative: { light: '#FA423C', dark: '#FF584D' },
} as const;

export const PerpMarketCard = memo(function PerpMarketCard({ item, onPressTracked, style }: PerpMarketCardProps) {
  const market = useHyperliquidMarketsStore(state => state.getMarket(item.ref.id));
  const candlestickPercentChange = useCandlestickStore(state => {
    const price = state.prices[item.ref.id];
    return price?.candleResolution === CandleResolution.H1 ? price.percentChange : undefined;
  });
  const { isDarkMode } = useColorMode();

  const onPress = useCallback(() => {
    if (market) navigateToPerpDetailScreen(market.symbol);
    onPressTracked?.(
      market
        ? {
            marketId: market.symbol,
            marketName: market.metadata?.name ?? market.baseSymbol,
            marketSymbol: market.baseSymbol,
          }
        : undefined
    );
  }, [market, onPressTracked]);

  if (!market) return null;

  const accentColor = market.metadata?.colors?.color || market.metadata?.colors?.fallbackColor || '#3ECFAD';
  const percentChange =
    candlestickPercentChange ?? convertStoredPerpPriceChangeToPercent(market.priceChange['1h'] || market.priceChange['24h']);
  const isPositive = percentChange >= 0;
  const changeColor = isPositive
    ? isDarkMode
      ? PRICE_CHANGE_COLORS.positive.dark
      : PRICE_CHANGE_COLORS.positive.light
    : isDarkMode
      ? PRICE_CHANGE_COLORS.negative.dark
      : PRICE_CHANGE_COLORS.negative.light;
  const cardBackgroundColor = isDarkMode ? '#171B20' : 'rgba(255,255,255,0.92)';
  const borderColor = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.8)';
  const badgeBorderColor = isDarkMode ? 'rgba(255,255,255,0.24)' : 'rgba(0,0,0,0.07)';
  const badgeTextColor = isDarkMode ? 'rgba(0,0,0,0.8)' : '#FFFFFF';
  const gradientStartColor = opacity(accentColor, isDarkMode ? 0.26 : 0.06);
  const percentChangeText = formatCompactPerpPercentChange(percentChange);
  const cardWidth = computePerpCardWidth({ percentChangeText, symbol: market.baseSymbol });
  const iconUrl = useHyperliquidMarketsStore.getState().getCoinIcon(market.baseSymbol) ?? market.metadata?.iconUrl;
  const arrow = isPositive ? UP_ARROW : DOWN_ARROW;

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.96} style={[{ width: cardWidth }, style]}>
      <View style={[styles.cardShadow, isDarkMode ? styles.cardShadowDark : styles.cardShadowLight]}>
        <View style={[styles.card, { backgroundColor: cardBackgroundColor, borderColor }]}>
          <LinearGradient
            colors={[gradientStartColor, opacity(accentColor, 0)]}
            end={{ x: 1, y: 1 }}
            pointerEvents="none"
            start={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.contentRow}>
            <View style={styles.leftContent}>
              <View style={[styles.iconBorder, { borderColor: accentColor, shadowColor: accentColor }]}>
                <View style={styles.iconFill}>
                  {iconUrl ? (
                    <ImgixImage enableFasterImage source={{ uri: iconUrl }} style={styles.iconImage} />
                  ) : (
                    <Text align="center" size="15pt" weight="heavy" color={{ custom: accentColor }}>
                      {market.baseSymbol.slice(0, 1)}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.textColumn}>
                <Text size="17pt" weight="bold" color="label" numberOfLines={1} style={styles.symbolText}>
                  {market.baseSymbol}
                </Text>

                <View style={styles.changeRow}>
                  <TextIcon color={{ custom: changeColor }} containerSize={12} height={20} size="icon 13px" weight="heavy" width={12}>
                    {arrow}
                  </TextIcon>
                  <Text size="15pt" weight="bold" color={{ custom: changeColor }} numberOfLines={1} style={styles.percentText}>
                    {percentChangeText}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.badgePositioner}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: accentColor,
                  borderColor: badgeBorderColor,
                  shadowColor: isDarkMode ? '#000000' : accentColor,
                  shadowOpacity: isDarkMode ? 0.14 : 0.25,
                },
              ]}
            >
              <Text align="center" size="11pt" weight="heavy" color={{ custom: badgeTextColor }}>
                {`${market.maxLeverage}x`}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ButtonPressAnimation>
  );
});

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1.33,
    justifyContent: 'center',
    minHeight: 22,
    paddingHorizontal: 5,
    paddingVertical: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
  },
  badgePositioner: {
    left: 8.67,
    position: 'absolute',
    top: 8,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1.33,
    height: PERP_MARKET_CARD_HEIGHT,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingLeft: 12,
    paddingRight: 12,
    paddingVertical: 12,
    width: '100%',
  },
  cardShadow: {
    borderRadius: 24,
    height: PERP_MARKET_CARD_HEIGHT,
    width: '100%',
  },
  cardShadowDark: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
  },
  cardShadowLight: {
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
  },
  changeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    minHeight: 20,
    minWidth: 0,
  },
  contentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  iconBorder: {
    alignItems: 'center',
    borderRadius: 25,
    borderWidth: 2.66,
    height: 50,
    justifyContent: 'center',
    padding: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    width: 50,
  },
  iconFill: {
    alignItems: 'center',
    backgroundColor: '#292D32',
    borderRadius: 22,
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  iconImage: {
    borderRadius: 20,
    height: '100%',
    width: '100%',
  },
  leftContent: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: 10,
    minWidth: 0,
  },
  percentText: {
    flexShrink: 0,
  },
  symbolText: {
    flexShrink: 1,
  },
  textColumn: {
    flexShrink: 1,
    gap: 6,
    justifyContent: 'center',
    minWidth: 0,
    paddingVertical: 1,
  },
});
