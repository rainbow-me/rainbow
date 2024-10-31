import { Box, Inline, Text } from '@/design-system';
import React, { useEffect } from 'react';
import * as i18n from '@/languages';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { chainsLabel } from '@/chains';
import { useClaimContext } from './ClaimContext';

export function GasDetails({ isGasReady, nativeValueDisplay }: { isGasReady: boolean; nativeValueDisplay: string }) {
  const {
    claimable: { chainId },
    claimStatus,
  } = useClaimContext();

  const animationProgress = useSharedValue(0);

  useEffect(() => {
    switch (claimStatus) {
      case 'ready':
      case 'error':
        animationProgress.value = withTiming(0, { duration: 300 });
        break;
      case 'claiming':
      case 'pending':
      case 'success':
      default:
        animationProgress.value = withTiming(1, { duration: 300 });
        break;
    }
  }, [claimStatus, animationProgress]);

  const gasAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: (1 - animationProgress.value) * 30,
      opacity: 1 - animationProgress.value,
    };
  });

  return (
    <Animated.View style={gasAnimatedStyle}>
      <Box paddingTop="20px">
        {isGasReady ? (
          <Inline alignVertical="center" space="2px">
            <Text align="center" color="labelQuaternary" size="icon 10px" weight="heavy">
              􀵟
            </Text>
            <Text color="labelQuaternary" size="13pt" weight="bold">
              {i18n.t(i18n.l.claimables.panel.amount_to_claim_on_network, {
                amount: nativeValueDisplay,
                network: chainsLabel[chainId],
              })}
            </Text>
          </Inline>
        ) : (
          <Text color="labelQuaternary" size="13pt" weight="bold">
            {i18n.t(i18n.l.claimables.panel.calculating_gas_fee)}
          </Text>
        )}
      </Box>
    </Animated.View>
  );
}
