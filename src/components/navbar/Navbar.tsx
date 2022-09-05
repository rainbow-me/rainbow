import React from 'react';
import { useSafeArea } from 'react-native-safe-area-context';
import { Box, Inline, Inset } from '@/design-system';

import { NavbarSvgIcon } from './NavbarSvgIcon';
import { NavbarItem } from './NavbarItem';
import { NavbarTextIcon } from './NavbarTextIcon';

type NavbarProps = {
  leftComponent: React.ReactElement;
  rightComponent: React.ReactElement;
};

export function Navbar({ leftComponent, rightComponent }: NavbarProps) {
  const insets = useSafeArea();
  return (
    <Box>
      <Box height={{ custom: insets.top }} />
      <Box height={{ custom: 48 }} justifyContent="center">
        <Inset horizontal="19px">
          <Inline alignHorizontal="justify" alignVertical="center">
            {leftComponent}
            {rightComponent}
          </Inline>
        </Inset>
      </Box>
    </Box>
  );
}

export default Object.assign(Navbar, {
  Item: NavbarItem,
  TextIcon: NavbarTextIcon,
  SvgIcon: NavbarSvgIcon,
});
