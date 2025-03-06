import {
  BackdropBlur,
  BlendColor,
  Blur,
  Circle,
  Group,
  Image,
  LinearGradient,
  Paint,
  Shadow,
  SkPath,
  point,
  useImage,
  vec,
} from '@shopify/react-native-skia';
import React, { memo, useCallback, useState } from 'react';
import { SkiaText } from '@/design-system';
import { globalColors } from '@/design-system/color/palettes';
import { getSizedImageUrl } from '@/handlers/imgix';
import { useCleanup } from '@/hooks/useCleanup';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useAirdropsStore } from '@/state/claimables/airdropsStore';
import { opacity } from '@/__swaps__/utils/swaps';
import { getCirclePath } from '@/worklets/skia';
import { DEFAULT_CARD_SIZE, SkiaCard, SkiaCardProps } from './SkiaCard';

const BADGE_SIZE = 28;
const COIN_ICON_TOP_INSET = 56;
const COIN_ICON_SIZE = 64;

// ============ Temporary ==================================================== //
const COIN_ICON_TEST_URLS = {
  one: getSizedImageUrl(
    'https://dd.dexscreener.com/ds-data/tokens/base/0xd93dc936e60e9e275cbe6f225e9c065951b9b1d4.png?size=lg&key=f43ffc',
    COIN_ICON_SIZE
  ),
  two: getSizedImageUrl(
    'https://dd.dexscreener.com/ds-data/tokens/base/0x5a34646b860485f012435e2486edb375615d1c7b.png?size=lg&key=0c7e85',
    COIN_ICON_SIZE
  ),
  three: getSizedImageUrl(
    'https://dd.dexscreener.com/ds-data/tokens/base/0x1035ae3f87a91084c6c5084d0615cc6121c5e228.png?size=lg&key=d73e1a',
    COIN_ICON_SIZE
  ),
  four: getSizedImageUrl(
    'https://dd.dexscreener.com/ds-data/tokens/base/0xba5e66fb16944da22a62ea4fd70ad02008744460.png?size=lg&key=82652d',
    COIN_ICON_SIZE
  ),
  five: getSizedImageUrl(
    'https://dd.dexscreener.com/ds-data/tokens/base/0x17d70172c7c4205bd39ce80f7f0ee660b7dc5a23.png?size=lg&key=33eb6e',
    COIN_ICON_SIZE
  ),
  six: getSizedImageUrl(
    'https://dd.dexscreener.com/ds-data/tokens/solana/G1UXAxnGttB8hQFRt35xvnimC3Y2Nm9pF8saWrHNpump.png?size=lg&key=d08cfb',
    COIN_ICON_SIZE
  ),
};
function getRandomIconUrl() {
  const random = Math.round(Math.random() * 7);
  switch (random) {
    case 0:
      return COIN_ICON_TEST_URLS.one;
    case 1:
      return COIN_ICON_TEST_URLS.two;
    case 2:
      return COIN_ICON_TEST_URLS.three;
    case 3:
      return COIN_ICON_TEST_URLS.four;
    case 4:
      return COIN_ICON_TEST_URLS.five;
    case 5:
    default:
      return COIN_ICON_TEST_URLS.six;
  }
}
function getNextIconUrl(currentUrl: string, airdropIconUrl: string | undefined) {
  switch (currentUrl) {
    case COIN_ICON_TEST_URLS.one:
      return COIN_ICON_TEST_URLS.two;
    case COIN_ICON_TEST_URLS.two:
      return COIN_ICON_TEST_URLS.three;
    case COIN_ICON_TEST_URLS.three:
      return COIN_ICON_TEST_URLS.four;
    case COIN_ICON_TEST_URLS.four:
      return COIN_ICON_TEST_URLS.five;
    case COIN_ICON_TEST_URLS.five:
      return COIN_ICON_TEST_URLS.six;
    case COIN_ICON_TEST_URLS.six:
      return airdropIconUrl ?? COIN_ICON_TEST_URLS.one;
    case airdropIconUrl:
    default:
      return COIN_ICON_TEST_URLS.one;
  }
}
// ============ End ========================================================== //

