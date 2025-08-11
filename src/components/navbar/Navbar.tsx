import React from 'react';
import { Box, Text } from '@/design-system';
import { StyleSheet } from 'react-native';

import { NavbarSvgIcon } from './NavbarSvgIcon';
import { NavbarItem } from './NavbarItem';
import { NavbarTextIcon } from './NavbarTextIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NavbarProps = {
  hasStatusBarInset?: boolean;
  useScrollToTopOnPress?: boolean;
  leftComponent?: React.ReactElement | null;
  rightComponent?: React.ReactElement | null;
  testID?: string;
  title?: string;
  titleComponent?: React.ReactElement | null;
  isTitleInteractive?: boolean;
};

export const navbarHeight = 60;
export const NAVBAR_HORIZONTAL_INSET = 20;

export function Navbar({
  hasStatusBarInset = false,
  leftComponent = <Box />,
  rightComponent = <Box />,
  titleComponent = <Box />,
  testID,
  title,
  isTitleInteractive,
}: NavbarProps) {
  const { top: topInset } = useSafeAreaInsets();
  const pointerEvents = isTitleInteractive ? 'auto' : 'box-none';

  return (
    <Box testID={testID} style={{ backgroundColor: 'transparent' }} pointerEvents={pointerEvents}>
      {hasStatusBarInset && <Box style={{ backgroundColor: 'transparent' }} height={{ custom: topInset }} />}
      <Box
        alignItems="center"
        height={{ custom: navbarHeight }}
        justifyContent="center"
        style={{ backgroundColor: 'transparent' }}
        pointerEvents={pointerEvents}
      >
        <Box
          style={{
            justifyContent: 'space-between',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: NAVBAR_HORIZONTAL_INSET,
            backgroundColor: 'transparent',
            ...StyleSheet.absoluteFillObject,
          }}
          width="full"
          pointerEvents={pointerEvents}
        >
          {leftComponent}
          {rightComponent}
        </Box>
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
