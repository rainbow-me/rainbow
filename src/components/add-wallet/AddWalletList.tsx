import React from 'react';
import { AddWalletItem, AddWalletRow } from './AddWalletRow';
import { Separator } from '@/design-system/components/Separator/Separator';
import { Stack } from '@/design-system/components/Stack/Stack';

type AddWalletListProps = {
  items: AddWalletItem[];
  totalHorizontalInset: number;
};

export const AddWalletList = ({ items, totalHorizontalInset }: AddWalletListProps) => {
  return (
    <Stack space="24px" separator={<Separator color="divider60 (Deprecated)" />}>
      {items.map((item: AddWalletItem, index: number) => (
        <AddWalletRow key={typeof item.icon === 'string' ? item.icon : index} content={item} totalHorizontalInset={totalHorizontalInset} />
      ))}
    </Stack>
  );
};
