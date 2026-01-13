import React from 'react';
import { Bleed } from '@/design-system/components/Bleed/Bleed';
import { Separator } from '@/design-system/components/Separator/Separator';

export const TransactionDetailsDivider: React.FC = () => (
  <Bleed horizontal="20px">
    <Separator color="separatorTertiary" />
  </Bleed>
);
