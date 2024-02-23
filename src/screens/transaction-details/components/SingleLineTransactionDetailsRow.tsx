import React from 'react';
import { Box, Columns, Inline, Text } from '@/design-system';
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
