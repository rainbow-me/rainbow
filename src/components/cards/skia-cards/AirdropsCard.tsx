import {
  BackdropBlur,
  BlendColor,
  Blur,
  Circle,
  Fill,
  Group,
  Color,
  Image,
  LinearGradient,
  Paint,
  RoundedRect,
  Shadow,
  SkParagraph,
  SkPath,
  SkRRect,
  point,
  rect,
  rrect,
  useImage,
  vec,
} from '@shopify/react-native-skia';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { useAnimatedReaction, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { SkiaText } from '@/design-system';
import { globalColors } from '@/design-system/color/palettes';
import { abbreviateNumber } from '@/helpers/utilities';
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
const CARD_HEIGHT = 175;
const COIN_ICON_SIZE = 64;
const COIN_ICON_TOP_INSET = 56;
const DISCOVER_SCREEN_ROUTE = Routes.DISCOVER_SCREEN;

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
      lineHeight: (numberOfAirdrops: string | null) =>
        !numberOfAirdrops || numberOfAirdrops.length < 2 ? 26 : numberOfAirdrops.length < 3 ? 24 : 22,
      textSize: (numberOfAirdrops: string | null) => {
        if (!numberOfAirdrops) return '20pt';
        return numberOfAirdrops.length < 2 ? '20pt' : numberOfAirdrops.length < 3 ? '13pt' : '11pt';
      },
      y: CARD_HEIGHT - 58.5,
    },
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

  const { badgeRect, badgeWidth, badgeXOffset, formattedAirdropsCount } = useMemo(
    () => getBadgeConfig(numberOfAirdrops),
    [numberOfAirdrops]
  );

  const onPress = useCallback(() => {
    const { getAirdrops, getNumberOfAirdrops } = useAirdropsStore.getState();
    if (getNumberOfAirdrops() === 1) {
      const claimable = getAirdrops()?.[0];
      if (claimable) {
        navigate(Routes.CLAIM_AIRDROP_SHEET, { claimable });
      }
    } else {
      navigate(Routes.AIRDROPS_SHEET);
    }
  }, [navigate]);

  const setBadgePosition = useCallback(
    (paragraph: SkParagraph) => {
      'worklet';
      const [{ x }] = paragraph.getLineMetrics();
      badgeOffset.value = [{ translateX: x - badgeXOffset }];
    },
    [badgeOffset, badgeXOffset]
  );

  useAnimatedReaction(
    () => animatedActiveSwipeRoute.value === DISCOVER_SCREEN_ROUTE,
    (shouldTrigger, prevShouldTrigger) => {
      if (shouldTrigger !== prevShouldTrigger) shouldPlayEnterAnimation.value = shouldTrigger;
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
            antiAlias
            dither
          >
            <Shadow blur={15} color={CARD_CONFIG.colors.coinIconDropShadow} dx={0} dy={10} />
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
            cx={DEFAULT_CARD_SIZE / 2}
            cy={COIN_ICON_TOP_INSET}
            r={COIN_ICON_SIZE / 2}
            transform={enterAnimationTransform}
            antiAlias
            dither
          >
            <Shadow blur={1.25} color={CARD_CONFIG.colors.white80} dx={0} dy={1.5} inner shadowOnly />
          </Circle>

          {/* Number of airdrops bubble */}
          <Group transform={badgeOffset}>
            <RoundedRect color={CARD_CONFIG.colors.white15} rect={badgeRect}>
              <Shadow blur={6} color={globalColors.grey100} dx={0} dy={8} />
            </RoundedRect>
            <RoundedRect rect={badgeRect}>
              <Shadow blur={1.25} color={CARD_CONFIG.colors.white80} dx={0} dy={1.5} inner shadowOnly />
            </RoundedRect>
            <RoundedRect rect={badgeRect}>
              <Shadow blur={4} color={CARD_CONFIG.colors.white60} dx={0} dy={3} inner shadowOnly />
            </RoundedRect>

            <SkiaText
              align="center"
              color={CARD_CONFIG.colors.whiteTextColor}
              lineHeight={CARD_CONFIG.dimensions.badge.lineHeight(formattedAirdropsCount)}
              size={CARD_CONFIG.dimensions.badge.textSize(formattedAirdropsCount)}
              weight="heavy"
              width={badgeWidth}
              x={0}
              y={CARD_CONFIG.dimensions.badge.y - BADGE_SIZE / 2}
            >
              {formattedAirdropsCount}
            </SkiaText>
          </Group>

          {/* Card text */}
          <SkiaText
            align="center"
            color={CARD_CONFIG.colors.whiteTextColor}
            onLayoutWorklet={setBadgePosition}
            size="22pt"
            weight="heavy"
            width={DEFAULT_CARD_SIZE}
            x={badgeXOffset}
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

function getBadgeConfig(numberOfAirdrops: number | null): {
  badgeRect: SkRRect;
  badgeWidth: number;
  badgeXOffset: number;
  formattedAirdropsCount: string;
} {
  let formattedAirdropsCount = numberOfAirdrops === null ? '?' : numberOfAirdrops.toString();
  if (numberOfAirdrops && numberOfAirdrops >= 1_000)
    formattedAirdropsCount = abbreviateNumber(numberOfAirdrops, numberOfAirdrops >= 10_000 ? 0 : 1, 'short', true);

  const badgeHeight = numberOfAirdrops && numberOfAirdrops > 10 ? BADGE_SIZE - 4 : BADGE_SIZE;
  const badgeWidth = BADGE_SIZE + (formattedAirdropsCount.length < 3 ? 0 : Math.min(formattedAirdropsCount.length * 2, 12));
  const badgeXOffset = (badgeWidth + 7) / 2;
  const badgeYOffset = CARD_CONFIG.dimensions.badge.y - badgeHeight / 2;
  const badgeRect = rrect(rect(0, badgeYOffset, badgeWidth, badgeHeight), badgeHeight / 2, badgeHeight / 2);

  return { badgeRect, badgeWidth, badgeXOffset, formattedAirdropsCount };
}
