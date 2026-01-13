import React, { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Blur, Canvas, LinearGradient, RoundedRect } from '@shopify/react-native-skia';
import { BlurView } from 'react-native-blur-view';
import { Box } from '@/design-system/components/Box/Box';
import { Inline } from '@/design-system/components/Inline/Inline';
import { Text } from '@/design-system/components/Text/Text';
import { TextIcon } from '@/design-system/components/TextIcon/TextIcon';
import { useColorMode } from '@/design-system/color/ColorMode';
import { globalColors } from '@/design-system/color/palettes';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { opacity } from '@/framework/ui/utils/opacity';
import rnbwCoinImage from '@/assets/rnbw.png';
import { useRnbwFeatureCard } from '@/features/rnbw-rewards/hooks/useRnbwFeatureCard';
import * as i18n from '@/languages';
import { ButtonPressAnimationTouchEvent } from '@/components/animations/ButtonPressAnimation/types';
import { ETH_COLOR_DARK_ACCENT, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { IS_IOS } from '@/env';

export const RNBW_FEATURE_CARD_HEIGHT = 131;
const BORDER_RADIUS = 28;

export const RnbwFeatureCard = memo(function RnbwFeatureCard() {
  const { isDarkMode } = useColorMode();
  const navigateToRnbwRewards = () => {
    Navigation.handleAction(Routes.RNBW_REWARDS_SCREEN);
  };

  return (
    <View style={styles.container}>
      <ButtonPressAnimation onPress={navigateToRnbwRewards} scaleTo={0.96}>
        <View style={{ height: RNBW_FEATURE_CARD_HEIGHT, width: '100%' }}>
          {/* Background Layer */}
          <Box
            borderRadius={BORDER_RADIUS}
            borderWidth={isDarkMode ? 1 : THICK_BORDER_WIDTH}
            borderColor={{ custom: isDarkMode ? opacity(ETH_COLOR_DARK_ACCENT, 0.06) : opacity('#F5D66C', 0.2) }}
            backgroundColor={isDarkMode ? opacity('#677483', 0.06) : opacity('#F5D66C', 0.6)}
            style={StyleSheet.absoluteFill}
          >
            {isDarkMode && <GradientFill />}
          </Box>
          {/* Coin Layer */}
          <FloatingCoins />
          {/* Content layer */}
          <Box style={StyleSheet.absoluteFill} paddingLeft={{ custom: 18 }} paddingVertical="24px">
            <Box flexDirection="row" alignItems="center" gap={12}>
              <Image source={rnbwCoinImage} style={styles.coinImage} />
              <Box gap={14} style={{ maxWidth: 192 }}>
                <Text size="13pt" weight="heavy" color={isDarkMode ? { custom: opacity('#F5F8FF', 0.4) } : 'labelSecondary'}>
                  {i18n.t(i18n.l.rnbw_rewards.introduction.introducing).toUpperCase()}
                </Text>
                <Inline alignVertical="center" space="6px">
                  <Text size="22pt" weight="heavy" color="label" align="left">
                    {i18n.t(i18n.l.rnbw_rewards.introduction.rainbow_token)}
                  </Text>
                  <TextIcon
                    size="13pt"
                    weight="heavy"
                    color={isDarkMode ? { custom: opacity(globalColors.white100, 0.3) } : 'labelQuaternary'}
                  >
                    {'􀯻'}
                  </TextIcon>
                </Inline>
                <Text size="15pt" weight="semibold" color={isDarkMode ? 'labelTertiary' : 'labelSecondary'}>
                  {i18n.t(i18n.l.rnbw_rewards.feature_card.subtitle)}
                </Text>
              </Box>
            </Box>
          </Box>
        </View>
        {IS_IOS && <DismissButton />}
      </ButtonPressAnimation>
      {!IS_IOS && <DismissButton />}
    </View>
  );
});

function DismissButton() {
  const { dismiss } = useRnbwFeatureCard();

  const onDismiss = (e: ButtonPressAnimationTouchEvent) => {
    if (e && 'stopPropagation' in e) {
      e.stopPropagation();
    }
    dismiss();
  };

  return (
    <View style={styles.dismissButton}>
      <ButtonPressAnimation onPress={onDismiss} scaleTo={0.8}>
        <Box
          width={28}
          height={28}
          backgroundColor={opacity(globalColors.grey100, 0.32)}
          borderRadius={14}
          justifyContent="center"
          alignItems="center"
          hitSlop={12}
        >
          <TextIcon size="icon 13px" weight="bold" color="white">
            {'􀆄'}
          </TextIcon>
        </Box>
      </ButtonPressAnimation>
    </View>
  );
}

const gradientConfig = {
  gradient: {
    colors: ['#3887F2', '#40F5CC', '#FF9129', '#FFE636'],
    positions: [0.12, 0.4, 0.68, 0.92],
    start: { x: 0.05, y: 0.68 },
    end: { x: 0.95, y: 0.68 },
  },
  width: 340,
  height: 260,
  topOffset: 24,
  borderRadius: 160,
  blurIntensity: 40,
};

function GradientFill() {
  const { gradient, width, height, topOffset, borderRadius, blurIntensity } = gradientConfig;
  const blurPadding = blurIntensity * 2;

  const canvasWidth = width + blurPadding * 2;
  const canvasHeight = height + blurPadding * 2;

  return (
    <View style={{ ...StyleSheet.absoluteFillObject, top: -blurPadding + topOffset, alignItems: 'center' }}>
      <Canvas
        style={{
          width: canvasWidth,
          height: canvasHeight,
        }}
      >
        <RoundedRect x={blurPadding} y={blurPadding} width={width} height={height} r={borderRadius} opacity={0.12}>
          <LinearGradient
            colors={gradient.colors}
            positions={gradient.positions}
            start={{
              x: blurPadding + width * gradient.start.x,
              y: blurPadding + height * gradient.start.y,
            }}
            end={{
              x: blurPadding + width * gradient.end.x,
              y: blurPadding + height * gradient.end.y,
            }}
          />
          <Blur blur={blurIntensity} />
        </RoundedRect>
      </Canvas>
    </View>
  );
}

type CoinConfig = {
  id: string;
  position: { top?: number; bottom?: number; left?: number; right?: number };
  size: number;
  rotation: string;
  opacity: number;
  blurIntensity: number;
};

const OUTER_COINS: CoinConfig[] = [
  {
    id: 'top-right',
    position: { top: -22, right: 40 },
    size: 62,
    rotation: '11deg',
    opacity: 0.9,
    blurIntensity: 1.5,
  },
];

const CLIPPED_COINS: CoinConfig[] = [
  {
    id: 'bottom-left',
    position: { bottom: -45, left: 60 },
    size: 61,
    rotation: '23.8deg',
    opacity: 0.6,
    blurIntensity: 1,
  },
  {
    id: 'bottom-right',
    position: { bottom: -40, right: -35 },
    size: 122,
    rotation: '-13.4deg',
    opacity: 0.6,
    blurIntensity: 2,
  },
];

function BackgroundCoin({ coin }: { coin: CoinConfig }) {
  const blurPadding = coin.blurIntensity * 3;

  return (
    <View
      style={[
        styles.backgroundCoin,
        coin.position,
        {
          transform: [{ rotate: coin.rotation }],
          opacity: coin.opacity,
        },
      ]}
    >
      <Image source={rnbwCoinImage} style={{ width: coin.size, height: coin.size, resizeMode: 'contain' }} />
      <BlurView
        style={[
          styles.backgroundCoinBlur,
          {
            top: -blurPadding,
            left: -blurPadding,
            right: -blurPadding,
            bottom: -blurPadding,
          },
        ]}
        blurStyle="plain"
        blurIntensity={coin.blurIntensity}
      />
    </View>
  );
}

const FloatingCoins = memo(function FloatingCoins() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {OUTER_COINS.map(coin => (
        <BackgroundCoin key={coin.id} coin={coin} />
      ))}
      <View style={styles.backgroundCoinLayerClipped}>
        {CLIPPED_COINS.map(coin => (
          <BackgroundCoin key={coin.id} coin={coin} />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  backgroundCoin: {
    position: 'absolute',
  },
  coinImage: {
    width: 52,
    height: 52,
  },
  backgroundCoinBlur: {
    position: 'absolute',
  },
  backgroundCoinLayerClipped: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
  },
  dismissButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
});
