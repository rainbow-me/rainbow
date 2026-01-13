import React from 'react';
import { Box } from '@/design-system/components/Box/Box';
import { Text } from '@/design-system/components/Text/Text';

interface Props {
  message: string;
}

export function SecretDisplayError({ message }: Props) {
  return (
    <Box alignItems="center" justifyContent="center" paddingHorizontal="60px">
      <Text align="center" color="secondary60 (Deprecated)" size="16px / 22px (Deprecated)">
        {message}
      </Text>
    </Box>
  );
}
