import { Box, Text } from '@/design-system';
import React from 'react';
import { ButtonPressAnimation } from '@/components/animations';
import * as i18n from '@/languages';

export const CancelButton = ({ onPress }: { onPress: () => void }) => (
  <Box width="full" alignItems="center" paddingBottom={{ custom: 5 }}>
    <Box
      as={ButtonPressAnimation}
      background="fillSecondary"
      borderRadius={99}
      alignItems="center"
      justifyContent="center"
      width={{ custom: 91 }}
      height={{ custom: 46 }}
      // @ts-ignore overloaded props
      onPress={onPress}
    >
      <Text size="17pt" weight="heavy" color="labelSecondary" align="center">
        {i18n.t(i18n.l.button.cancel)}
      </Text>
    </Box>
  </Box>
);
