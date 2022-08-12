import React from 'react';
import { View } from 'react-native';
import { Box, Stack } from '@rainbow-me/design-system';

const ExchangeFloatingPanels = React.forwardRef<View>((props, ref) => {
  const children = props.children!;
  return (
    <Box ref={ref}>
      <Stack {...props} children={children} />
    </Box>
  );
});

ExchangeFloatingPanels.displayName = 'ExchangeFloatingPanels';

export default ExchangeFloatingPanels;
