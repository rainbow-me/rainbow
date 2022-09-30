import * as React from 'react';
import { Box } from '@/design-system';
import { navbarHeight } from '@/components/navbar/Navbar';
import { StickyHeader } from '../core/StickyHeaders';
import { ProfileNameRow } from './ProfileNameRow';

export const ProfileStickyHeaderHeight = 52;

export function ProfileStickyHeader() {
  return (
    <StickyHeader
      name="profile-header"
      visibleAtYPosition={ios ? navbarHeight : navbarHeight + 80}
    >
      <Box
        background="body (Deprecated)"
        justifyContent="center"
        height={{ custom: ProfileStickyHeaderHeight }}
        paddingHorizontal="19px (Deprecated)"
        width="full"
        testID="profile-sticky-header"
      >
        <ProfileNameRow testIDPrefix="profile-name-sticky" />
      </Box>
    </StickyHeader>
  );
}
