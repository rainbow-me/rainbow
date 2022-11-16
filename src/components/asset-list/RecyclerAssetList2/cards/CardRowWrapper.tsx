import * as React from 'react';
import { Box, Inset } from '@/design-system';

export const CardRowWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <Inset horizontal="20px">
      <Box alignItems="center">{children}</Box>
    </Inset>
  );
};
