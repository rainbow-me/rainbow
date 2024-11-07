import { Box, Inline, Text } from '@/design-system';
import React, { useEffect } from 'react';
import * as i18n from '@/languages';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { chainsLabel } from '@/chains';
import { useTransactionClaimableContext } from '../context/TransactionClaimableContext';

export function GasDetails() {
  const {
    claimable: { chainId },
    claimStatus,
    gasFeeDisplay,
  } = useTransactionClaimableContext();

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
        {gasFeeDisplay ? (
          <Inline alignVertical="center" space="2px">
            <Text align="center" color="labelQuaternary" size="icon 10px" weight="heavy">
              􀵟
            </Text>
            <Text color="labelQuaternary" size="13pt" weight="bold">
              {i18n.t(i18n.l.claimables.panel.amount_to_claim_on_network, {
                amount: gasFeeDisplay,
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
