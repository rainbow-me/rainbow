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
    <Inset {...(ios && { bottom: 42, top: 12 })}>
      <ScrollView
        scrollEventThrottle={32}
        // ios scroll fix
        {...(ios && { style: { overflow: 'visible' } })}
        testID={testID}
      >
        <Box
          paddingHorizontal={19}
          // fix clipped shadows on android
          {...(android && {
            paddingBottom: 22,
            paddingTop: 7,
          })}
        >
          <Stack space={36}>{children}</Stack>
        </Box>
      </ScrollView>
    </Inset>
  );
};

export default MenuContainer;
