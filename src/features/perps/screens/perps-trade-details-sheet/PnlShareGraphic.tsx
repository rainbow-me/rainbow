import { forwardRef, memo, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  Image,
  ImageBackground,
  PixelRatio,
  StyleSheet,
  View,
  Text,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Box, globalColors } from '@/design-system';
import { captureRef } from 'react-native-view-shot';
import greenArrowsBackground from '../../assets/pnl-share/green-arrows-background.png';
import redArrowsBackground from '../../assets/pnl-share/red-arrows-background.png';
import profitCharacter1 from '../../assets/pnl-share/profit-character-1.png';
import profitCharacter2 from '../../assets/pnl-share/profit-character-2.png';
import profitCharacter3 from '../../assets/pnl-share/profit-character-3.png';
import profitCharacter4 from '../../assets/pnl-share/profit-character-4.png';
import profitCharacter5 from '../../assets/pnl-share/profit-character-5.png';
import profitCharacter6 from '../../assets/pnl-share/profit-character-6.png';
import lossCharacter1 from '../../assets/pnl-share/loss-character-1.png';
import lossCharacter2 from '../../assets/pnl-share/loss-character-2.png';
import lossCharacter3 from '../../assets/pnl-share/loss-character-3.png';
import lossCharacter4 from '../../assets/pnl-share/loss-character-4.png';
import lossCharacter5 from '../../assets/pnl-share/loss-character-5.png';
import lossCharacter6 from '../../assets/pnl-share/loss-character-6.png';
import * as i18n from '@/languages';
import { opacity } from '@/framework/ui/utils/opacity';
import { THICK_BORDER_WIDTH } from '@/styles/constants';
import { PERPS_COLORS } from '@/features/perps/constants';
import { PANEL_WIDTH } from '@/components/PanelSheet/PanelSheet';
import { extractBaseSymbol } from '@/features/perps/utils/hyperliquidSymbols';
import { formatPerpAssetPrice } from '@/features/perps/utils/formatPerpsAssetPrice';
import { calculateTradePnlPercentage } from '@/features/perps/utils/calculateTradePnlPercentage';
import { useHyperliquidMarketsStore } from '@/features/perps/stores/hyperliquidMarketsStore';
import { type HlTrade } from '@/features/perps/types';
import { LinearGradient } from 'expo-linear-gradient';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';
import rainbowTextLogo from '@/assets/rainbowTextLogo.png';
import rainbowPlainLogo from '@/assets/rainbows/plain.png';

const ASPECT_RATIO = 16 / 9;
const DESIGN_REFERENCE_WIDTH = 366;
const DESIGN_REFERENCE_HEIGHT = DESIGN_REFERENCE_WIDTH / ASPECT_RATIO;
const CAPTURE_TEMPLATE_WIDTH = 1200;
const CAPTURE_TEMPLATE_HEIGHT = CAPTURE_TEMPLATE_WIDTH / ASPECT_RATIO;
const CAPTURE_SCALE = 1 / PixelRatio.get();
const CAPTURE_WIDTH = CAPTURE_TEMPLATE_WIDTH * CAPTURE_SCALE;
const CAPTURE_HEIGHT = CAPTURE_TEMPLATE_HEIGHT * CAPTURE_SCALE;
const SF_FONT_FAMILY = 'SF Pro Rounded';
const PROFIT_COLOR = PERPS_COLORS.longGreen;
const SHARE_CARD_SIDE_PEEK = 24;
const SHARE_CARD_WIDTH = PANEL_WIDTH - SHARE_CARD_SIDE_PEEK * 2;
const SHARE_CARD_GAP = 8;
const SHARE_CARD_SNAP_INTERVAL = SHARE_CARD_WIDTH + SHARE_CARD_GAP;
const SHARE_CAROUSEL_WIDTH = SHARE_CARD_WIDTH + SHARE_CARD_SIDE_PEEK * 2;
const INITIAL_CHARACTER_INDEX = 0;

const PROFIT_CHARACTER_IMAGES = [
  profitCharacter1,
  profitCharacter2,
  profitCharacter3,
  profitCharacter4,
  profitCharacter5,
  profitCharacter6,
];
const LOSS_CHARACTER_IMAGES = [lossCharacter1, lossCharacter2, lossCharacter3, lossCharacter4, lossCharacter5, lossCharacter6];

