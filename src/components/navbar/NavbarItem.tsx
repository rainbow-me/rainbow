import React from 'react';
import { PressableProps } from 'react-native';
import { Bleed, Box, Inset, Space } from '@/design-system';
import { ButtonPressAnimation } from '../animations';

type NavbarItemProps = {
  children: React.ReactElement;
  onPress: PressableProps['onPress'];
  testID?: string;
};

export function NavbarItem({ children, onPress, testID }: NavbarItemProps) {
  const hitSlop: Space = '10px';
  return (
    <Bleed space={hitSlop}>
      <Box
        as={ButtonPressAnimation}
        // @ts-ignore overloaded props

        onPress={onPress}
        scale={0.8}
        testID={testID}
      >
        <Inset space={hitSlop}>{children}</Inset>
      </Box>
    </Bleed>
  );
}
