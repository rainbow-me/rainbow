import React from 'react';
import { Box, Cover, Inline, Inset, Text } from '@/design-system';

import { NavbarSvgIcon } from './NavbarSvgIcon';
import { NavbarItem } from './NavbarItem';
import { NavbarTextIcon } from './NavbarTextIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRecyclerListViewRef } from '../asset-list/RecyclerAssetList';

type NavbarProps = {
  hasStatusBarInset?: boolean;
  useScrollToTopOnPress?: boolean;
  leftComponent?: React.ReactElement | null;
  rightComponent?: React.ReactElement | null;
  testID?: string;
  title?: string;
  titleComponent?: React.ReactElement | null;
};

export const navbarHeight = 60;

export function Navbar({
  hasStatusBarInset = false,
  leftComponent = <Box />,
  rightComponent = <Box />,
  titleComponent = <Box />,
  testID,
  title,
}: NavbarProps) {
  const { top: topInset } = useSafeAreaInsets();
  const { ref } = useRecyclerListViewRef();

  return (
    <Box testID={testID} style={{ backgroundColor: 'transparent' }}>
      {hasStatusBarInset && <Box style={{ backgroundColor: 'transparent' }} height={{ custom: topInset }} />}
      <Box alignItems="center" height={{ custom: navbarHeight }} justifyContent="center" style={{ backgroundColor: 'transparent' }}>
        <Cover alignVertical="center" alignHorizontal="justify">
          <Box style={{ backgroundColor: 'transparent' }} width="full">
            <Inset horizontal="20px">
              <Inline alignHorizontal="justify" alignVertical="center">
                {leftComponent}
                {rightComponent}
              </Inline>
            </Inset>
          </Box>
        </Cover>
        <Text align="center" color="label" size="20pt" weight="heavy">
          {title}
        </Text>
        {titleComponent}
      </Box>
    </Box>
  );
}

Navbar.Item = NavbarItem;
Navbar.TextIcon = NavbarTextIcon;
Navbar.SvgIcon = NavbarSvgIcon;