function getCharacterImages(isPositivePnl: boolean) {
  return isPositivePnl ? PROFIT_CHARACTER_IMAGES : LOSS_CHARACTER_IMAGES;
}

type PnlShareImageProps = {
  pnlPercentage: number;
  assetSymbol: string;
  assetImageUrl?: string;
  leverage: number;
  entryPrice: string;
  markPrice: string;
  isLong: boolean;
  width: number;
  characterImage: ImageSourcePropType;
  includeDisplay?: boolean;
  includeCapture?: boolean;
};

type PnlShareContentProps = Omit<PnlShareImageProps, 'width' | 'includeDisplay' | 'includeCapture'> & {
  scale: number;
};

export type PnlShareImageHandle = {
  capture: () => Promise<string>;
};

function createScaler(scale: number) {
  return (value: number) => value * scale;
}

function PnlShareContent({
  assetImageUrl,
  pnlPercentage,
  assetSymbol,
  leverage,
  entryPrice,
  markPrice,
  isLong,
  characterImage,
  scale,
}: PnlShareContentProps) {
  const isPositivePnl = pnlPercentage >= 0;
  const pnlColor = isPositivePnl ? PROFIT_COLOR : PERPS_COLORS.shortRed;
  const leverageText = `${leverage}x ${i18n.t(isLong ? i18n.l.perps.position_side.long : i18n.l.perps.position_side.short).toUpperCase()}`;
  const backgroundImage = isPositivePnl ? greenArrowsBackground : redArrowsBackground;
  const characterAspectRatio = useMemo(() => {
    const resolvedSource = Image.resolveAssetSource(characterImage);
    return resolvedSource.width / resolvedSource.height;
  }, [characterImage]);
  const s = useMemo(() => createScaler(scale), [scale]);

  const scaledStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: s(DESIGN_REFERENCE_WIDTH),
          height: s(DESIGN_REFERENCE_HEIGHT),
          overflow: 'hidden',
        },
        contentContainer: {
          ...StyleSheet.absoluteFillObject,
          padding: s(14),
        },
        characterContainer: {
          position: 'absolute',
          top: 0,
          right: 0,
        },
        characterImage: {
          height: s(DESIGN_REFERENCE_HEIGHT),
          aspectRatio: characterAspectRatio,
        },
        appIconAndNameContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: s(8),
        },
        appIcon: {
          height: s(16),
          width: s(16),
        },
        assetImage: {
          height: s(24),
          width: s(24),
          borderRadius: s(12),
        },
        assetFallbackCircle: {
          width: s(24),
          height: s(24),
          borderRadius: s(12),
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          justifyContent: 'center',
          alignItems: 'center',
        },
        assetFallbackText: {
          fontSize: s(15),
          fontWeight: '700',
          color: 'white',
          fontFamily: SF_FONT_FAMILY,
        },
        assetSymbolText: {
          fontSize: s(15),
          fontWeight: '900',
          color: 'white',
          fontFamily: SF_FONT_FAMILY,
        },
        pnlText: {
          fontSize: s(34),
          fontWeight: '900',
          letterSpacing: s(0.38),
          fontFamily: SF_FONT_FAMILY,
        },
        pricesContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: s(12),
        },
        priceContainer: {
          gap: s(4),
        },
        priceLabelText: {
          fontSize: s(13),
          fontWeight: '700',
          color: opacity('#F5F8FF', 0.56),
          fontFamily: SF_FONT_FAMILY,
        },
        priceValueText: {
          fontSize: s(15),
          fontWeight: '900',
          color: 'white',
          fontFamily: SF_FONT_FAMILY,
        },
        leverageText: {
          fontSize: s(15),
          fontWeight: '900',
          color: 'white',
          fontFamily: SF_FONT_FAMILY,
        },
      }),
    [characterAspectRatio, s]
  );

  return (
    <Box
      style={scaledStyles.container}
      borderWidth={s(THICK_BORDER_WIDTH)}
      borderColor={{ custom: opacity(globalColors.white100, 0.07) }}
      borderRadius={s(20)}
      backgroundColor={'#18191B'}
    >
      <LinearGradient
        colors={[pnlColor, opacity(pnlColor, 0)]}
        style={[StyleSheet.absoluteFill, { opacity: 0.2 }]}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0.17 }}
      />
      <ImageBackground source={backgroundImage} style={StyleSheet.absoluteFill} resizeMode="cover">
        <View style={scaledStyles.characterContainer}>
          <Image source={characterImage} style={scaledStyles.characterImage} resizeMode="contain" />
        </View>
        <Box style={scaledStyles.contentContainer}>
          <Box flexGrow={1} justifyContent="space-between">
            <View style={scaledStyles.appIconAndNameContainer}>
              <Image source={rainbowPlainLogo} style={scaledStyles.appIcon} />
              <Image source={rainbowTextLogo} style={{ width: s(63), height: s(12) }} />
            </View>
            <Box gap={s(4)}>
              <Box flexDirection="row" gap={s(12)} alignItems="center">
                <Box height={s(24)} gap={s(6)} alignItems="center" flexDirection="row">
                  {assetImageUrl ? (
                    <View style={[scaledStyles.assetImage]}>
                      <Image source={{ uri: assetImageUrl }} style={scaledStyles.assetImage} />
                      <InnerShadow borderRadius={s(12)} color={opacity(globalColors.white100, 0.28)} blur={2.5} dx={0} dy={1} />
                    </View>
                  ) : (
                    <View style={scaledStyles.assetFallbackCircle}>
                      <Text style={scaledStyles.assetFallbackText}>{assetSymbol.slice(0, 1)}</Text>
                    </View>
                  )}
                  <Text style={scaledStyles.assetSymbolText}>{assetSymbol}</Text>
                </Box>
                <Box
                  backgroundColor={isLong ? PERPS_COLORS.longGreen : PERPS_COLORS.shortRed}
                  borderWidth={s(2.33)}
                  borderColor={{ custom: opacity(globalColors.white100, 0.12) }}
                  borderRadius={s(12)}
                  paddingHorizontal={{ custom: s(8) }}
                  height={s(24)}
                  alignItems="center"
                  justifyContent="center"
                >
                  <InnerShadow borderRadius={s(12)} color={opacity(globalColors.white100, 0.28)} blur={2.5} dx={0} dy={1} />
                  <Text style={scaledStyles.leverageText}>{leverageText}</Text>
                </Box>
              </Box>
              <Text
                style={[
                  scaledStyles.pnlText,
                  {
                    color: pnlColor,
                    textShadowColor: isPositivePnl ? 'rgba(44, 219, 79, 0.42)' : 'rgba(219, 44, 44, 0.42)',
                  },
                ]}
              >
                {`${isPositivePnl ? '+' : ''}${pnlPercentage}%`}
              </Text>
            </Box>

            <View style={scaledStyles.pricesContainer}>
              <View style={scaledStyles.priceContainer}>
                <Text style={scaledStyles.priceLabelText}>{i18n.t(i18n.l.perps.positions.open)}</Text>
                <Text style={scaledStyles.priceValueText}>{entryPrice}</Text>
              </View>
              <View style={scaledStyles.priceContainer}>
                <Text style={scaledStyles.priceLabelText}>{i18n.t(i18n.l.perps.positions.close)}</Text>
                <Text style={scaledStyles.priceValueText}>{markPrice}</Text>
              </View>
            </View>
          </Box>
        </Box>
      </ImageBackground>
    </Box>
  );
}

