import { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { PanelSheet, PANEL_WIDTH } from '@/components/PanelSheet/PanelSheet';
import { ColorModeProvider, Stack, Text } from '@/design-system';
import { RNBW_SYMBOL } from '@/features/rnbw-rewards/constants';
import { useStableValue } from '@/hooks/useStableValue';
import { useRoute } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { BlurView } from 'react-native-blur-view';
import rnbwCoinImage from '@/assets/rnbw.png';
import { Blur, Canvas, LinearGradient, RoundedRect } from '@shopify/react-native-skia';
import * as i18n from '@/languages';

export const RnbwRewardsEstimateSheet = memo(function RnbwRewardsEstimateSheet() {
  const {
    params: { estimatedAmount },
  } = useRoute<typeof Routes.RNBW_REWARDS_ESTIMATE_SHEET>();

  return (
    <ColorModeProvider value="dark">
      <PanelSheet>
        <GradientFill />
        <BackgroundCoins />
        <View style={styles.contentContainer}>
          <Image source={rnbwCoinImage} style={styles.heroCoin} />
          <Stack space="20px">
            <Text align="center" color="label" size="30pt" weight="heavy">
              {i18n.t(i18n.l.rnbw_rewards_estimate_sheet.earning_rewards)}
            </Text>
            <Text align="center" color="labelSecondary" size="17pt / 150%" weight="semibold">
              {i18n.t(i18n.l.rnbw_rewards_estimate_sheet.this_transaction_earns)}
              {'\n'}
              <Text color="label" size="17pt / 150%" weight="heavy">
                {`~${estimatedAmount} ${RNBW_SYMBOL}`}
              </Text>
            </Text>
          </Stack>
        </View>
      </PanelSheet>
    </ColorModeProvider>
  );
});

const gradientConfig = {
  gradient: {
    colors: ['#3887F2', '#40F5CC', '#FF9129', '#FFE636'],
    positions: [0.11, 0.4, 0.64, 0.9],
    start: { x: 0.02, y: 0.69 },
    end: { x: 0.98, y: 0.69 },
  },
  topOffset: 130,
  borderRadius: 180,
  blurIntensity: 35,
};

const GradientFill = memo(function GradientFill() {
  const { gradient, topOffset, borderRadius, blurIntensity } = gradientConfig;
  const blurPadding = blurIntensity * 2;

  const viewWidth = PANEL_WIDTH + blurIntensity * 2;
  const viewHeight = 250;

  const canvasWidth = viewWidth + blurPadding * 2;
  const canvasHeight = viewHeight + blurPadding * 2;

  return (
    <View style={{ ...StyleSheet.absoluteFillObject, top: -blurPadding + topOffset, alignItems: 'center' }}>
      <Canvas
        style={{
          width: canvasWidth,
          height: canvasHeight,
        }}
      >
        <RoundedRect x={blurPadding} y={blurPadding} width={viewWidth} height={viewHeight} r={borderRadius} opacity={0.15}>
          <LinearGradient
            colors={gradient.colors}
            positions={gradient.positions}
            start={{
              x: blurPadding + viewWidth * gradient.start.x,
              y: blurPadding + viewHeight * gradient.start.y,
            }}
            end={{
              x: blurPadding + viewWidth * gradient.end.x,
              y: blurPadding + viewHeight * gradient.end.y,
            }}
          />
          <Blur blur={blurIntensity} />
        </RoundedRect>
      </Canvas>
    </View>
  );
});

const BackgroundCoins = memo(function BackgroundCoins() {
  const coins = useStableValue(() => [
    {
      id: 'top-left',
      position: { top: -51, left: -65 },
      size: 152,
      rotation: '11.11deg',
      opacity: 0.7,
      blurIntensity: 2,
    },
    {
      id: 'top-right',
      position: { top: -40, right: 13 },
      size: 101,
      rotation: '11.11deg',
      opacity: 0.7,
      blurIntensity: 1.5,
    },
    {
      id: 'bottom-left',
      position: { top: 150, left: -30 },
      size: 63,
      rotation: '11.11deg',
      opacity: 0.8,
      blurIntensity: 2,
    },
    {
      id: 'bottom-right',
      position: { bottom: -80, right: -30 },
      size: 155,
      rotation: '-15.22deg',
      opacity: 0.6,
      blurIntensity: 2.5,
    },
  ]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {coins.map(coin => {
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
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    paddingVertical: 64,
    paddingHorizontal: 48,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCoin: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 24,
  },
  backgroundCoin: {
    position: 'absolute',
  },
  backgroundCoinBlur: {
    position: 'absolute',
  },
});
