import React from 'react';
import { Column, Columns, Inline, Stack, Text } from '@/design-system';

type Props = {
  leftComponent: React.ReactNode;
  secondaryValue?: string;
  title: string;
  value: string | number;
};

export const DoubleLineTransactionDetailsRow: React.FC<Props> = ({ leftComponent, secondaryValue, value, title }) => (
  <Columns space="10px" alignVertical="center">
    <Column width="content">{leftComponent}</Column>
    <Stack space="10px">
      <Inline>
        <Text color="labelTertiary" size="13pt" numberOfLines={1} weight="semibold">
          {title}
        </Text>
      </Inline>
      <Columns>
        <Text color="label" size="17pt" weight="semibold" numberOfLines={1}>
          {value}
        </Text>
        {secondaryValue !== undefined && (
          <Column width="content">
            <Text color="labelTertiary" size="17pt" weight="medium" numberOfLines={1}>
              {secondaryValue}
            </Text>
          </Column>
        )}
      </Columns>
    </Stack>
  </Columns>
);
