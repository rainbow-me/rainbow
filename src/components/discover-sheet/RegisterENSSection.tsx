import React from 'react';
import { Box, Inset, Stack, Text } from '@rainbow-me/design-system';

export default function RegisterENSSection() {
  return (
    <Inset bottom="19px" horizontal="19px">
      <Box
        background="accent"
        borderRadius={24}
        height={{ custom: 70 }}
        shadow="30px heavy accent"
      >
        <Inset space="19px">
          <Stack space="8px">
            <Text size="18px" weight="heavy">
              Register .eth Name
            </Text>
            <Text color="secondary70" size="16px" weight="semibold">
              & create your ENS profile
            </Text>
          </Stack>
        </Inset>
      </Box>
    </Inset>
  );
}