export const PnlShareImage = memo(
  forwardRef<PnlShareImageHandle, PnlShareImageProps>(function PnlShareImage(props, ref) {
    const viewRef = useRef<View>(null);
    const { width, includeDisplay = true, includeCapture = true, ...contentProps } = props;
    const height = width / ASPECT_RATIO;
    const displayScale = width / DESIGN_REFERENCE_WIDTH;
    const captureScale = CAPTURE_WIDTH / DESIGN_REFERENCE_WIDTH;

    const containerStyles = useMemo(
      () =>
        StyleSheet.create({
          displayContainer: {
            width,
            height,
            overflow: 'hidden',
          },
          captureContainer: {
            width: CAPTURE_WIDTH,
            height: CAPTURE_HEIGHT,
            position: 'absolute',
            left: -9999,
          },
        }),
      [height, width]
    );

    useImperativeHandle(
      ref,
      () => ({
        capture: async () => {
          if (!includeCapture) {
            throw new Error('PnlShareImage capture is disabled for this instance');
          }
          const captureTarget = viewRef.current;
          if (!captureTarget) {
            throw new Error('PnlShareImage capture target is not mounted');
          }

          return captureRef(captureTarget, {
            useRenderInContext: true,
            format: 'png',
            quality: 1,
          });
        },
      }),
      [includeCapture]
    );

    return (
      <>
        {includeDisplay && (
          <Box style={containerStyles.displayContainer}>
            <PnlShareContent
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...contentProps}
              scale={displayScale}
            />
          </Box>
        )}

        {includeCapture && (
          <View ref={viewRef} style={containerStyles.captureContainer} collapsable={false}>
            <PnlShareContent
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...contentProps}
              scale={captureScale}
            />
          </View>
        )}
      </>
    );
  })
);

