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
  SkParagraph,
  SkPath,
  point,
  useImage,
  vec,
} from '@shopify/react-native-skia';
import React, { memo, useCallback, useState } from 'react';
import { useAnimatedReaction, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { SkiaText } from '@/design-system';
import { globalColors } from '@/design-system/color/palettes';
import { useCleanup } from '@/hooks/useCleanup';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useAirdropsStore } from '@/state/claimables/airdropsStore';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { opacity } from '@/__swaps__/utils/swaps';
import { getCirclePath } from '@/worklets/skia';
import { DEFAULT_CARD_SIZE, SkiaCard, SkiaCardProps } from './SkiaCard';

const BADGE_SIZE = 28;
const BADGE_X_OFFSET = (BADGE_SIZE + 8) / 2 - 0.5;
const CARD_HEIGHT = 175;
const COIN_ICON_SIZE = 64;
const COIN_ICON_TOP_INSET = 56;

const CARD_CONFIG = {
  backgroundBlur: {
    size: DEFAULT_CARD_SIZE + 40,
    opacity: 1,
    radius: 25,
    yOffset: -20,
  },
  colors: {
    black28: opacity(globalColors.grey100, 0.28),
    black30: opacity(globalColors.grey100, 0.3),
    coinIconDropShadow: opacity(globalColors.grey100, 0.35),
    coinIconOuterCircle: opacity(globalColors.white100, 0.3),
    white08: opacity(globalColors.white100, 0.08),
    white15: opacity(globalColors.white100, 0.15),
    white60: opacity(globalColors.white100, 0.6),
    white80: opacity(globalColors.white100, 0.8),
    whiteTextColor: { custom: globalColors.white100 },
  },
  dimensions: {
    badge: {
      lineHeight: (numberOfAirdrops: number | null) => (!numberOfAirdrops || numberOfAirdrops < 10 ? 26 : numberOfAirdrops < 100 ? 24 : 22),
      size: BADGE_SIZE,
      textSize: (numberOfAirdrops: number | null) =>
        !numberOfAirdrops || numberOfAirdrops < 10 ? '20pt' : numberOfAirdrops < 100 ? '13pt' : '11pt',
      translateX: [{ translateX: BADGE_X_OFFSET - 95 }],
      x: DEFAULT_CARD_SIZE / 2 + COIN_ICON_SIZE / 2 - BADGE_SIZE / 2 + BADGE_SIZE / 3,
      y: CARD_HEIGHT - 58.5,
    },
    textXOffset: BADGE_X_OFFSET,
  },
  gradient: {
    colors: ['#1F6480', '#2288AD', '#2399C3', '#399EC6', '#518EAB', '#4E697B'],
    end: vec(DEFAULT_CARD_SIZE / 2, CARD_HEIGHT),
    start: vec(DEFAULT_CARD_SIZE / 2, 0),
  },
};

const CARD_PROPS: Partial<SkiaCardProps> = {
  shadowColor: {
    dark: CARD_CONFIG.colors.black30,
    light: opacity(CARD_CONFIG.gradient.colors[CARD_CONFIG.gradient.colors.length - 1], 0.48),
  },
  strokeOpacity: { start: 0.12, end: 0.04 },
};

