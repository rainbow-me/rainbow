import React from 'react';
import { Bleed, Box, Inset, Space } from '@/design-system';
import { ButtonPressAnimation } from '../animations';

type NavbarItemProps = {
  children: React.ReactElement;
  onPress?: () => void;
  testID?: string;
};

export function NavbarItem({ children, onPress, testID }: NavbarItemProps) {
  const hitSlop: Space = '10px';
  return (
    <Bleed space={hitSlop}>
      <Box as={ButtonPressAnimation} onPress={onPress} scaleTo={0.8} disallowInterruption testID={testID}>
        <Inset space={hitSlop}>{children}</Inset>
      </Box>
    </Bleed>
  );
}
