import { memo, useCallback } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import * as i18n from '@/languages';
import { Box, Text } from '@/design-system';
import { useAirdropBalanceStore } from '@/features/rnbw-rewards/stores/airdropBalanceStore';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { ETH_COLOR_DARK, ETH_COLOR_DARK_ACCENT } from '@/__swaps__/screens/Swap/constants';
import rnbwCoinImage from '@/assets/rnbw.png';
import { BlurView } from 'react-native-blur-view';
import { RnbwRewardsScenes } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/constants/rewardsScenes';
import { useRnbwRewardsFlowContext } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/context/RnbwRewardsFlowContext';
import { RNBW_SYMBOL } from '@/features/rnbw-rewards/constants';
import { useIsReadOnlyWallet } from '@/state/wallets/walletsStore';
import { runOnJS } from 'react-native-reanimated';
import watchingAlert from '@/utils/watchingAlert';
import { Blur, Canvas, LinearGradient, RoundedRect } from '@shopify/react-native-skia';
import { useStableValue } from '@/hooks/useStableValue';

const BORDER_RADIUS = 32;

export const AirdropSummaryCard = memo(function AirdropSummaryCard() {
  const { setActiveScene } = useRnbwRewardsFlowContext();
  const isReadOnlyWallet = useIsReadOnlyWallet();
  const { tokenAmount, nativeCurrencyAmount } = useAirdropBalanceStore(state => state.getFormattedBalance());

  const handleNavigateToClaimAirdrop = useCallback(() => {
    'worklet';
    if (isReadOnlyWallet) {
      runOnJS(watchingAlert)();
      return;
    }
    setActiveScene(RnbwRewardsScenes.AirdropClaimPrompt);
  }, [isReadOnlyWallet, setActiveScene]);

  return (
    <ButtonPressAnimation onPress={handleNavigateToClaimAirdrop} scaleTo={0.96}>
      <View style={{ overflow: 'visible' }}>
        <Box
          backgroundColor={opacityWorklet(ETH_COLOR_DARK, 0.06)}
          borderColor={{ custom: opacityWorklet(ETH_COLOR_DARK_ACCENT, 0.06) }}
          borderRadius={BORDER_RADIUS}
          paddingVertical="24px"
          paddingHorizontal="20px"
          style={{ overflow: 'visible' }}
        >
          <View style={styles.gradientFillContainer}>
            <GradientFill />
          </View>
          <BackgroundCoins />
          <Box gap={20}>
            <Box paddingLeft={'4px'}>
              <Text size="15pt" weight="heavy" color="labelTertiary">
                {i18n.t(i18n.l.rnbw_rewards.airdrop_card.your_airdrop).toUpperCase()}
              </Text>
            </Box>
            <Box flexDirection="row" alignItems="center" gap={12}>
              <Image source={rnbwCoinImage} style={styles.coinImage} />
              <Box gap={12}>
                <Text size="26pt" weight="heavy" color="label">
                  {nativeCurrencyAmount}
                </Text>
                <Text size="17pt" weight="semibold" color="labelTertiary">
                  {`${tokenAmount} ${RNBW_SYMBOL}`}
                </Text>
              </Box>
            </Box>
          </Box>
        </Box>
      </View>
    </ButtonPressAnimation>
  );
});

const BLUE_ORANGE_GRADIENT = {
  colors: ['#3887F2', '#40F5CC', '#FF9129', '#FFE636'],
  positions: [0.11, 0.4, 0.64, 0.9],
  start: { x: 0.02, y: 0.69 },
  end: { x: 0.98, y: 0.69 },
};

const GLOW = {
  width: 448,
  height: 695,
  borderRadius: 180,
  blurRadius: 40,
} as const;

const BLUR_PADDING = GLOW.blurRadius * 2;
const GRADIENT_TOP_OFFSET = 55;

function GradientFill() {
  const canvasWidth = GLOW.width + BLUR_PADDING * 2;
  const canvasHeight = GLOW.height + BLUR_PADDING * 2;

  return (
    <View style={styles.canvasWrapper}>
      <Canvas
        style={{
          width: canvasWidth,
          height: canvasHeight,
        }}
      >
        <RoundedRect x={BLUR_PADDING} y={BLUR_PADDING} width={GLOW.width} height={GLOW.height} r={GLOW.borderRadius} opacity={0.15}>
          <LinearGradient
            colors={BLUE_ORANGE_GRADIENT.colors}
            positions={BLUE_ORANGE_GRADIENT.positions}
            start={{
              x: BLUR_PADDING + GLOW.width * BLUE_ORANGE_GRADIENT.start.x,
              y: BLUR_PADDING + GLOW.height * BLUE_ORANGE_GRADIENT.start.y,
            }}
            end={{
              x: BLUR_PADDING + GLOW.width * BLUE_ORANGE_GRADIENT.end.x,
              y: BLUR_PADDING + GLOW.height * BLUE_ORANGE_GRADIENT.end.y,
            }}
          />
          <Blur blur={GLOW.blurRadius} />
        </RoundedRect>
      </Canvas>
    </View>
  );
}

const BackgroundCoins = memo(function BackgroundCoins() {
  const BACKGROUND_COIN_LAYERS = useStableValue(() => [
    {
      id: 'outer',
      containerStyle: styles.backgroundCoinLayer,
      coins: [
        {
          id: 'top-right',
          position: { top: -21, right: 59 },
          size: 61,
          rotation: '11.11deg',
          opacity: 0.9,
          blurIntensity: 1.5,
        },
      ],
    },
    {
      id: 'clipped',
      containerStyle: styles.backgroundCoinLayerClipped,
      coins: [
        {
          id: 'bottom-right',
          position: { bottom: -40, right: -30 },
          size: 122,
          rotation: '-13.39deg',
          opacity: 0.7,
          blurIntensity: 2,
        },
        {
          id: 'bottom-center',
          position: { bottom: 14, right: 100 },
          size: 31,
          rotation: '23.77deg',
          opacity: 1,
          blurIntensity: 1,
        },
      ],
    },
  ]);

  return (
    <View style={styles.backgroundCoinWrapper}>
      {BACKGROUND_COIN_LAYERS.map(layer => (
        <View key={layer.id} style={layer.containerStyle}>
          {layer.coins.map(coin => {
            const blurPadding = coin.blurIntensity * 3;

            return (
              <View
                key={coin.id}
                style={[
                  styles.backgroundCoin,
                  coin.position,
                  {
                    transform: [{ rotate: coin.rotation }],
                    opacity: coin.opacity,
                  },
                ]}
              >
                <Image source={rnbwCoinImage} style={{ width: coin.size, height: coin.size }} />
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
          })}
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  coinImage: {
    width: 52,
    height: 52,
    resizeMode: 'contain',
  },
  gradientFillContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
  },
  canvasWrapper: {
    position: 'absolute',
    top: -BLUR_PADDING + GRADIENT_TOP_OFFSET,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  backgroundCoinWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundCoinLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundCoinLayerClipped: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
  },
  backgroundCoin: {
    position: 'absolute',
  },
  backgroundCoinBlur: {
    position: 'absolute',
  },
});
