import React, { useEffect, useRef } from 'react';
import Animated from 'react-native-reanimated';
import {
  bin,
  useSpringTransition,
  useTimingTransition,
} from 'react-native-redash/src/v1';
import styled from 'styled-components';
import { darkModeThemeColors } from '../../styles/colors';
import { ButtonPressAnimation, interpolate } from '../animations';
import { CoinIcon } from '../coin-icon';
import { Centered, RowWithMargins } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './PriceImpactWarning' was resolved to '/Us... Remove this comment to see the full error message
import PriceImpactWarning from './PriceImpactWarning';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';

const springConfig = {
  damping: 14,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.001,
  restSpeedThreshold: 0.001,
  stiffness: 121.5,
};

const Container = styled(RowWithMargins).attrs({
  centered: true,
  margin: 5,
})`
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ${padding(android ? 6 : 10, 10, 2)};
  width: 100%;
`;

export default function DepositInfo({
  amount,
  asset,
  isHighPriceImpact,
  onPress,
  priceImpactColor,
  priceImpactNativeAmount,
  priceImpactPercentDisplay,
}: any) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const isVisible = !!(asset && amount);

  const prevAmountRef = useRef();
  useEffect(() => {
    // Need to remember the amount so
    // it doesn't show NULL while fading out!
    if (amount !== null) {
      prevAmountRef.current = amount;
    }
  });

  const prevAmount = prevAmountRef.current;
  const amountToDisplay = amount === null ? prevAmount : amount;

  const animation = useSpringTransition(bin(isVisible), springConfig);
  const animationHeight = useTimingTransition(bin(isVisible), {
    duration: 100,
  });

  const priceImpactAnimation = useSpringTransition(
    bin(isHighPriceImpact),
    springConfig
  );

  const priceImpactHeightAnimation = useTimingTransition(
    bin(isHighPriceImpact),
    { duration: 100 }
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Animated.View>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Animated.View
        // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
        style={{
          height: interpolate(animationHeight, {
            inputRange: [0, 1],
            outputRange: [20, 35],
          }),
          opacity: interpolate(animation, {
            inputRange: [0, 1],
            outputRange: [0, 1],
          }),
          transform: [
            {
              scale: interpolate(animation, {
                inputRange: [0, 1],
                outputRange: [0.8, 1],
              }),
              translateY: interpolate(animation, {
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
            },
          ],
        }}
        testID="deposit-info"
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ButtonPressAnimation onPress={onPress} scaleTo={0.96}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Container>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <CoinIcon
              address={asset?.address}
              size={20}
              symbol={asset?.symbol}
              testID="deposit-info-container"
            />
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Centered>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Text
                color={colors.alpha(darkModeThemeColors.blueGreyDark, 0.6)}
                size="smedium"
                weight="semibold"
              >
                Swapping for{' '}
              </Text>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Text color="whiteLabel" size="smedium" weight="bold">
                {`${amountToDisplay} ${asset?.symbol || ''}`}
              </Text>
            </Centered>
          </Container>
        </ButtonPressAnimation>
      </Animated.View>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Animated.View
        style={{
          height: interpolate(priceImpactHeightAnimation, {
            inputRange: [0, 1],
            outputRange: [0, 60],
          }),
          opacity: interpolate(priceImpactAnimation, {
            inputRange: [0, 1],
            outputRange: [0, 1],
          }),
        }}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <PriceImpactWarning
          isHighPriceImpact={isHighPriceImpact}
          onPress={onPress}
          pointerEvents={isHighPriceImpact ? 'auto' : 'none'}
          priceImpactColor={priceImpactColor}
          priceImpactNativeAmount={priceImpactNativeAmount}
          priceImpactPercentDisplay={priceImpactPercentDisplay}
        />
      </Animated.View>
    </Animated.View>
  );
}