const CARD_CONFIG = {
  backgroundBlur: {
    size: DEFAULT_CARD_SIZE + 40,
    opacity: 1,
    radius: 25,
    yOffset: -20,
  },
  colors: {
    coinIconDropShadow: opacity(globalColors.grey100, 0.35),
    coinIconOuterCircle: opacity(globalColors.white100, 0.3),
  },
  dimensions: {
    badge: {
      size: BADGE_SIZE,
      x: DEFAULT_CARD_SIZE / 2 + COIN_ICON_SIZE / 2 - BADGE_SIZE / 2 + BADGE_SIZE / 3,
      y: DEFAULT_CARD_SIZE - 58.5,
    },
    textXOffset: (BADGE_SIZE + 8) / 2 - 0.5,
  },
  gradient: {
    colors: ['#1F6480', '#2288AD', '#2399C3', '#399EC6', '#518EAB', '#4E697B'],
    end: vec(DEFAULT_CARD_SIZE / 2, DEFAULT_CARD_SIZE),
    start: vec(DEFAULT_CARD_SIZE / 2, 0),
  },
};

const CARD_PROPS: Partial<SkiaCardProps> = {
  shadowColor: {
    dark: opacity(globalColors.grey100, 0.3),
    light: opacity(CARD_CONFIG.gradient.colors[CARD_CONFIG.gradient.colors.length - 1], 0.48),
  },
  strokeOpacity: { start: 0.12, end: 0.04 },
};

