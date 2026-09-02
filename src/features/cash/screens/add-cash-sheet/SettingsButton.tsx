import React from 'react';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { Box, Text } from '@/design-system';

export function SettingsButton({ onPress }: { onPress: () => void }) {
  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.8} testID="cash-deposit-add-cash-settings">
      <Box alignItems="center" height={{ custom: 36 }} justifyContent="center" width={{ custom: 36 }}>
        <Text align="center" color="accent" size="20pt" weight="heavy">
          {'􀣋'}
        </Text>
      </Box>
    </ButtonPressAnimation>
  );
}
