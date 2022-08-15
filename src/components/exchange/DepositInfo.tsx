import lang from 'i18n-js';
import React, { useEffect, useLayoutEffect, useRef } from 'react';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ButtonPressAnimation } from '../animations';
import { CoinIcon } from '../coin-icon';
import PriceImpactWarning from './PriceImpactWarning';
import { Box, Text } from '@rainbow-me/design-system';
import { SwappableAsset } from '@rainbow-me/entities';

const springConfig = {
  damping: 14,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.001,
  restSpeedThreshold: 0.001,
  stiffness: 121.5,
};

interface DepositInfoProps {
  amount: string | null;
  asset: SwappableAsset;
  isHighPriceImpact: boolean;
  onPress: () => void;
  priceImpactColor?: string;
  priceImpactNativeAmount?: string | null;
  priceImpactPercentDisplay?: string | null;
}

export default function DepositInfo({
  amount,
  asset,
  isHighPriceImpact,
  onPress,
  priceImpactColor,
  priceImpactNativeAmount,
  priceImpactPercentDisplay,
}: DepositInfoProps) {
  const isVisible = !!(asset && amount);

  const prevAmountRef = useRef<string>();
  useEffect(() => {
    // Need to remember the amount so
    // it doesn't show NULL while fading out!
    if (amount !== null) {
      prevAmountRef.current = amount;
    }
  });

  const prevAmount = prevAmountRef.current;
  const amountToDisplay = amount === null ? prevAmount : amount;

  const animation = useSharedValue(isVisible ? 1 : 0);
  const heightAnimation = useSharedValue(isVisible ? 1 : 0);

  useLayoutEffect(() => {
    const toValue = isVisible ? 1 : 0;
    animation.value = withSpring(toValue, springConfig);
    heightAnimation.value = withTiming(toValue, {
      duration: 100,
    });
  }, [isVisible, animation, heightAnimation]);

  const priceImpactAnimation = useSharedValue(isHighPriceImpact ? 1 : 0);
  const priceImpactHeightAnimation = useSharedValue(isHighPriceImpact ? 1 : 0);

  useLayoutEffect(() => {
    const toValue = isHighPriceImpact ? 1 : 0;
    priceImpactAnimation.value = withSpring(toValue, springConfig);
    priceImpactHeightAnimation.value = withTiming(toValue, {
      duration: 100,
    });
  }, [isHighPriceImpact, priceImpactHeightAnimation, priceImpactAnimation]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const height = interpolate(heightAnimation.value, [0, 1], [20, 35]);
    const scale = interpolate(animation.value, [0, 1], [0.8, 1]);
    const translateY = interpolate(animation.value, [0, 1], [1, 0]);
    return {
      height,
      opacity: animation.value,
      transform: [{ scale }, { translateY }],
    };
  });

  const priceImpactAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      priceImpactHeightAnimation.value,
      [0, 1],
      [0, 60]
    );
    return { height, opacity: priceImpactAnimation.value };
  });

  return (
    <Box as={Animated.View}>
      <Box
        as={Animated.View}
        style={animatedContainerStyle}
        testID="deposit-info"
      >
        <ButtonPressAnimation onPress={onPress} scaleTo={0.96}>
          <Box
            alignItems="center"
            flexDirection="row"
            justifyContent="center"
            paddingLeft="2px"
            paddingRight="10px"
            paddingVertical={android ? '6px' : '10px'}
            style={{}}
          >
            <Box paddingRight="5px">
              {/* @ts-expect-error - Javascript Component */}
              <CoinIcon
                address={asset?.address}
                size={20}
                symbol={asset?.symbol}
                testID="deposit-info-container"
              />
            </Box>
            <Box flexDirection="row">
              <Text color="secondary60" size="14px" weight="semibold">
                {lang.t('exchange.swapping_for_prefix')}{' '}
              </Text>
              <Text weight="bold">
                {`${amountToDisplay} ${asset?.symbol || ''}`}
              </Text>
            </Box>
          </Box>
        </ButtonPressAnimation>
      </Box>
      <Box as={Animated.View} style={priceImpactAnimatedStyle}>
        <PriceImpactWarning
          isHighPriceImpact={isHighPriceImpact}
          onPress={onPress}
          pointerEvents={isHighPriceImpact ? 'auto' : 'none'}
          priceImpactColor={priceImpactColor}
          priceImpactNativeAmount={priceImpactNativeAmount}
          priceImpactPercentDisplay={priceImpactPercentDisplay}
        />
      </Box>
    </Box>
  );
}
