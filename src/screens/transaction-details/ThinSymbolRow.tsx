import React from 'react';
import { Box, Columns, Inline, Text } from '@/design-system';

type Props = {
  icon: string;
  title: string;
  value: string;
};

export const ThinSymbolRow: React.FC<Props> = ({ icon, title, value }) => {
  return (
    <Box paddingVertical="20px">
      <Inline alignVertical="center" wrap={false}>
        <Columns>
          <Inline space="10px">
            <Box
              width={{ custom: 40 }}
              alignItems="center"
              justifyContent="center"
            >
              <Text color={'label'} size="20pt" weight="bold">
                {icon}
              </Text>
            </Box>
            <Text color="label" size="17pt" weight="semibold">
              {title}
            </Text>
          </Inline>
          <Inline alignHorizontal="right">
            <Text
              color="labelTertiary"
              size="17pt"
              weight="medium"
              numberOfLines={1}
            >
              {value}
            </Text>
          </Inline>
        </Columns>
      </Inline>
    </Box>
  );
};