export const AirdropsCard = memo(function AirdropsCard() {
  const { navigate } = useNavigation();
  const [coinIconPath] = useState(() => getCoinIconPath());

  const url = useAirdropsStore(state => state.getFirstCoinIconUrl(COIN_ICON_SIZE));
  const numberOfAirdrops = useAirdropsStore(state => state.getNumberOfAirdrops());
  const coinIconImage = useImage(url);

  const animatedActiveSwipeRoute = useNavigationStore(state => state.animatedActiveSwipeRoute);
  const shouldPlayEnterAnimation = useSharedValue(false);
  const badgeOffset = useSharedValue<[{ translateX: number }] | undefined>(undefined);

  const enterAnimation = useDerivedValue(() => (shouldPlayEnterAnimation.value ? withSpring(0, SPRING_CONFIGS.tabGestureConfig) : -2250));
  const enterAnimationTransform = useDerivedValue(() => [
    { translateY: enterAnimation.value },
    { scaleY: enterAnimation.value > 0 ? 1 - enterAnimation.value / 150 : 1 },
  ]);

  const onPress = useCallback(() => {
    const { getAirdrops, getNumberOfAirdrops } = useAirdropsStore.getState();
    if (getNumberOfAirdrops() === 1) navigate(Routes.CLAIM_AIRDROP_SHEET, { claimable: getAirdrops()?.[0] });
    else navigate(Routes.AIRDROPS_SHEET);
  }, [navigate]);

  const setBadgePosition = useCallback(
    (paragraph: SkParagraph) => {
      'worklet';
      const [{ x }] = paragraph.getLineMetrics();
      badgeOffset.value = [{ translateX: x - BADGE_X_OFFSET }];
    },
    [badgeOffset]
  );

  useAnimatedReaction(
    () => animatedActiveSwipeRoute.value === Routes.DISCOVER_SCREEN,
    (shouldTrigger, prevShouldTrigger) => {
      if (prevShouldTrigger === null || prevShouldTrigger === shouldTrigger) return;
      if (shouldTrigger) shouldPlayEnterAnimation.value = true;
      else shouldPlayEnterAnimation.value = false;
    },
    []
  );

  useCleanup(() => coinIconImage?.dispose?.(), [coinIconImage]);
  useCleanup(() => coinIconPath?.dispose?.());

  return (
    <SkiaCard
      height={CARD_HEIGHT}
      width={DEFAULT_CARD_SIZE}
      onPress={onPress}
      shadowColor={CARD_PROPS.shadowColor}
      skiaBackground={
        <Paint antiAlias dither>
          <LinearGradient colors={CARD_CONFIG.gradient.colors} end={CARD_CONFIG.gradient.end} start={CARD_CONFIG.gradient.start} />
          <BlendColor mode="plus" color={CARD_CONFIG.colors.white08} />
          <BlendColor mode="softLight" color={CARD_CONFIG.colors.black28} />
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
          <Circle
            color={CARD_CONFIG.colors.coinIconOuterCircle}
            cx={DEFAULT_CARD_SIZE / 2}
            cy={COIN_ICON_TOP_INSET}
            r={COIN_ICON_SIZE / 2}
            transform={enterAnimationTransform}
          >
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
            transform={enterAnimationTransform}
            width={COIN_ICON_SIZE}
            x={DEFAULT_CARD_SIZE / 2 - COIN_ICON_SIZE / 2}
            y={COIN_ICON_TOP_INSET - COIN_ICON_SIZE / 2}
          />

          {/* Coin icon inner shadows */}
          <Circle
            color="transparent"
            cx={DEFAULT_CARD_SIZE / 2}
            cy={COIN_ICON_TOP_INSET}
            r={COIN_ICON_SIZE / 2}
            transform={enterAnimationTransform}
          >
            <Paint antiAlias dither>
              <Shadow blur={2} color={CARD_CONFIG.colors.black30} dx={0} dy={-1.5} inner shadowOnly />
              <Shadow blur={1.25} color={CARD_CONFIG.colors.white80} dx={0} dy={1.5} inner shadowOnly />
            </Paint>
          </Circle>

          {/* Number of airdrops bubble */}
          <Group transform={badgeOffset}>
            <Circle
              blendMode="softLight"
              color={CARD_CONFIG.colors.white80}
              cx={CARD_CONFIG.dimensions.badge.size / 2}
              cy={CARD_CONFIG.dimensions.badge.y}
              r={BADGE_SIZE / 2}
            >
              <BackdropBlur blur={20} />
            </Circle>

            <Circle
              color={CARD_CONFIG.colors.white15}
              cx={CARD_CONFIG.dimensions.badge.size / 2}
              cy={CARD_CONFIG.dimensions.badge.y}
              r={BADGE_SIZE / 2}
            >
              <Shadow blur={6} color={globalColors.grey100} dx={0} dy={8} shadowOnly />
              <Paint antiAlias dither>
                <Shadow blur={4} color={CARD_CONFIG.colors.white60} dx={0} dy={3} inner shadowOnly />
                <Shadow blur={1.25} color={CARD_CONFIG.colors.white80} dx={0} dy={1.5} inner shadowOnly />
              </Paint>
            </Circle>

            <SkiaText
              align="center"
              color={CARD_CONFIG.colors.whiteTextColor}
              lineHeight={CARD_CONFIG.dimensions.badge.lineHeight(numberOfAirdrops)}
              size={CARD_CONFIG.dimensions.badge.textSize(numberOfAirdrops)}
              weight="heavy"
              width={BADGE_SIZE}
              x={0}
              y={CARD_CONFIG.dimensions.badge.y - CARD_CONFIG.dimensions.badge.size / 2}
            >
              {numberOfAirdrops === null ? '?' : numberOfAirdrops}
            </SkiaText>
          </Group>

          {/* Card text */}
          <SkiaText
            align="center"
            color={CARD_CONFIG.colors.whiteTextColor}
            onLayout={setBadgePosition}
            size="22pt"
            weight="heavy"
            width={DEFAULT_CARD_SIZE}
            x={CARD_CONFIG.dimensions.textXOffset}
            y={CARD_HEIGHT - 73}
          >
            {numberOfAirdrops === 1
              ? i18n.t(i18n.l.token_launcher.cards.airdrops.title_singular)
              : i18n.t(i18n.l.token_launcher.cards.airdrops.title)}
          </SkiaText>

          <SkiaText
            align="center"
            color="labelSecondary"
            letterSpacing={0.6}
            size="11pt"
            weight="heavy"
            width={DEFAULT_CARD_SIZE}
            x={0}
            y={CARD_HEIGHT - 36}
          >
            {numberOfAirdrops
              ? i18n.t(i18n.l.token_launcher.cards.airdrops.subtitle_has_airdrops)
              : numberOfAirdrops === null
                ? i18n.t(i18n.l.token_launcher.cards.airdrops.subtitle_loading)
                : i18n.t(i18n.l.token_launcher.cards.airdrops.subtitle_no_airdrops)}
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
