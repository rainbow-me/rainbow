import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { Box, Stack } from '@/design-system';

interface ExchangeFloatingPanelsProps {
  children: ReactNode;
}

const ExchangeFloatingPanels = React.forwardRef<
  View,
  ExchangeFloatingPanelsProps
>((props, ref) => {
  const children = props.children;
  return (
    <Box ref={ref}>
      <Stack>{children}</Stack>
    </Box>
  );
});

ExchangeFloatingPanels.displayName = 'ExchangeFloatingPanels';

export default ExchangeFloatingPanels;
