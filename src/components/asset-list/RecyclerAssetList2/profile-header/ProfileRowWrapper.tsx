import * as React from 'react';
import { Box } from '@/design-system';
import { ProfileStickyHeaderHeight } from './ProfileStickyHeader';

export function ProfileRowWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Box alignItems="center" width="full" marginTop={{ custom: -ProfileStickyHeaderHeight }}>
      {children}
    </Box>
  );
}
