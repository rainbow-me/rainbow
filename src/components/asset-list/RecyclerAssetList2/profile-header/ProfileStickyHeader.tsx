import * as React from 'react';
import { Box } from '@/design-system';
import { navbarHeight } from '@/components/navbar/Navbar';
import { StickyHeader } from '../core/StickyHeaders';
import { ProfileNameRow } from './ProfileNameRow';
import { useRecyclerAssetListPosition } from '../core/Contexts';

export const ProfileStickyHeaderHeight = 52;
const visiblePosition = ios ? navbarHeight : navbarHeight + 80;

type Props = {
  accountName?: string;
  accountENS?: string;
  accountAddress?: string;
};

export const ProfileStickyHeader: React.FC<Props> = ({
  accountName,
  accountENS,
  accountAddress,
}) => {
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
          accountName={accountName}
          accountENS={accountENS}
          accountAddress={accountAddress}
        />
      </Box>
    </StickyHeader>
  );
};
