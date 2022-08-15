import React from 'react';
import { ScrollView } from 'react-native';
import { Box, Inset, Stack } from '@rainbow-me/design-system';

interface MenuContainerProps {
  children: React.ReactNode;
  testID?: string;
}
const MenuContainer = ({ children, testID }: MenuContainerProps) => {
  return (
    <Inset bottom="42px" top="12px">
      <ScrollView
        scrollEventThrottle={32}
        style={{ overflow: 'visible' }}
        testID={testID}
      >
        <Box paddingHorizontal="19px">
          <Stack space="36px">{children}</Stack>
        </Box>
      </ScrollView>
    </Inset>
  );
};

export default MenuContainer;
