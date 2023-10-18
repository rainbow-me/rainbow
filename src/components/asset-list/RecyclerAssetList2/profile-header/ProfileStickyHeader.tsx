import * as React from 'react';
import { Box } from '@/design-system';
import { navbarHeight } from '@/components/navbar/Navbar';
import { StickyHeader } from '../core/StickyHeaders';
import { ProfileNameRow } from './ProfileNameRow';
import { useRecyclerAssetListPosition } from '../core/Contexts';

export const ProfileStickyHeaderHeight = 52;
const visiblePosition = ios ? navbarHeight : navbarHeight + 80;

export function ProfileStickyHeader() {
  const position = useRecyclerAssetListPosition();

  const [disabled, setDisabled] = React.useState(true);
  position!.addListener(({ value }) => {
    if (value < visiblePosition) {
      setDisabled(true);
    } else {
      setDisabled(false);
    }
  });

  return (
    <StickyHeader name="profile-header" visibleAtYPosition={visiblePosition}>
      <Box
        background="body (Deprecated)"
        justifyContent="center"
        height={{ custom: ProfileStickyHeaderHeight }}
        paddingHorizontal="19px (Deprecated)"
        width="full"
        testID="profile-sticky-header"
      >
        <ProfileNameRow
          disableOnPress={disabled}
          testIDPrefix="profile-name-sticky"
        />
      </Box>
    </StickyHeader>
  );
}
