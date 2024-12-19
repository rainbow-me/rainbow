import React from 'react';
import { Box } from '@/design-system';
import { useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';

interface RowProps {
  children: React.ReactNode;
  highlighted?: boolean;
}

export function Row({ children, highlighted }: RowProps) {
  const { accentColors } = useExpandedAssetSheetContext();

  return (
    <Box
      style={highlighted ? { backgroundColor: accentColors.opacity3, borderColor: accentColors.opacity2, borderWidth: 1.33 } : {}}
      borderRadius={14}
      paddingVertical="12px"
      paddingHorizontal="10px"
      justifyContent="space-between"
      flexDirection="row"
    >
      {children}
    </Box>
  );
}
