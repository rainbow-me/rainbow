import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import ConditionalWrap from 'conditional-wrap';
import { LinearGradient } from 'expo-linear-gradient';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { CARD_HEIGHT } from '@/components/Discover/MarketCarousel';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { LiveTokenText } from '@/components/live-token-text/LiveTokenText';
import { Box, Text, TextIcon, useColorMode } from '@/design-system';
import { HyperliquidTokenIcon } from '@/features/perps/components/HyperliquidTokenIcon';
import { DOWN_ARROW, UP_ARROW } from '@/features/perps/constants';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { type PerpMarketWithMetadata } from '@/features/perps/types';
import { formatPriceChange, getHyperliquidTokenId, navigateToPerpDetailScreen } from '@/features/perps/utils';
import { formatPerpAssetPrice } from '@/features/perps/utils/formatPerpsAssetPrice';
import { type PlacementItem } from '@/features/placements/types';
import { opacity } from '@/framework/ui/utils/opacity';
import * as i18n from '@/languages';
import { type TokenData } from '@/state/liveTokens/liveTokensStore';
import { createOpacityPalette } from '@/worklets/colors';

type PerpMarketCardProps = {
  item: PlacementItem;
};

// Figma price-change colors (Color Light/green, Color Light/red)
const POSITIVE_COLOR = '#1DB847';
const NEGATIVE_COLOR = '#FA423C';
const NEUTRAL_COLOR = 'rgba(27, 29, 31, 0.5)';

const PRICE_CHANGE_COLORS = {
  positive: POSITIVE_COLOR,
  negative: NEGATIVE_COLOR,
  neutral: NEUTRAL_COLOR,
};

export const PerpMarketCard = memo(function PerpMarketCard({ item }: PerpMarketCardProps) {
  const { isDarkMode } = useColorMode();
  const market = useHyperliquidMarketsStore(state => state.getMarket(item.ref.id));

  if (!market) return null;

  return <PerpMarketCardContent item={item} market={market} isDarkMode={isDarkMode} />;
});

const PerpMarketCardContent = memo(function PerpMarketCardContent({
  item,
  market,
  isDarkMode,
}: {
  item: PlacementItem;
  market: PerpMarketWithMetadata;
  isDarkMode: boolean;
}) {
  const accentColor = market.metadata?.colors?.color || market.metadata?.colors?.fallbackColor || '#3ECFAD';
  const accentColors = useMemo(() => createOpacityPalette(accentColor, [0, 6, 8, 10, 12, 16, 24] as const), [accentColor]);
  const tokenId = useMemo(() => getHyperliquidTokenId(market.symbol), [market.symbol]);
  const subtitle = item.metadata?.subtitle as string | undefined;

  const initialChange24hPct = Number(market.priceChange['24h']) * 10_000;
  const isInitialPositive = initialChange24hPct >= 0;
  const initialArrow = isInitialPositive ? UP_ARROW : DOWN_ARROW;
  const initialChangeColor = isInitialPositive ? POSITIVE_COLOR : NEGATIVE_COLOR;

  const onPress = useCallback(() => navigateToPerpDetailScreen(market.symbol), [market.symbol]);

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.96}>
      <ConditionalWrap
        condition={isDarkMode}
        wrap={children => (
          <GradientBorderView
            borderGradientColors={[accentColors.opacity8, accentColors.opacity16]}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            borderRadius={32}
            borderWidth={2.5}
            style={styles.clip}
          >
            {children}
          </GradientBorderView>
        )}
      >
        <ConditionalWrap
          condition={!isDarkMode}
          wrap={children => (
            <Box background="surfacePrimaryElevated" shadow="24px" borderRadius={32} style={styles.shadowHost}>
              <View style={styles.clip}>{children}</View>
            </Box>
          )}
        >
          <View style={styles.cardInner}>
            {isDarkMode && (
              <LinearGradient
                colors={[accentColors.opacity24, accentColors.opacity0]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.5, y: 0 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
            )}

            <View style={[styles.iconBorder, { borderColor: isDarkMode ? opacity(accentColor, 0.2) : opacity(accentColor, 0.12) }]}>
              <HyperliquidTokenIcon symbol={market.symbol} size={52} />
            </View>

            <View style={styles.content}>
              <View style={styles.row}>
                <View style={styles.leftColumn}>
                  <View style={styles.symbolRow}>
                    <Text size="20pt" weight="heavy" color="label" numberOfLines={1}>
                      {market.baseSymbol}
                    </Text>
                    {subtitle ? (
                      <Text size="15pt" weight="bold" color="labelQuaternary" numberOfLines={1}>
                        {subtitle}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <LiveTokenText
                  align="right"
                  selector={livePriceSelector}
                  tokenId={tokenId}
                  initialValueLastUpdated={0}
                  initialValue={formatPerpAssetPrice(market.midPrice ?? market.price)}
                  autoSubscriptionEnabled
                  color="label"
                  size="17pt"
                  weight="bold"
                />
              </View>

              <View style={styles.row}>
                <View style={styles.changeRow}>
                  <TextIcon color={{ custom: initialChangeColor }} size="icon 13px" weight="heavy" textStyle={{ top: 1 }}>
                    {initialArrow}
                  </TextIcon>
                  <LiveTokenText
                    align="left"
                    selector={livePriceChangeSelector}
                    tokenId={tokenId}
                    initialValueLastUpdated={0}
                    initialValue={formatPriceChange(market.priceChange['24h'])}
                    autoSubscriptionEnabled={false}
                    isPriceChangeColorEnabled
                    priceChangeChangeColors={PRICE_CHANGE_COLORS}
                    color={{ custom: initialChangeColor }}
                    size="17pt"
                    weight="heavy"
                  />
                </View>

                <View style={styles.leverageRow}>
                  <Text size="15pt" weight="bold" color="labelQuaternary">
                    {i18n.t(i18n.l.perps.up_to)}
                  </Text>
                  <View
                    style={[
                      styles.leveragePill,
                      {
                        backgroundColor: accentColors.opacity10,
                        borderColor: accentColors.opacity12,
                      },
                    ]}
                  >
                    <Text size="13pt" weight="heavy" color={{ custom: accentColor }} align="center">
                      {`${market.maxLeverage}x`}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ConditionalWrap>
      </ConditionalWrap>
    </ButtonPressAnimation>
  );
});

function livePriceSelector(state: TokenData): string {
  return formatPerpAssetPrice(state.midPrice ?? state.price);
}

function livePriceChangeSelector(state: TokenData): string {
  return formatPriceChange(state.change.change24hPct);
}

const styles = StyleSheet.create({
  cardInner: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 17,
    paddingVertical: 17,
  },
  changeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  clip: {
    borderRadius: 32,
    height: CARD_HEIGHT,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    gap: 13,
    justifyContent: 'center',
  },
  iconBorder: {
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: 2,
    height: 60,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 60,
  },
  leftColumn: {
    flex: 1,
    minWidth: 0,
  },
  leveragePill: {
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: 1.33,
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  leverageRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  shadowHost: {
    borderRadius: 32,
    height: CARD_HEIGHT,
  },
  symbolRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 4,
  },
});
