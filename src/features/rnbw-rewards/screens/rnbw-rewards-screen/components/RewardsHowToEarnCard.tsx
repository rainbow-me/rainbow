import { memo } from 'react';
import * as i18n from '@/languages';
import { Image, StyleSheet, View } from 'react-native';
import { Box, Text } from '@/design-system';
import ethImage from '@/features/rnbw-rewards/assets/rnbw-reward-methods/eth.png';
import usdcImage from '@/features/rnbw-rewards/assets/rnbw-reward-methods/usdc.png';
import bridgeImage from '@/features/rnbw-rewards/assets/rnbw-reward-methods/bridge.png';
import baseImage from '@/features/rnbw-rewards/assets/rnbw-reward-methods/base.png';
import btcImage from '@/features/rnbw-rewards/assets/rnbw-reward-methods/btc.png';
import { Blur, Canvas, LinearGradient, RoundedRect } from '@shopify/react-native-skia';

const HEIGHT = 188;
const BORDER_RADIUS = 32;
const ICON_MAX_SIZE = 64;

export const RewardsHowToEarnCard = memo(function RewardsHowToEarnCard() {
  return (
    <Box
      height={HEIGHT}
      borderRadius={BORDER_RADIUS}
      borderColor={{ custom: 'rgba(255, 255, 255, 0.08)' }}
      backgroundColor={'rgba(255, 255, 255, 0.04)'}
      width="full"
      style={{ overflow: 'visible' }}
    >
      <View style={styles.gradientFillContainer}>
        <GradientFill />
      </View>
      <View style={styles.iconsContainer}>
        <Box flexDirection="row" alignItems="center" justifyContent="center">
          <Image source={ethImage} style={{ width: 36, height: 36, marginRight: -6 }} />
          <Image source={usdcImage} style={{ width: 48, height: 48, marginRight: -10 }} />
          <Image source={bridgeImage} style={{ width: ICON_MAX_SIZE, height: ICON_MAX_SIZE, zIndex: 2 }} />
          <Image source={baseImage} style={{ width: 48, height: 48, marginLeft: -10, zIndex: 1 }} />
          <Image source={btcImage} style={{ width: 36, height: 36, marginLeft: -6 }} />
        </Box>
      </View>

      <Box gap={20} paddingTop={{ custom: ICON_MAX_SIZE / 2 + 24 }} paddingHorizontal={'36px'}>
        <Text size="26pt" weight="heavy" color="label" align="center">
          {i18n.t(i18n.l.rnbw_rewards.how_to_earn.swap_to_earn)}
        </Text>
        <Text size="17pt / 135%" weight="semibold" color="labelSecondary" align="center">
          {i18n.t(i18n.l.rnbw_rewards.how_to_earn.swap_to_earn_description)}
        </Text>
      </Box>
    </Box>
  );
});

const PURPLE_BLUE_GRADIENT = {
  colors: ['#C73BF2', '#40F5CC', '#3887F2', '#FFE636'],
  positions: [0.09, 0.29, 0.62, 0.91],
  start: { x: 0.26, y: 0.8 },
  end: { x: 1.31, y: 0.67 },
};

const GLOW = {
  width: 448,
  height: 695,
  borderRadius: 180,
  blurRadius: 40,
} as const;

const BLUR_PADDING = GLOW.blurRadius * 2;
const GRADIENT_TOP_OFFSET = 44;

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
        <RoundedRect x={BLUR_PADDING} y={BLUR_PADDING} width={GLOW.width} height={GLOW.height} r={GLOW.borderRadius} opacity={0.3}>
          <LinearGradient
            colors={PURPLE_BLUE_GRADIENT.colors}
            positions={PURPLE_BLUE_GRADIENT.positions}
            start={{
              x: BLUR_PADDING + GLOW.width * PURPLE_BLUE_GRADIENT.start.x,
              y: BLUR_PADDING + GLOW.height * PURPLE_BLUE_GRADIENT.start.y,
            }}
            end={{
              x: BLUR_PADDING + GLOW.width * PURPLE_BLUE_GRADIENT.end.x,
              y: BLUR_PADDING + GLOW.height * PURPLE_BLUE_GRADIENT.end.y,
            }}
          />
          <Blur blur={GLOW.blurRadius} />
        </RoundedRect>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  iconsContainer: {
    position: 'absolute',
    top: -ICON_MAX_SIZE / 2,
    left: 0,
    right: 0,
    justifyContent: 'center',
    zIndex: 999999,
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
});
