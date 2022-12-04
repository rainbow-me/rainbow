import React from 'react';
import { Box, Cover, Inline, Inset, Text } from '@/design-system';

import { NavbarSvgIcon } from './NavbarSvgIcon';
import { NavbarItem } from './NavbarItem';
import { NavbarTextIcon } from './NavbarTextIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileNameRow } from '../asset-list/RecyclerAssetList2/profile-header/ProfileNameRow';
import { useRecyclerListViewRef } from '../asset-list/RecyclerAssetList';

type NavbarProps = {
  hasStatusBarInset?: boolean;
  leftComponent?: React.ReactElement | null;
  rightComponent?: React.ReactElement | null;
  testID?: string;
  title?: string;
};

export const navbarHeight = 48;

export function Navbar({
  hasStatusBarInset = false,
  leftComponent = <Box />,
  rightComponent = <Box />,
  testID,
  title,
}: NavbarProps) {
  const { top: topInset } = useSafeAreaInsets();
  const { ref } = useRecyclerListViewRef();

  return (
    <Box testID={testID} style={{backgroundColor: 'transparent'}}>
      {hasStatusBarInset && <Box style={{backgroundColor: 'transparent'}} height={{ custom: topInset }} />}
      <Box
        height={{ custom: navbarHeight }}
        justifyContent="center"
        alignItems="center"
        style={{backgroundColor: 'transparent'}}
      >
        <Cover alignVertical="center" alignHorizontal="justify">
          <Box width="full" style={{backgroundColor: 'transparent'}}>
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
