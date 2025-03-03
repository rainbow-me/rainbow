import React from 'react';
import { Box, Text } from '@/design-system';
import { PrebuySection } from './PrebuySection';
import { AllocationBreakdown } from './AllocationBreakdown';
import { AirdropSection } from './AirdropSection';

export function TokenAllocationSection() {
  return (
    <Box gap={16} width="full">
      <Box paddingHorizontal={'20px'}>
        <Text color="labelQuaternary" size="13pt" weight="heavy">
          {'TOKEN ALLOCATION'}
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
