import React, { memo, useCallback } from 'react';
import { StyleSheet } from 'react-native';

import { RnbwHoldToActivateButton } from '@/features/rnbw-membership/components/RnbwButton/RnbwHoldToActivateButton';
import { useSharedValueState } from '@/hooks/reanimated/useSharedValueState';
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

  const handleActivate = useCallback(async () => {
    await onSubmit();
  }, [onSubmit]);

  return (
    <RnbwHoldToActivateButton
      disabled={disabledState}
      isProcessing={isSubmittingState}
      label={labelState}
      onActivate={handleActivate}
      processingLabel={labelState}
      showBiometryIcon={!disabledState}
      style={styles.submitButton}
      testID="rnbw-staking-submit-button"
    />
  );
});

const styles = StyleSheet.create({
  submitButton: {
    width: '100%',
  },
});
