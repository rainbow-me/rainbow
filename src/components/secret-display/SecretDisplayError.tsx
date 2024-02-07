import React from 'react';
import { Box, Text } from '@/design-system';

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
