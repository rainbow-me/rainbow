import React from 'react';
import { Box, Text } from '@/design-system';
import { PrebuySection } from './PrebuySection';
import { AllocationBreakdown } from './AllocationBreakdown';
import { AirdropSection } from './AirdropSection';

export function TokenAllocationSection() {
  return (
    <Box gap={16} width="full" paddingVertical="20px">
      <Text color="labelSecondary" size="13pt" weight="heavy">
        Token Allocation
      </Text>
      <Box gap={8} width={'full'}>
        <AllocationBreakdown />
        <PrebuySection />
        <AirdropSection />
      </Box>
    </Box>
  );
}
