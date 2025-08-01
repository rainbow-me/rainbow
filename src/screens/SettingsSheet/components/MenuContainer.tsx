import React from 'react';
import { ScrollView } from 'react-native';
import { Box, Inset, Space, Stack } from '@/design-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MenuContainerProps {
  scrollviewRef?: React.RefObject<ScrollView | null>;
  children: React.ReactNode;
  Footer?: React.ReactNode;
  testID?: string;
  space?: Space;
}

const MenuContainer = ({ scrollviewRef, children, testID, Footer, space = '36px' }: MenuContainerProps) => {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    // ios scroll fix
    <Inset bottom={{ custom: safeAreaInsets.bottom }} top={ios ? '12px' : undefined}>
      <ScrollView
        ref={scrollviewRef}
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
