import React from 'react';
import { Box, Cover, Inline, Inset, Text } from '@/design-system';

import { NavbarSvgIcon } from './NavbarSvgIcon';
import { NavbarItem } from './NavbarItem';
import { NavbarTextIcon } from './NavbarTextIcon';
import { safeAreaInsetValues } from '@/utils';

type NavbarProps = {
  hasStatusBarInset?: boolean;
  leftComponent?: React.ReactElement | null;
  rightComponent?: React.ReactElement | null;
  title?: string;
};

export const navbarHeight = 48;
export const navbarHeightWithInset = navbarHeight + safeAreaInsetValues.top;

export function Navbar({
  hasStatusBarInset = false,
  leftComponent = <Box />,
  rightComponent = <Box />,
  title,
}: NavbarProps) {
  return (
    <Box>
      {hasStatusBarInset && (
        <Box height={{ custom: safeAreaInsetValues.top }} />
      )}
      <Box
        height={{ custom: navbarHeight }}
        justifyContent="center"
        alignItems="center"
      >
        <Cover alignVertical="center" alignHorizontal="justify">
          <Box width="full">
            <Inset horizontal="19px (Deprecated)">
              <Inline alignHorizontal="justify" alignVertical="center">
                {leftComponent}
                {rightComponent}
              </Inline>
            </Inset>
          </Box>
        </Cover>
        <Inset top="1px (Deprecated)">
          <Text color="label" size="20pt" weight="heavy">
            {title}
          </Text>
        </Inset>
      </Box>
    </Box>
  );
}

Navbar.Item = NavbarItem;
Navbar.TextIcon = NavbarTextIcon;
Navbar.SvgIcon = NavbarSvgIcon;
