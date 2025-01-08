import React from 'react';
import { Box, TextIcon } from '@/design-system';
import { Shadow } from '@/design-system/layout/shadow';

export function SelectedAddressBadge({ size = 22, shadow = '12px' }: { size?: number; shadow?: Shadow }) {
  return (
    <Box
      width={{ custom: size }}
      height={{ custom: size }}
      borderRadius={size / 2}
      background="blue"
      alignItems="center"
      justifyContent="center"
      shadow={shadow}
    >
      <TextIcon color="label" size="icon 13px" weight="bold">
        􀆅
      </TextIcon>
    </Box>
  );
}
