import { Box } from '@/design-system';
import React from 'react';

type Props = {
  children: React.ReactNode;
};

export const Layout = ({ children }: Props) => (
  <Box
    height="full"
    width="full"
    justifyContent="space-between"
    alignItems="center"
    paddingTop={{ custom: 55 }}
    paddingBottom={{ custom: 54 }}
  >
    {children}
  </Box>
);
