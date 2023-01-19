import { Box, Text } from '@/design-system';
import { useNavigation } from '@react-navigation/core';
import React from 'react';
import { ButtonPressAnimation } from '../animations';
import * as i18n from '@/languages';

export const CancelButton = () => {
  const { dangerouslyGetParent } = useNavigation();
  return (
    <Box width="full" alignItems="center">
      <Box
        as={ButtonPressAnimation}
        background="fillSecondary"
        borderRadius={99}
        alignItems="center"
        justifyContent="center"
        width={{ custom: 91 }}
        height={{ custom: 46 }}
        // @ts-expect-error js component
        onPress={() => dangerouslyGetParent()?.goBack()}
      >
        <Text size="17pt" weight="heavy" color="labelSecondary" align="center">
          {i18n.t(i18n.l.button.cancel)}
        </Text>
      </Box>
    </Box>
  );
};
