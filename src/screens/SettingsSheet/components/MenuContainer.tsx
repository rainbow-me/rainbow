import React from 'react';
import { ScrollView } from 'react-native';
import { Box, Inset, Space, Stack } from '@/design-system';

interface MenuContainerProps {
  children: React.ReactNode;
  Footer?: React.ReactNode;
  testID?: string;
  space?: Space;
}

const MenuContainer = ({ children, testID, Footer, space = '36px' }: MenuContainerProps) => {
  return (
    // ios scroll fix
    <Inset
      {...(ios && {
        bottom: '42px (Deprecated)',
        top: '12px',
      })}
    >
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
          <Stack space={space}>{children}</Stack>
        </Box>
        {Footer}
      </ScrollView>
    </Inset>
  );
};

export default MenuContainer;
