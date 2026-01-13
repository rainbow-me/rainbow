import React from 'react';
import { Box } from '@/design-system/components/Box/Box';
import { Columns } from '@/design-system/components/Columns/Columns';
import { Inline } from '@/design-system/components/Inline/Inline';
import { Text } from '@/design-system/components/Text/Text';
import { TransactionDetailsSymbol } from '@/screens/transaction-details/components/TransactionDetailsSymbol';

type Props = {
  icon: string;
  title: string;
  value: string;
};

export const SingleLineTransactionDetailsRow: React.FC<Props> = ({ icon, title, value }) => {
  return (
    <Inline alignVertical="center" wrap={false}>
      <Columns alignVertical="center">
        <Inline space="10px" alignVertical="center">
          <TransactionDetailsSymbol icon={icon} />
          <Text color="label" size="17pt" weight="semibold">
            {title}
          </Text>
        </Inline>
        <Inline alignHorizontal="right">
          <Text color="labelTertiary" size="17pt" weight="medium" numberOfLines={1}>
            {value}
          </Text>
        </Inline>
      </Columns>
    </Inline>
  );
};
