import React from 'react';
import { ScrollView } from 'react-native';
import { Box, Inset, Stack } from '@/design-system';

interface MenuContainerProps {
  children: React.ReactNode;
  testID?: string;
}
const MenuContainer = ({ children, testID }: MenuContainerProps) => {
  return (
    // ios scroll fix
    <Inset {...(ios && { bottom: '42px (Deprecated)', top: '12px' })}>
      <ScrollView
        scrollEventThrottle={32}
        // ios scroll fix
        {...(ios && { style: { overflow: 'visible' } })}
        testID={testID}
      >
        <Box
          paddingHorizontal="19px (Deprecated)"
          // fix clipped shadows on android
          {...(android && {
            paddingBottom: { custom: 22 },
            paddingTop: { custom: 7 },
          })}
        >
          <Stack space="36px">{children}</Stack>
        </Box>
      </ScrollView>
    </Inset>
  );
};

export default MenuContainer;
