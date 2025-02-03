import React from 'react';
import { CollapsableField } from './CollapsableField';
import { Box } from '@/design-system';

export function LinksSection() {
  return (
    <CollapsableField title="Links">
      <Box flexDirection="row" gap={8}></Box>
    </CollapsableField>
  );
}
