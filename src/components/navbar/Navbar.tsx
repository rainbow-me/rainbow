import React from 'react';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { Box, Cover, Inline, Inset, Text } from '@/design-system';

import { NavbarSvgIcon } from './NavbarSvgIcon';
import { NavbarItem } from './NavbarItem';
import { NavbarTextIcon } from './NavbarTextIcon';

const statusBarHeight = getStatusBarHeight(true);

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
  return (
    <Box>
      {hasStatusBarInset && <Box height={{ custom: statusBarHeight }} />}
      <Box height={{ custom: 48 }} justifyContent="center" alignItems="center">
        <Cover alignVertical="center" alignHorizontal="justify">
          <Box width="full">
            <Inset horizontal="19px">
              <Inline alignHorizontal="justify" alignVertical="center">
                {leftComponent}
                {rightComponent}
              </Inline>
            </Inset>
          </Box>
        </Cover>
        <Inset top="1px">
          <Text size="20px" weight="heavy">
            {title}
          </Text>
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