export const AirdropsCard = memo(function AirdropsCard() {
  const { navigate } = useNavigation();

  const [coinIconPath] = useState(() => getCoinIconPath());
  const [url, setUrl] = useState(() => getRandomIconUrl());

  const airdropIconUrl = useAirdropsStore(state => getSizedImageUrl(state.getData()?.claimables?.[0]?.asset?.icon_url));
  const coinIconImage = useImage(url);

  const onLongPress = useCallback(() => {
    setUrl(url => (url ? getNextIconUrl(url, airdropIconUrl) : getRandomIconUrl()));
  }, [airdropIconUrl]);

  const onPress = useCallback(() => {
    navigate(Routes.AIRDROPS_SHEET);
  }, [navigate]);

  useCleanup(() => coinIconPath?.dispose?.());
  useCleanup(() => coinIconImage?.dispose?.(), [coinIconImage]);

  return (
    <SkiaCard
      onLongPress={onLongPress}
      onPress={onPress}
      shadowColor={CARD_PROPS.shadowColor}
      skiaBackground={
        <Paint antiAlias dither>
          <LinearGradient colors={CARD_CONFIG.gradient.colors} end={CARD_CONFIG.gradient.end} start={CARD_CONFIG.gradient.start} />
          <BlendColor mode="plus" color={opacity(globalColors.white100, 0.08)} />
          <BlendColor mode="softLight" color={opacity(globalColors.grey100, 0.28)} />
        </Paint>
      }
      skiaForeground={
        <Group>
          {/* Blurred coin icon backdrop */}
          <Group blendMode="softLight">
            <Image
              fit="cover"
              height={CARD_CONFIG.backgroundBlur.size}
              image={coinIconImage}
              opacity={CARD_CONFIG.backgroundBlur.opacity}
              width={CARD_CONFIG.backgroundBlur.size}
              x={(DEFAULT_CARD_SIZE - CARD_CONFIG.backgroundBlur.size) / 2}
              y={CARD_CONFIG.backgroundBlur.yOffset}
            />
            <Blur blur={CARD_CONFIG.backgroundBlur.radius} />
          </Group>

          {/* Coin icon drop shadow */}
          <Circle color={CARD_CONFIG.colors.coinIconOuterCircle} cx={DEFAULT_CARD_SIZE / 2} cy={COIN_ICON_TOP_INSET} r={COIN_ICON_SIZE / 2}>
            <Paint antiAlias blendMode="overlay" dither>
              <Shadow blur={15} color={CARD_CONFIG.colors.coinIconDropShadow} dx={0} dy={10} shadowOnly />
            </Paint>
          </Circle>

          {/* Coin icon image */}
          <Image
            clip={coinIconPath}
            fit="cover"
            height={COIN_ICON_SIZE}
            image={coinIconImage}
            width={COIN_ICON_SIZE}
            x={DEFAULT_CARD_SIZE / 2 - COIN_ICON_SIZE / 2}
            y={COIN_ICON_TOP_INSET - COIN_ICON_SIZE / 2}
          />

          {/* Coin icon inner shadows */}
          <Circle color="transparent" cx={DEFAULT_CARD_SIZE / 2} cy={COIN_ICON_TOP_INSET} r={COIN_ICON_SIZE / 2}>
            <Paint antiAlias dither>
              <Shadow blur={2} color={opacity(globalColors.grey100, 0.3)} dx={0} dy={-1.5} inner shadowOnly />
              <Shadow blur={1.25} color={opacity(globalColors.white100, 0.8)} dx={0} dy={1.5} inner shadowOnly />
            </Paint>
          </Circle>

          {/* Number of airdrops bubble */}
          <Group transform={[{ translateX: -95 + CARD_CONFIG.dimensions.textXOffset }]}>
            <Circle
              blendMode="softLight"
              color={opacity(globalColors.white100, 0.8)}
              cx={CARD_CONFIG.dimensions.badge.x}
              cy={CARD_CONFIG.dimensions.badge.y}
              r={BADGE_SIZE / 2}
            >
              <BackdropBlur blur={20} />
            </Circle>

            <Circle
              color={opacity(globalColors.white100, 0.15)}
              cx={CARD_CONFIG.dimensions.badge.x}
              cy={CARD_CONFIG.dimensions.badge.y}
              r={BADGE_SIZE / 2}
            >
              <Shadow blur={6} color={opacity(globalColors.grey100, 1)} dx={0} dy={8} shadowOnly />
              <Paint antiAlias dither>
                <Shadow blur={4} color={opacity(globalColors.white100, 0.6)} dx={0} dy={3} inner shadowOnly />
                <Shadow blur={1.25} color={opacity(globalColors.white100, 0.8)} dx={0} dy={1.5} inner shadowOnly />
              </Paint>
            </Circle>

            <SkiaText
              align="center"
              color={{ custom: globalColors.white100 }}
              lineHeight={26}
              size="20pt"
              weight="heavy"
              width={BADGE_SIZE}
              x={DEFAULT_CARD_SIZE / 2 + COIN_ICON_SIZE / 2 - BADGE_SIZE / 2 + BADGE_SIZE / 3 - BADGE_SIZE / 2}
              y={CARD_CONFIG.dimensions.badge.y - CARD_CONFIG.dimensions.badge.size / 2}
            >
              8
            </SkiaText>
          </Group>

          {/* Card text */}
          <SkiaText
            align="center"
            color={{ custom: globalColors.white100 }}
            size="22pt"
            weight="heavy"
            width={DEFAULT_CARD_SIZE}
            x={CARD_CONFIG.dimensions.textXOffset}
            y={DEFAULT_CARD_SIZE - 73}
          >
            Airdrops
          </SkiaText>

          <SkiaText
            align="center"
            color="labelSecondary"
            letterSpacing={0.6}
            size="11pt"
            weight="heavy"
            width={DEFAULT_CARD_SIZE}
            x={0}
            y={DEFAULT_CARD_SIZE - 36}
          >
            AVAILABLE TO CLAIM
          </SkiaText>
        </Group>
      }
      strokeOpacity={CARD_PROPS.strokeOpacity}
    />
  );
});

function getCoinIconPath(): SkPath {
  return getCirclePath(point(DEFAULT_CARD_SIZE / 2, COIN_ICON_TOP_INSET), COIN_ICON_SIZE / 2 - 4);
}
