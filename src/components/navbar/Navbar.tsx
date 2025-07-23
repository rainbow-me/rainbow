import React from 'react';
import { Box, Cover, Inline, Inset, Text } from '@/design-system';

import { NavbarSvgIcon } from './NavbarSvgIcon';
import { NavbarItem } from './NavbarItem';
import { NavbarTextIcon } from './NavbarTextIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { SharedValue, useAnimatedStyle, interpolate } from 'react-native-reanimated';

type NavbarProps = {
  hasStatusBarInset?: boolean;
  useScrollToTopOnPress?: boolean;
  leftComponent?: React.ReactElement | null;
  rightComponent?: React.ReactElement | null;
  scrollY?: SharedValue<number>;
  testID?: string;
  title?: string;
  titleComponent?: React.ReactElement | null;
  floating?: boolean;
};

export const navbarHeight = 60;
export const NAVBAR_HORIZONTAL_INSET = 20;

export function Navbar({
  hasStatusBarInset = false,
  leftComponent = <Box />,
  rightComponent = <Box />,
  scrollY,
  titleComponent = <Box />,
  testID,
  title,
  floating = false,
}: NavbarProps) {
  const { top: topInset } = useSafeAreaInsets();

  const animatedStyle = useAnimatedStyle(() => {
    if (!scrollY) {
      return {};
    }

    const translateY = interpolate(scrollY.value, [0, 200], [0, -30], 'clamp');

    const opacity = interpolate(scrollY.value, [0, 200], [1, 0], 'clamp');

    return {
      transform: [{ translateY }],
      opacity,
    };
  });

  const NavbarContent = (
    <>
      {hasStatusBarInset && <Box style={{ backgroundColor: 'transparent' }} height={{ custom: topInset }} />}
      <Box alignItems="center" height={{ custom: navbarHeight }} justifyContent="center" style={{ backgroundColor: 'transparent' }}>
        <Cover alignVertical="center" alignHorizontal="justify">
          <Box style={{ backgroundColor: 'transparent' }} width="full">
            <Inset horizontal={{ custom: NAVBAR_HORIZONTAL_INSET }}>
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
    </>
  );

  const containerStyle = floating
    ? {
        position: 'absolute' as const,
        top: hasStatusBarInset ? 0 : topInset,
        left: 0,
        right: 0,
        zIndex: 10,
        backgroundColor: 'transparent',
      }
    : {
        backgroundColor: 'transparent',
      };

  if (scrollY) {
    return (
      <Animated.View testID={testID} style={[containerStyle, animatedStyle]}>
        {NavbarContent}
      </Animated.View>
    );
  }

  return (
    <Box testID={testID} style={containerStyle}>
      {NavbarContent}
    </Box>
  );
}

Navbar.Item = NavbarItem;
Navbar.TextIcon = NavbarTextIcon;
Navbar.SvgIcon = NavbarSvgIcon;
