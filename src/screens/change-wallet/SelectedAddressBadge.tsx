import React from 'react';
import { Box, TextIcon } from '@/design-system';

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
    >
      <TextIcon color="label" size="icon 13px" weight="bold">
        􀆅
      </TextIcon>
    </Box>
  );
}
