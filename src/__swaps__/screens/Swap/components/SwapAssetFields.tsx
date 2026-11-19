import React, { type ReactNode } from 'react';

import { Column, Columns, Stack } from '@/design-system';

export function SwapAssetFields({
  icon,
  amount,
  action,
  nativeValue,
  balance,
}: {
  icon: ReactNode;
  amount: ReactNode;
  action: ReactNode;
  nativeValue: ReactNode;
  balance: ReactNode;
}) {
  return (
    <Stack space="16px">
      <Columns alignHorizontal="justify" alignVertical="center">
        <Column width="content">{icon}</Column>
        {amount}
        <Column width="content">{action}</Column>
      </Columns>
      <Columns alignHorizontal="justify" alignVertical="center" space="10px">
        {nativeValue}
        <Column width="content">{balance}</Column>
      </Columns>
    </Stack>
  );
}
