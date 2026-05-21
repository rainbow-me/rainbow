import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { useLiveTokenSharedValue, useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';
import { AnimatedText, Box, Text, useColorMode } from '@/design-system';
import { SparklineChart } from '@/features/charts/line/components/SparklineChart';
import { CarouselCardSkeleton } from '@/features/discover/components/carousel/CarouselCardSkeleton';
import { CarouselHeader } from '@/features/discover/components/carousel/CarouselHeader';
import { LargePerpMarketsCarousel } from '@/features/discover/components/carousels/LargePerpMarketsCarousel';
import { PerpMarketPillsCarousel } from '@/features/discover/components/carousels/PerpMarketPillsCarousel';
import { TaggedPolymarketCarousel } from '@/features/discover/components/carousels/TaggedPolymarketCarousel';
import { buildPerpMarketBaseDisplay, type PriceChangeColors } from '@/features/discover/components/perpMarketCards/perpMarketCardChrome';
import { PerpMarketIcon } from '@/features/discover/components/perpMarketCards/PerpMarketIcon';
import { PerpPriceChange } from '@/features/discover/components/perpMarketCards/PerpPriceChange';
import { usePerpMarketPress } from '@/features/discover/components/perpMarketCards/usePerpMarketPress';
import { SCREEN_HORIZONTAL_PADDING } from '@/features/discover/constants';
import { navigateToPolymarketCategory } from '@/features/discover/utils/navigation';
import { useHyperliquidLineChartsStore } from '@/features/perps/stores/hyperliquidLineChartsStore';
import { getHyperliquidTokenId } from '@/features/perps/utils';
import { formatPerpAssetPrice, selectFormattedMarkPrice } from '@/features/perps/utils/formatPerpsAssetPrice';
import { extractBaseSymbol } from '@/features/perps/utils/hyperliquidSymbols';
import { navigateToPerpsSearch } from '@/features/perps/utils/navigateToPerps';
import { PLACEMENT_IDS } from '@/features/placements/constants';
import {
  usePerpsCommoditiesPlacementStore,
  usePerpsIndicesPlacementStore,
  usePerpsStocksNewPlacementStore,
  usePerpsStocksPlacementStore,
  type PerpMarketPlacementItem,
} from '@/features/placements/stores/derived/perpsPlacementStore';
import { CATEGORIES } from '@/features/polymarket/constants';
import { opacity } from '@/framework/ui/utils/opacity';
import * as i18n from '@/languages';
import { type TokenData } from '@/state/liveTokens/liveTokensStore';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { getHighContrastTextColorWorklet } from '@/worklets/colors';

const NEW_MARKET_ROW_HEIGHT = 76;
const NEW_MARKET_ICON_SIZE = 40;
const NEW_MARKET_ROW_PREVIEW_COUNT = 5;
const NEW_MARKET_ROW_WIDTH = DEVICE_WIDTH - SCREEN_HORIZONTAL_PADDING * 2;
const NEW_MARKET_SPARKLINE_LAYOUT = { height: 34, width: 64 };

export function MarketsPage() {
  return (
    <View style={styles.container}>
      <IndicesCarousel />
      <CommoditiesCarousel />
      <StocksCarousel />
      <NewMarketsCarousel />
      <TaggedPolymarketCarousel
        onPressSeeAll={() => navigateToPolymarketCategory(CATEGORIES.finance.tagId)}
        tagSlug={CATEGORIES.finance.tagId}
        title="Predictions"
      />
    </View>
  );
}

function IndicesCarousel() {
  const { isLoading, items, placement } = usePerpsIndicesPlacementStore();
  return (
    <LargePerpMarketsCarousel
      isLoading={isLoading}
      items={items}
      onPressSeeAll={navigateToPerpsSearch}
      placement={placement}
      placementId={PLACEMENT_IDS.PERPS_INDICES}
      showHeaderCaret={false}
      title={i18n.t(i18n.l.discover.placements.indices_title)}
    />
  );
}

function CommoditiesCarousel() {
  const { isLoading, items, placement } = usePerpsCommoditiesPlacementStore();
  return (
    <LargePerpMarketsCarousel
      isLoading={isLoading}
      items={items}
      onPressSeeAll={navigateToPerpsSearch}
      placement={placement}
      placementId={PLACEMENT_IDS.PERPS_COMMODITIES}
      showHeaderCaret={false}
      title={i18n.t(i18n.l.discover.placements.commodities_title)}
    />
  );
}

function StocksCarousel() {
  const { isLoading, items, placement } = usePerpsStocksPlacementStore();
  return (
    <PerpMarketPillsCarousel
      isLoading={isLoading}
      items={items}
      onPressSeeAll={navigateToPerpsSearch}
      placement={placement}
      placementId={PLACEMENT_IDS.PERPS_STOCKS}
      showHeaderCaret={false}
      title="Stocks"
    />
  );
}

function NewMarketsCarousel() {
  const { isLoading, items } = usePerpsStocksNewPlacementStore();
  if (!isLoading && !items.length) return null;

  return (
    <Box gap={20}>
      <CarouselHeader title="New" onPress={navigateToPerpsSearch} />
      <View style={styles.newMarketsList}>
        {isLoading && !items.length
          ? Array.from({ length: 3 }).map((_, index) => <NewMarketRowSkeleton key={index} />)
          : items.slice(0, NEW_MARKET_ROW_PREVIEW_COUNT).map(item => <NewMarketRow key={item.ref.id} item={item} />)}
      </View>
    </Box>
  );
}

function NewMarketRow({ item }: { item: PerpMarketPlacementItem }) {
  const { colorMode, isDarkMode } = useColorMode();
  const { accentColor, iconUrl, priceChangeColors } = useMemo(
    () => buildPerpMarketBaseDisplay(item.market, colorMode),
    [colorMode, item.market]
  );
  const displayName = extractBaseSymbol(item.market.baseSymbol);
  const symbol = item.market.symbol;
  const initialPrice = useMemo(
    () => formatPerpAssetPrice(item.market.midPrice ?? item.market.price),
    [item.market.midPrice, item.market.price]
  );
  const initialPriceChange = item.market.priceChange['24h'];
  const tokenId = getHyperliquidTokenId(symbol);
  const livePrice = useLiveTokenSharedValue({
    initialValue: initialPrice,
    selector: selectFormattedMarkPrice,
    tokenId,
  });
  const livePriceChange = useLiveTokenValue({
    initialValue: initialPriceChange,
    selector: selectLivePriceChange24h,
    tokenId,
  });
  const onPress = usePerpMarketPress(item.market);
  const priceChangeColor = getPerpPriceChangeColor(livePriceChange, priceChangeColors);

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.96}>
      <View style={[styles.newMarketRow, { backgroundColor: opacity('#202429', 0.4) }]}>
        <LinearGradient
          colors={[opacity(accentColor, isDarkMode ? 0.16 : 0.06), opacity(accentColor, 0)]}
          end={{ x: 1, y: 1 }}
          pointerEvents="none"
          start={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <PerpMarketIcon
          accentColor={accentColor}
          badgePosition="top-right"
          badgeBorderColor={isDarkMode ? 'rgba(255, 255, 255, 0.24)' : 'rgba(0, 0, 0, 0.07)'}
          baseSymbol={displayName}
          borderColor={accentColor}
          fallbackTextSize="13pt"
          iconUrl={iconUrl}
          leverage={item.market.maxLeverage}
          badgeShadowColor={isDarkMode ? '#000000' : accentColor}
          badgeShadowOpacity={isDarkMode ? 0.5 : 0.25}
          badgeTextColor={getHighContrastTextColorWorklet(accentColor, 4)}
          size={NEW_MARKET_ICON_SIZE}
        />
        <View style={styles.newMarketTextColumn}>
          <Text color="label" numberOfLines={1} size="17pt" weight="heavy">
            {displayName}
          </Text>
          <View style={styles.newMarketPriceRow}>
            <AnimatedText color="labelSecondary" numberOfLines={1} size="15pt" weight="bold">
              {livePrice}
            </AnimatedText>
            <View style={styles.newMarketChangeRow}>
              <PerpPriceChange
                arrowHeight={8}
                arrowSize="icon 12px"
                arrowWidth={12}
                initialPriceChange={initialPriceChange}
                priceChangeColors={priceChangeColors}
                symbol={symbol}
                textSize="15pt"
              />
            </View>
          </View>
        </View>
        <View pointerEvents="none" style={styles.newMarketSparklineContainer}>
          <SparklineChart
            chartId={symbol}
            color={priceChangeColor}
            height={NEW_MARKET_SPARKLINE_LAYOUT.height}
            store={useHyperliquidLineChartsStore}
            width={NEW_MARKET_SPARKLINE_LAYOUT.width}
          />
        </View>
      </View>
    </ButtonPressAnimation>
  );
}

function NewMarketRowSkeleton() {
  return <CarouselCardSkeleton borderRadius={24} height={NEW_MARKET_ROW_HEIGHT} width={NEW_MARKET_ROW_WIDTH} />;
}

function selectLivePriceChange24h(state: TokenData): string {
  return state.change.change24hPct;
}

function getPerpPriceChangeColor(priceChange: string, priceChangeColors: PriceChangeColors): string {
  return Number(priceChange) >= 0 ? priceChangeColors.positive : priceChangeColors.negative;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 32,
    paddingTop: 20,
  },
  newMarketsList: {
    gap: 8,
    paddingHorizontal: SCREEN_HORIZONTAL_PADDING,
  },
  newMarketRow: {
    alignItems: 'center',
    borderRadius: 24,
    flexDirection: 'row',
    gap: 12,
    height: NEW_MARKET_ROW_HEIGHT,
    overflow: 'hidden',
    paddingHorizontal: 12,
  },
  newMarketTextColumn: {
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  newMarketPriceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  newMarketChangeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  newMarketSparklineContainer: {
    alignItems: 'flex-end',
    width: NEW_MARKET_SPARKLINE_LAYOUT.width,
  },
});