PnlShareImage.displayName = 'PnlShareImage';

export const PnlShareGraphic = memo(function PnlShareGraphic({
  trade,
  pnlShareImageRef,
}: {
  trade: HlTrade;
  pnlShareImageRef: React.RefObject<PnlShareImageHandle | null>;
}) {
  const market = useHyperliquidMarketsStore(state => state.getMarket(trade.symbol));
  const leverage = trade.leverage ?? market?.maxLeverage ?? 1;
  const entryPrice = trade.entryPrice ?? trade.price;
  const assetImageUrl = market?.metadata?.iconUrl;

  const pnlPercentage = useMemo(() => {
    return calculateTradePnlPercentage({
      entryPrice,
      markPrice: trade.price,
      isLong: trade.isLong,
      leverage,
    });
  }, [entryPrice, leverage, trade.isLong, trade.price]);
  const isPositivePnl = pnlPercentage >= 0;
  const characterImages = getCharacterImages(isPositivePnl);
  const [activeCharacterIndex, setActiveCharacterIndex] = useState(INITIAL_CHARACTER_INDEX);
  const activeCharacterImage = characterImages[activeCharacterIndex];
  const formattedEntryPrice = useMemo(() => formatPerpAssetPrice(entryPrice), [entryPrice]);
  const formattedMarkPrice = useMemo(() => formatPerpAssetPrice(trade.price), [trade.price]);
  const assetSymbol = useMemo(() => extractBaseSymbol(trade.symbol), [trade.symbol]);

  const updateActiveIndex = useCallback(
    (offsetX: number) => {
      const rawIndex = Math.round(offsetX / SHARE_CARD_SNAP_INTERVAL);
      const nextIndex = Math.max(0, Math.min(characterImages.length - 1, rawIndex));
      setActiveCharacterIndex(prev => (prev === nextIndex ? prev : nextIndex));
    },
    [characterImages.length]
  );

  const handleScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const targetOffsetX = event.nativeEvent.targetContentOffset?.x;
      if (targetOffsetX != null) {
        updateActiveIndex(targetOffsetX);
      }
    },
    [updateActiveIndex]
  );

  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      updateActiveIndex(event.nativeEvent.contentOffset.x);
    },
    [updateActiveIndex]
  );

  return (
    <>
      <Box style={{ width: SHARE_CAROUSEL_WIDTH }}>
        <ScrollView
          horizontal
          bounces={false}
          alwaysBounceVertical={false}
          decelerationRate="fast"
          disableIntervalMomentum
          showsHorizontalScrollIndicator={false}
          snapToInterval={SHARE_CARD_SNAP_INTERVAL}
          contentContainerStyle={styles.scrollViewContainer}
          onScrollEndDrag={handleScrollEndDrag}
          onMomentumScrollEnd={handleMomentumScrollEnd}
        >
          {characterImages.map((characterImage, index) => (
            <PnlShareImage
              key={index}
              width={SHARE_CARD_WIDTH}
              pnlPercentage={pnlPercentage}
              assetSymbol={assetSymbol}
              assetImageUrl={assetImageUrl}
              leverage={leverage}
              entryPrice={formattedEntryPrice}
              markPrice={formattedMarkPrice}
              isLong={trade.isLong}
              characterImage={characterImage}
              includeCapture={false}
            />
          ))}
        </ScrollView>
      </Box>

      <PnlShareImage
        ref={pnlShareImageRef}
        width={SHARE_CARD_WIDTH}
        pnlPercentage={pnlPercentage}
        assetSymbol={assetSymbol}
        assetImageUrl={assetImageUrl}
        leverage={leverage}
        entryPrice={formattedEntryPrice}
        markPrice={formattedMarkPrice}
        isLong={trade.isLong}
        characterImage={activeCharacterImage}
        includeDisplay={false}
      />
    </>
  );
});

const styles = StyleSheet.create({
  scrollViewContainer: {
    paddingHorizontal: SHARE_CARD_SIDE_PEEK,
    gap: SHARE_CARD_GAP,
  },
});
