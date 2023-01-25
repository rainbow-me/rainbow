import React from 'react';
import { Bleed, Separator } from '@/design-system';

export const TransactionDetailsDivider: React.FC = () => (
  <Bleed horizontal={20}>
    <Separator color="separatorTertiary" />
  </Bleed>
);
