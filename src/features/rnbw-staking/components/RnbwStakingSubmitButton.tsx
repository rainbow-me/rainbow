import React, { memo, useCallback } from 'react';
import { StyleSheet } from 'react-native';

import { Box } from '@/design-system';
import { SmartWalletActivationCallout } from '@/features/delegation/components/SmartWalletActivationCallout';
import { RnbwHoldToActivateButton } from '@/features/rnbw-membership/components/RnbwButton/RnbwHoldToActivateButton';
import { STAKING_CHAIN_ID } from '@/features/rnbw-staking/constants';
import { useSharedValueState } from '@/hooks/reanimated/useSharedValueState';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { useDepositContext } from '@/systems/funding/contexts/DepositContext';
import { type DepositSubmitButtonProps } from '@/systems/funding/types';

export const RnbwStakingSubmitButton = memo(function RnbwStakingSubmitButton({
  disabled,
  isSubmitting,
  label,
  onSubmit,
}: DepositSubmitButtonProps) {
  const disabledState = useSharedValueState(disabled);
  const isSubmittingState = useSharedValueState(isSubmitting);
  const labelState = useSharedValueState(label);
  const address = useAccountAddress();
  const { gasStores } = useDepositContext();
  const usesSponsoredExecution = gasStores.useIsGasSponsored();

  const handleActivate = useCallback(async () => {
    await onSubmit();
  }, [onSubmit]);

  return (
    <Box style={styles.submitButtonContainer}>
      <RnbwHoldToActivateButton
        animateLabelLayout={false}
        disabled={disabledState}
        isProcessing={isSubmittingState}
        label={labelState}
        onActivate={handleActivate}
        processingLabel={labelState}
        showBiometryIcon={!disabledState}
        style={styles.submitButton}
        testID="rnbw-staking-submit-button"
      />
      {usesSponsoredExecution && (
        <SmartWalletActivationCallout address={address} chainId={STAKING_CHAIN_ID} style={styles.smartWalletActivationCallout} />
      )}
    </Box>
  );
});

const styles = StyleSheet.create({
  submitButtonContainer: {
    position: 'relative',
    width: '100%',
  },
  submitButton: {
    width: '100%',
  },
  smartWalletActivationCallout: {
    bottom: -24,
    position: 'absolute',
    width: '100%',
  },
});
