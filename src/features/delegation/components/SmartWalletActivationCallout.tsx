import React, { memo } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

import { type Address } from 'viem';

import { Box, Text } from '@/design-system';
import * as i18n from '@/languages';
import { type ChainId } from '@/state/backendNetworks/types';

import { useWillExecuteDelegation } from '../willDelegate';

type SmartWalletActivationCalloutProps = {
  address: Address;
  chainId: ChainId;
  style?: StyleProp<ViewStyle>;
};

/**
 * Renders the Smart Wallet activation callout when execution will delegate.
 */
export const SmartWalletActivationCallout = memo(function SmartWalletActivationCallout({
  address,
  chainId,
  style,
}: SmartWalletActivationCalloutProps) {
  const willDelegate = useWillExecuteDelegation(address, chainId);
  if (!willDelegate) return null;

  return (
    <Box alignItems="center" justifyContent="center" style={style}>
      <Text align="center" color="labelQuinary" size="11pt" weight="heavy">
        {i18n.t(i18n.l.wallet.delegations.will_delegate_callout)}
      </Text>
    </Box>
  );
});
