import * as React from 'react';
import { Box } from '@/design-system';
import { StickyHeader } from '../core/StickyHeaders';
import { ProfileNameRow } from './ProfileNameRow';

export const ProfileStickyHeaderHeight = 52;

export function ProfileStickyHeader() {
  return (
    <StickyHeader name="profile-header" visibleAtYPosition={140}>
      <Box
        background="body"
        justifyContent="center"
        height={{ custom: ProfileStickyHeaderHeight }}
        paddingHorizontal="19px"
        width="full"
      >
        <ProfileNameRow />
      </Box>
    </StickyHeader>
  );
}
