import React, { memo } from 'react';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/design-system';
import { CashActionButton } from '@/features/cash/components/CashActionButton';

import { useSetupContext } from '../setupContext';

export const SetupActionButton = memo(function SetupActionButton() {
  const { useActionStore } = useSetupContext();
  const { disabled, label, loading, onPress, shadow } = useActionStore();
  const insets = useSafeAreaInsets();

  return (
    <Box paddingHorizontal="24px" style={{ paddingBottom: insets.bottom }}>
      <CashActionButton
        disabled={disabled}
        label={label}
        loading={loading}
        onPress={onPress}
        shadow={shadow}
        testID="cash-setup-next"
        textSize="20pt"
      />
    </Box>
  );
});
