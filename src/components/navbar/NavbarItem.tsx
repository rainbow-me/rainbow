import React from 'react';
import { PressableProps } from 'react-native';
import { Bleed } from '@/design-system/components/Bleed/Bleed';
import { Box } from '@/design-system/components/Box/Box';
import { Inset } from '@/design-system/components/Inset/Inset';
import type { Space } from '@/design-system/layout/space';
import { ButtonPressAnimation } from '../animations';

type NavbarItemProps = {
  children: React.ReactElement;
  onPress?: PressableProps['onPress'];
  testID?: string;
};

export function NavbarItem({ children, onPress, testID }: NavbarItemProps) {
  const hitSlop: Space = '10px';
  return (
    <Bleed space={hitSlop}>
      <Box as={ButtonPressAnimation} onPress={onPress} pointerEvents="auto" scale={0.8} disallowInterruption testID={testID}>
        <Inset space={hitSlop}>{children}</Inset>
      </Box>
    </Bleed>
  );
}
