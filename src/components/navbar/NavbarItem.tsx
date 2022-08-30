import React from 'react';
import { PressableProps } from 'react-native';
import { Bleed, Box, Inset, Space } from '@/design-system';
import { ButtonPressAnimation } from '../animations';

type NavbarItemProps = {
  children: React.ReactElement;
  onPress: PressableProps['onPress'];
};

export function NavbarItem({ children, onPress }: NavbarItemProps) {
  const hitSlop: Space = '10px';
  return (
    <Bleed space={hitSlop}>
      <Box
        as={ButtonPressAnimation}
        // @ts-expect-error - JS component
        onPress={onPress}
        scale={0.8}
      >
        <Inset space={hitSlop}>{children}</Inset>
      </Box>
    </Bleed>
  );
}
