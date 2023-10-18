import * as React from 'react';
import { Box, Inline } from '@/design-system';
import { Navbar, navbarHeight } from '@/components/navbar/Navbar';
import { StickyHeader } from '../core/StickyHeaders';
import { useTheme } from '@/theme';

export const ProfileStickyHeaderHeight = 52;
const visiblePosition = ios ? navbarHeight : navbarHeight + 80;

export function ProfileStickyHeader() {
  const { colors } = useTheme();

  return (
    <StickyHeader name="profile-header" visibleAtYPosition={visiblePosition}>
      <Box
        justifyContent="center"
        height={{ custom: ProfileStickyHeaderHeight }}
        paddingHorizontal="19px (Deprecated)"
        testID="profile-sticky-header"
        style={{
          backgroundColor: colors.transparent,
          position: 'absolute',
          left: 120,
          top: -20,
          zIndex: 99,
        }}
      ></Box>
    </StickyHeader>
  );
}
