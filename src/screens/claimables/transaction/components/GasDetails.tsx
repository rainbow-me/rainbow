import { Box, Inline, Text } from '@/design-system';
import React, { useEffect } from 'react';
import * as i18n from '@/languages';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { useTransactionClaimableContext } from '../context/TransactionClaimableContext';

export function GasDetails() {
  const {
    claimable: { chainId },
    claimStatus,
    gasState: { gasFeeDisplay },
    outputConfig,
  } = useTransactionClaimableContext();

  const animationProgress = useSharedValue(1);

  useEffect(() => {
    if (!outputConfig.chainId || !outputConfig.token || !gasFeeDisplay) {
      animationProgress.value = withTiming(1, { duration: 300 });
      return;
    }
    switch (claimStatus) {
      case 'ready':
      case 'recoverableError':
        animationProgress.value = withTiming(0, { duration: 300 });
        break;
      case 'claiming':
      case 'pending':
      case 'success':
      default:
        animationProgress.value = withTiming(1, { duration: 300 });
        break;
    }
  }, [claimStatus, animationProgress, outputConfig.chainId, outputConfig.token, outputConfig, gasFeeDisplay]);

  const gasAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: (1 - animationProgress.value) * 30,
      opacity: 1 - animationProgress.value,
    };
  });

  return (
    <Animated.View style={gasAnimatedStyle}>
      {gasFeeDisplay && (
        <Box paddingTop="20px">
          <Inline alignVertical="center" space="2px">
            <Text align="center" color="labelQuaternary" size="icon 10px" weight="heavy">
              􀵟
            </Text>
            <Text color="labelQuaternary" size="13pt" weight="bold">
              {i18n.t(i18n.l.claimables.panel.amount_to_claim_on_network, {
                amount: gasFeeDisplay,
                network: useBackendNetworksStore.getState().getChainsLabel()[chainId],
              })}
            </Text>
          </Inline>
        </Box>
      )}
    </Animated.View>
  );
}
