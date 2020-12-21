import React, { useEffect, useRef } from 'react';
import Animated from 'react-native-reanimated';
import {
  bin,
  useSpringTransition,
  useTimingTransition,
} from 'react-native-redash';
import styled from 'styled-components/primitives';
import { interpolate } from '../animations';
import { CoinIcon } from '../coin-icon';
import { Centered, RowWithMargins } from '../layout';
import { Text } from '../text';
import { padding } from '@rainbow-me/styles';

const Container = styled(RowWithMargins).attrs({
  centered: true,
  margin: 5,
})`
  ${padding(19, 19, 2)};
  width: 100%;
`;

export default function SwapInfo({ asset, amount }) {
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
  let amountToDisplay = amount;
  if (amount === null) {
    amountToDisplay = prevAmount;
  }

  const animation = useSpringTransition(bin(isVisible), {
    damping: 14,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.001,
    restSpeedThreshold: 0.001,
    stiffness: 121.5,
  });
  const animationHeight = useTimingTransition(bin(isVisible), {
    duration: 100,
  });

  return (
    <Animated.View
      style={{
        height: interpolate(animationHeight, {
          inputRange: [0, 1],
          outputRange: [0, 35],
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
      testID="swap-info"
    >
      <Container>
        <CoinIcon
          address={asset?.address}
          size={20}
          symbol={asset?.symbol}
          testID="swap-info-container"
        />
        <Centered>
          <Text color="grey" size="smedium" weight="medium">
            Swapping for{' '}
          </Text>
          <Text color="white" size="smedium" weight="semibold">
            {`${amountToDisplay} ${asset?.symbol || ''}`}
          </Text>
        </Centered>
      </Container>
    </Animated.View>
  );
}
