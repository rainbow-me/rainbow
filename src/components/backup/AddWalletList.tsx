import React from 'react';
import { AddWalletItem, AddWalletRow } from './AddWalletRow';
import { Inset, Separator, Stack } from '@/design-system';

type AddWalletListProps = {
  items: AddWalletItem[];
  horizontalInset: number;
};
export const ConnectWalletList = ({
  items,
  horizontalInset,
}: AddWalletListProps) => {
  return (
    <Inset horizontal={{ custom: horizontalInset }} vertical="24px">
      <Stack
        space="24px"
        separator={<Separator color="divider60 (Deprecated)" />}
      >
        {items.map((item: AddWalletItem) => (
          <AddWalletRow
            key={item.icon}
            content={item}
            horizontalInset={horizontalInset}
          />
        ))}
      </Stack>
    </Inset>
  );
};
