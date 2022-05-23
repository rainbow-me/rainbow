import { useRoute } from '@react-navigation/core';
import React from 'react';

import { Box, Text } from '@rainbow-me/design-system';

function Callout({ children }: { children: string }) {
  return (
    <Box>
      <Text>{children}</Text>
    </Box>
  );
}

export default function ENSSendSheet() {
  const { params } = useRoute<any>();
  const assetOverride = params?.asset;

  return (
    <Box>
      <Callout>ENS configuration options</Callout>
      <Text>test</Text>
    </Box>
  );
}
