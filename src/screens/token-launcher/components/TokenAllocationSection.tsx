import React from 'react';
import * as i18n from '@/languages';
import { Box, Text } from '@/design-system';
import { PrebuySection } from './PrebuySection';
import { AllocationBreakdown } from './AllocationBreakdown';
import { AirdropSection } from './AirdropSection';

export function TokenAllocationSection() {
  return (
    <Box gap={16} paddingVertical={'20px'} width="full">
      <Box paddingHorizontal={'20px'}>
        <Text color="labelQuaternary" size="13pt" weight="heavy">
          {i18n.t(i18n.l.token_launcher.titles.token_allocation)}
        </Text>
      </Box>
      <Box gap={12} width={'full'}>
        <AllocationBreakdown />
        <PrebuySection />
        <AirdropSection />
      </Box>
    </Box>
  );
}
