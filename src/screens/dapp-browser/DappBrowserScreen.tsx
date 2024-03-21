import { DappBrowser } from '@/components/DappBrowser/DappBrowser';
import { Page } from '@/components/layout';
import { Box } from '@/design-system';
import React from 'react';

export default function DappBrowserScreen() {
  return (
    <Box as={Page} flex={1} height="full" width="full" alignItems="center" justifyContent="center">
      <DappBrowser />
    </Box>
  );
}
