import React from 'react';
import { Bleed, Box, Inset, Space } from '@/design-system';
import { ButtonPressAnimation, ButtonPressAnimationProps } from '../animations';

type NavbarItemProps = {
  children: React.ReactElement;
  onPress?: ButtonPressAnimationProps['onPress'];
  testID?: string;
};

export function NavbarItem({ children, onPress, testID }: NavbarItemProps) {
  const hitSlop: Space = '10px';
  return (
    <Bleed space={hitSlop}>
      <ButtonPressAnimation onPress={onPress} pointerEvents="auto" scaleTo={0.8} disallowInterruption testID={testID}>
        <Inset space={hitSlop}>{children}</Inset>
      </ButtonPressAnimation>
    </Bleed>
  );
}
