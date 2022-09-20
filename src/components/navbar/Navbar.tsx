import React from 'react';
import { useSafeArea } from 'react-native-safe-area-context';
import { Box, Cover, Inline, Inset, Text } from '@/design-system';

import { NavbarSvgIcon } from './NavbarSvgIcon';
import { NavbarItem } from './NavbarItem';
import { NavbarTextIcon } from './NavbarTextIcon';

type NavbarProps = {
  hasStatusBarInset?: boolean;
  leftComponent?: React.ReactElement;
  rightComponent?: React.ReactElement;
  title?: string;
};

export function Navbar({
  hasStatusBarInset = false,
  leftComponent = <Box />,
  rightComponent = <Box />,
  title,
}: NavbarProps) {
  const insets = useSafeArea();
  return (
    <Box>
      {hasStatusBarInset && <Box height={{ custom: insets.top }} />}
      <Box height={{ custom: 48 }} justifyContent="center" alignItems="center">
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
