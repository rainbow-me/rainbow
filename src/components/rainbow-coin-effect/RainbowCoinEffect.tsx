import { BlendColor, Blur, Canvas, Circle, Fill, Image, Paint, Shadow, SweepGradient, useImage } from '@shopify/react-native-skia';
import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  runOnUI,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { triggerHaptics } from 'react-native-turbo-haptics';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { globalColors, useColorMode } from '@/design-system';
import { getSizedImageUrl } from '@/handlers/imgix';
import { useCleanup } from '@/hooks/useCleanup';
import Routes from '@/navigation/routesNames';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { ANIMATION_CONFIGS, BORDER_THICKNESS, INTERNAL_SPRING_CONFIGS } from './constants';
import { cancelAnimations, getRainbowCoinEffectConfig, onPressCoinIcon, startAnimations } from './utils';

interface RainbowCoinEffectProps {
  color: string;
  imageUrl: string;
  size: number;
}

export const EXPANDED_STATE_ROUTE = Routes.EXPANDED_ASSET_SHEET_V2;

export const RainbowCoinEffect = memo(function RainbowCoinEffect({ color: providedColor, imageUrl, size = 40 }: RainbowCoinEffectProps) {
  const { isDarkMode } = useColorMode();
  const { canvasCenter, circlePath, color, colors, dimensionsStyle, gradientColors, gradientCenter, imageRect, innerRadius, outerRadius } =
    useMemo(() => getRainbowCoinEffectConfig({ color: providedColor, isDarkMode, size }), [isDarkMode, providedColor, size]);

  const animatedActiveRoute = useNavigationStore(state => state.animatedActiveRoute);
  const sizedImageUrl = useMemo(() => getSizedImageUrl(imageUrl, size), [imageUrl, size]);
  const image = useImage(sizedImageUrl);

  const rotation = useSharedValue(0);
  const targetRotation = useSharedValue<number | undefined>(undefined);
  const tiltX = useSharedValue(0);

  const gradientAnimation = useDerivedValue(() => {
    const radians = _WORKLET ? (rotation.value * Math.PI) / 90 : 0;
    return [{ rotate: radians }];
  }, [rotation]);

  const animatedTiltStyle = useAnimatedStyle(() => {
    if (!_WORKLET) return { transform: [{ perspective: 80 }, { scale: 1 }, { rotateY: '0deg' }] };
    const isUserTriggeredSpin = targetRotation?.value !== undefined;
    const shouldScaleDown = targetRotation?.value !== undefined && Math.abs(targetRotation.value) - Math.abs(tiltX.value) < 180;
    return {
      transform: [
        { perspective: 80 },
        {
          scale: isUserTriggeredSpin
            ? shouldScaleDown
              ? withSpring(1, INTERNAL_SPRING_CONFIGS.spinSpring)
              : withSpring(1.1125, INTERNAL_SPRING_CONFIGS.spinSpring)
            : interpolate(
                tiltX.value,
                [0, -ANIMATION_CONFIGS.TILT_AMPLITUDE_X * 0.75, -ANIMATION_CONFIGS.TILT_AMPLITUDE_X],
                [1, 1.225, 1],
                'clamp'
              ),
        },
        { rotateY: `${tiltX.value}deg` },
      ],
    };
  });

  const imageOpacity = useDerivedValue(() => (image ? withTiming(1, TIMING_CONFIGS.slowFadeConfig) : 0));
  const isExpandedStateActive = useDerivedValue(() => !_WORKLET || animatedActiveRoute.value === EXPANDED_STATE_ROUTE);

  const onLongPress = useCallback(() => {
    'worklet';
    onPressCoinIcon({ extraJuice: 1, targetRotation, tiltX });
  }, [targetRotation, tiltX]);

  const onPress = useCallback(() => {
    'worklet';
    onPressCoinIcon({ targetRotation, tiltX });
  }, [targetRotation, tiltX]);

  // Starts animations on mount
  // Cancels them when the expanded state becomes inactive or is backgrounded
  useAnimatedReaction(
    () => isExpandedStateActive.value,
    (isActive, prevIsActive) => {
      if (isActive && !prevIsActive) {
        startAnimations({ isFirstRender: prevIsActive === null, rotation, tiltX });
      } else if (!isActive && prevIsActive) {
        cancelAnimations({ animated: true, rotation, targetRotation, tiltX });
      }
    },
    []
  );

  // Triggers haptics at each 180 degree interval when the coin icon is pressed
  useAnimatedReaction(
    () => (targetRotation?.value === undefined ? undefined : Math.floor(tiltX.value / 180)),
    (current, prev) => {
      if (prev !== null && current !== undefined && current !== prev) {
        triggerHaptics('soft');
      }
    },
    []
  );

  useCleanup(() => image?.dispose?.(), [image]);

  useCleanup(() => {
    circlePath?.dispose?.();
    // Make sure animations are stopped on unmount
    runOnUI(cancelAnimations)({ animated: false, rotation, targetRotation, tiltX });
  });

  return (
    <GestureHandlerButton
      hapticType="soft"
      hitSlop={20}
      onLongPressWorklet={onLongPress}
      onPressWorklet={onPress}
      scaleTo={0.725}
      style={[styles.container, dimensionsStyle.outer]}
    >
      <Animated.View style={[styles.container, dimensionsStyle.outer, animatedTiltStyle]}>
        <Canvas style={dimensionsStyle.inner}>
          <Circle cx={canvasCenter} cy={canvasCenter} r={innerRadius + BORDER_THICKNESS} style="stroke" strokeWidth={BORDER_THICKNESS * 2}>
            <Paint antiAlias blendMode="overlay" dither>
              <Shadow blur={4} color={colors.darkOverlayShadow} dx={0} dy={0} />
            </Paint>
            <SweepGradient c={gradientCenter} colors={gradientColors} transform={gradientAnimation} />
          </Circle>

          <Circle cx={canvasCenter} cy={canvasCenter + 2} opacity={isDarkMode ? 1 : 0.2} r={outerRadius}>
            <Blur blur={4} />
            <BlendColor color={colors.blendOverlay} mode="overlay" />
            <SweepGradient c={gradientCenter} colors={gradientColors} transform={gradientAnimation} />
          </Circle>

          <Circle clip={circlePath} color={color} cx={canvasCenter} cy={canvasCenter} r={innerRadius - (isDarkMode ? 0 : 1)} />

          <Image clip={circlePath} fit="cover" image={image} opacity={imageOpacity} rect={imageRect}>
            <Fill clip={imageRect} color={color} />
          </Image>

          <Circle clip={circlePath} color="transparent" cx={canvasCenter} cy={canvasCenter} r={innerRadius - (isDarkMode ? 0 : 1)}>
            <Paint antiAlias blendMode="plus" clip={circlePath} dither>
              <Shadow blur={2} color={colors.whiteInnerShadow} dx={0} dy={1.5} inner shadowOnly />
            </Paint>
            <Paint antiAlias blendMode="softLight" clip={circlePath} dither>
              <Shadow blur={3 / 5} color={globalColors.grey100} dx={0} dy={0.4} inner shadowOnly />
            </Paint>
          </Circle>
        </Canvas>
      </Animated.View>
    </GestureHandlerButton>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
