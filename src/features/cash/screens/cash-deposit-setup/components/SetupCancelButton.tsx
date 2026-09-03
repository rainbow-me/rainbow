import React, { memo } from 'react';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { Box, Text } from '@/design-system';
import * as i18n from '@/languages';

type SetupCancelButtonProps = {
  disabled?: boolean;
  onPress: () => void;
  testID?: string;
};

export const SetupCancelButton = memo(function SetupCancelButton({
  disabled = false,
  onPress,
  testID = 'cash-setup-cancel',
}: SetupCancelButtonProps) {
  return (
    <ButtonPressAnimation disabled={disabled} onPress={onPress} scaleTo={0.92} testID={testID}>
      <Box
        alignItems="center"
        background="fillTertiary"
        borderRadius={18}
        height={{ custom: 36 }}
        justifyContent="center"
        paddingHorizontal="12px"
      >
        <Text color="label" size="17pt" weight="bold">
          {i18n.t(i18n.l.button.cancel)}
        </Text>
      </Box>
    </ButtonPressAnimation>
  );
});
