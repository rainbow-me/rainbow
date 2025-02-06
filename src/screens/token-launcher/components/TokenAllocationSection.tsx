import React from 'react';
import { Box, Text } from '@/design-system';
import { PrebuySection } from './PrebuySection';

function AllocationBreakdownPreview() {
  return (
    <Box>
      <Text color="labelSecondary" size="17pt" weight="heavy">
        Allocation Breakdown
      </Text>
    </Box>
  );
}

function AirdropSection() {
  return (
    <Box>
      <Text color="labelSecondary" size="17pt" weight="heavy">
        Airdrop
      </Text>
    </Box>
  );
}

export function TokenAllocationSection() {
  return (
    <Box gap={16} width="full" paddingVertical="20px">
      <Text color="labelSecondary" size="13pt" weight="heavy">
        Token Allocation
      </Text>
      <Box gap={8} width={'full'}>
        {/* <AllocationBreakdownPreview /> */}
        <PrebuySection />
        {/* <AirdropSection /> */}
      </Box>
    </Box>
  );
}
