import * as React from 'react';
import { Box } from '@/design-system/components/Box/Box';
import { Inset } from '@/design-system/components/Inset/Inset';

export const CardRowWrapper = React.memo(function CardRowWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Inset horizontal="20px">
      <Box alignItems="center">{children}</Box>
    </Inset>
  );
});
