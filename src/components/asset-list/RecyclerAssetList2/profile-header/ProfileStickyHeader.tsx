import * as React from 'react';
import { Box } from '@/design-system';
import { navbarHeight } from '@/components/navbar/Navbar';
import { StickyHeader } from '../core/StickyHeaders';
import { useTheme } from '@/theme';
import { IS_IOS } from '@/env';

export const ProfileStickyHeaderHeight = 52;
const visiblePosition = IS_IOS ? navbarHeight : navbarHeight + 80;

export const ProfileStickyHeader = React.memo(function ProfileStickyHeader() {
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
      />
    </StickyHeader>
  );
});
