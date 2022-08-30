import React from 'react';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { Box, Inline, Inset } from '@/design-system';

import { NavbarSvgIcon } from './NavbarSvgIcon';
import { NavbarItem } from './NavbarItem';
import { NavbarTextIcon } from './NavbarTextIcon';

const statusBarHeight = getStatusBarHeight(true);

type NavbarProps = {
  leftComponent: React.ReactElement;
  rightComponent: React.ReactElement;
};

export function Navbar({ leftComponent, rightComponent }: NavbarProps) {
  return (
    <Box>
      <Box height={{ custom: statusBarHeight }} />
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
