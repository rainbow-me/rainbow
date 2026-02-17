import React from 'react';
import { Box, Text } from '@/design-system';
import * as i18n from '@/languages';
import { useRevokeDelegationContext } from '../context/RevokeDelegationContext';

export function RevokeGasPreview() {
  const { gasFeeDisplay, chainName, revokeStatus } = useRevokeDelegationContext();

  const visible = revokeStatus === 'ready' || revokeStatus === 'recoverableError' || revokeStatus === 'notReady';
  if (!visible) return null;

  return (
    <Box paddingTop="24px" paddingBottom="24px" alignItems="center" justifyContent="center">
      <Box flexDirection="row" alignItems="center" gap={4}>
        <Text size="13pt" weight="heavy" color="labelTertiary" align="center">
          􀵟
        </Text>
        <Text size="13pt" weight="bold" color="labelTertiary" align="center">
          {gasFeeDisplay ? (
            <>
              <Text size="13pt" weight="bold" color="labelTertiary">
                {gasFeeDisplay}
              </Text>
              <Text size="13pt" weight="semibold" color="labelQuaternary">
                {` ${i18n.t(i18n.l.wallet.delegations.revoke_panel.gas_fee, { chainName })}`}
              </Text>
            </>
          ) : (
            i18n.t(i18n.l.wallet.delegations.revoke_panel.gas_fee, { chainName })
          )}
        </Text>
      </Box>
    </Box>
  );
}
