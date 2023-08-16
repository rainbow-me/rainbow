import { Box, Text } from '@/design-system';
import React from 'react';
import { ButtonPressAnimation } from '@/components/animations';

type Props = {
  onPress: () => void;
  label: string;
};

export const ActionButton = ({ onPress, label }: Props) => (
  <Box width="full" paddingHorizontal="20px">
    <Box
      as={ButtonPressAnimation}
      background="purple"
      borderRadius={99}
      alignItems="center"
      justifyContent="center"
      width="full"
      height={{ custom: 56 }}
      // @ts-ignore overloaded props
      onPress={onPress}
    >
      <Text size="20pt" weight="heavy" color="label" align="center">
        {label}
      </Text>
    </Box>
  </Box>
);
