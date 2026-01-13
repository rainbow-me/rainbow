import React from 'react';
import { Column, Columns } from '@/design-system/components/Columns/Columns';
import { Inline } from '@/design-system/components/Inline/Inline';
import { Stack } from '@/design-system/components/Stack/Stack';
import { Text } from '@/design-system/components/Text/Text';

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
