import React from 'react';
import { Bleed, Box } from '@/design-system';
import { Icon } from '@/components/icons';

export function SelectedAddressBadge({ size = 22 }: { size?: number }) {
  return (
    <Box
      width={{ custom: size }}
      height={{ custom: size }}
      borderRadius={size / 2}
      background="blue"
      alignItems="center"
      justifyContent="center"
      shadow="12px blue"
      left="0px"
      padding="4px"
    >
      <Icon color="white" name="checkmark" />
    </Box>
  );
}
